-- E-Commerce Sales Analytics Queries
-- This file documents the core SQL queries used to compute metrics and reports.

-- 1. Key Performance Indicators (KPIs)
-- Calculates totals, averages, and margins.
SELECT 
    COALESCE(SUM(sales), 0) AS total_sales,
    COALESCE(SUM(profit), 0) AS total_profit,
    COUNT(DISTINCT order_id) AS total_orders,
    COUNT(DISTINCT customer_id) AS total_customers,
    COALESCE(SUM(sales), 0) / NULLIF(COUNT(DISTINCT order_id), 0) AS average_order_value,
    (COALESCE(SUM(profit), 0) / NULLIF(SUM(sales), 0)) * 100 AS profit_margin,
    AVG(discount) AS average_discount,
    COALESCE(SUM(quantity), 0) AS total_quantity_sold
FROM sales;


-- 2. Monthly Sales & Profit Trend
-- Groups sales by month to show chronological patterns.
SELECT 
    TO_CHAR(order_date, 'YYYY-MM') AS month_key,
    COALESCE(SUM(sales), 0) AS total_sales,
    COALESCE(SUM(profit), 0) AS total_profit
FROM sales
GROUP BY TO_CHAR(order_date, 'YYYY-MM')
ORDER BY month_key;


-- 3. Sales & Profit by Category
-- Evaluates category performance.
SELECT 
    category,
    COALESCE(SUM(sales), 0) AS total_sales,
    COALESCE(SUM(profit), 0) AS total_profit
FROM sales
GROUP BY category
ORDER BY total_sales DESC;


-- 4. Sales by Subcategory
-- Provides a granular view of product classes.
SELECT 
    category,
    sub_category,
    COALESCE(SUM(sales), 0) AS total_sales
FROM sales
GROUP BY category, sub_category
ORDER BY total_sales DESC;


-- 5. Top 10 Products by Sales (using RANK)
-- Ranks products according to total sales revenue.
WITH ProductRankings AS (
    SELECT 
        product_id,
        product_name,
        category,
        SUM(sales) AS total_sales,
        RANK() OVER (ORDER BY SUM(sales) DESC) AS sales_rank
    FROM sales
    GROUP BY product_id, product_name, category
)
SELECT 
    product_id,
    product_name,
    category,
    total_sales,
    sales_rank
FROM ProductRankings
WHERE sales_rank <= 10;


-- 6. Bottom 10 Products by Profit (using RANK)
-- Identifies products generating the highest losses.
WITH ProductLossRankings AS (
    SELECT 
        product_id,
        product_name,
        category,
        SUM(profit) AS total_profit,
        RANK() OVER (ORDER BY SUM(profit) ASC) AS profit_rank
    FROM sales
    GROUP BY product_id, product_name, category
)
SELECT 
    product_id,
    product_name,
    category,
    total_profit,
    profit_rank
FROM ProductLossRankings
WHERE profit_rank <= 10;


-- 7. Top 10 Customers
-- Lists the highest spending customer accounts.
SELECT 
    customer_id,
    customer_name,
    COUNT(DISTINCT order_id) AS total_orders,
    COALESCE(SUM(sales), 0) AS total_sales,
    COALESCE(SUM(profit), 0) AS total_profit
FROM sales
GROUP BY customer_id, customer_name
ORDER BY total_sales DESC
LIMIT 10;


-- 8. Sales & Profit by Region
-- Breaks down performance by geographic region.
SELECT 
    region,
    COALESCE(SUM(sales), 0) AS total_sales,
    COALESCE(SUM(profit), 0) AS total_profit
FROM sales
GROUP BY region
ORDER BY total_sales DESC;


-- 9. Sales & Profit by Customer Segment
-- Compares B2B, Consumer, and Corporate segment contribution.
SELECT 
    segment,
    COALESCE(SUM(sales), 0) AS total_sales,
    COALESCE(SUM(profit), 0) AS total_profit
FROM sales
GROUP BY segment
ORDER BY total_sales DESC;


-- 10. Discount versus Profit (Discount Impact)
-- Demonstrates the relationship between discount levels and profitability.
SELECT 
    discount,
    COALESCE(SUM(profit), 0) AS total_profit,
    COALESCE(SUM(sales), 0) AS total_sales,
    COUNT(*) AS row_count
FROM sales
GROUP BY discount
ORDER BY discount;


-- 11. Month-over-Month Sales Growth (using LAG window function)
-- Tracks the rate of expansion/contraction in monthly sales.
WITH MonthlySales AS (
    SELECT 
        TO_CHAR(order_date, 'YYYY-MM') AS month_key,
        SUM(sales) AS total_sales
    FROM sales
    GROUP BY TO_CHAR(order_date, 'YYYY-MM')
)
SELECT 
    month_key,
    total_sales,
    LAG(total_sales) OVER (ORDER BY month_key) AS prev_month_sales,
    (total_sales - LAG(total_sales) OVER (ORDER BY month_key)) AS sales_diff,
    CASE 
        WHEN LAG(total_sales) OVER (ORDER BY month_key) IS NULL OR LAG(total_sales) OVER (ORDER BY month_key) = 0 THEN 0.0
        ELSE ((total_sales - LAG(total_sales) OVER (ORDER BY month_key)) / LAG(total_sales) OVER (ORDER BY month_key)) * 100
    END AS growth_percentage
FROM MonthlySales
ORDER BY month_key;


-- 12. Repeat Customer Count
-- Counts customers with more than 1 distinct order.
WITH CustomerOrderCounts AS (
    SELECT 
        customer_id,
        COUNT(DISTINCT order_id) AS order_count
    FROM sales
    GROUP BY customer_id
)
SELECT 
    COUNT(*) AS total_customers,
    SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END) AS repeat_customers,
    (SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0)) * 100 AS repeat_rate
FROM CustomerOrderCounts;
