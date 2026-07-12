from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date
from typing import Optional, Dict, Any, List

def get_filter_clause(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    segment: Optional[str] = None
) -> tuple[str, dict]:
    clauses = []
    params = {}
    
    if start_date:
        clauses.append("order_date >= :start_date")
        params["start_date"] = start_date
    if end_date:
        clauses.append("order_date <= :end_date")
        params["end_date"] = end_date
    if category and category.strip():
        clauses.append("category = :category")
        params["category"] = category.strip()
    if sub_category and sub_category.strip():
        clauses.append("sub_category = :sub_category")
        params["sub_category"] = sub_category.strip()
    if region and region.strip():
        clauses.append("region = :region")
        params["region"] = region.strip()
    if state and state.strip():
        clauses.append("state = :state")
        params["state"] = state.strip()
    if segment and segment.strip():
        clauses.append("segment = :segment")
        params["segment"] = segment.strip()
        
    clause_str = " AND ".join(clauses)
    if clause_str:
        return f" AND {clause_str}", params
    return "", params

def get_kpis(db: Session, filters_str: str, params: dict) -> Dict[str, Any]:
    sql = f"""
    SELECT 
        COALESCE(SUM(sales), 0) AS total_sales,
        COALESCE(SUM(profit), 0) AS total_profit,
        COUNT(DISTINCT order_id) AS total_orders,
        COUNT(DISTINCT customer_id) AS total_customers,
        COALESCE(SUM(sales), 0) / NULLIF(COUNT(DISTINCT order_id), 0) AS average_order_value,
        (COALESCE(SUM(profit), 0) / NULLIF(SUM(sales), 0)) * 100 AS profit_margin,
        COALESCE(AVG(discount), 0) AS average_discount,
        COALESCE(SUM(quantity), 0) AS total_quantity_sold
    FROM sales
    WHERE 1=1 {filters_str}
    """
    res = db.execute(text(sql), params).first()
    if not res or res.total_orders == 0:
        return {
            "total_sales": 0.0,
            "total_profit": 0.0,
            "total_orders": 0,
            "total_customers": 0,
            "average_order_value": 0.0,
            "profit_margin": 0.0,
            "average_discount": 0.0,
            "total_quantity_sold": 0
        }
        
    return {
        "total_sales": float(res.total_sales),
        "total_profit": float(res.total_profit),
        "total_orders": int(res.total_orders),
        "total_customers": int(res.total_customers),
        "average_order_value": float(res.average_order_value or 0.0),
        "profit_margin": float(res.profit_margin or 0.0),
        "average_discount": float(res.average_discount or 0.0),
        "total_quantity_sold": int(res.total_quantity_sold or 0)
    }

def get_monthly_sales(db: Session, filters_str: str, params: dict) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT 
        TO_CHAR(order_date, 'YYYY-MM') AS month_key,
        COALESCE(SUM(sales), 0) AS total_sales,
        COALESCE(SUM(profit), 0) AS total_profit
    FROM sales
    WHERE 1=1 {filters_str}
    GROUP BY TO_CHAR(order_date, 'YYYY-MM')
    ORDER BY month_key
    """
    rows = db.execute(text(sql), params).all()
    return [{"month": r.month_key, "sales": float(r.total_sales), "profit": float(r.total_profit)} for r in rows]

def get_category_sales(db: Session, filters_str: str, params: dict) -> Dict[str, Any]:
    # Category sales
    sql = f"""
    SELECT 
        category,
        COALESCE(SUM(sales), 0) AS total_sales,
        COALESCE(SUM(profit), 0) AS total_profit
    FROM sales
    WHERE 1=1 {filters_str}
    GROUP BY category
    ORDER BY total_sales DESC
    """
    rows = db.execute(text(sql), params).all()
    
    # Subcategory sales (requested report)
    sub_sql = f"""
    SELECT 
        category,
        sub_category,
        COALESCE(SUM(sales), 0) AS total_sales,
        COALESCE(SUM(profit), 0) AS total_profit
    FROM sales
    WHERE 1=1 {filters_str}
    GROUP BY category, sub_category
    ORDER BY total_sales DESC
    """
    sub_rows = db.execute(text(sub_sql), params).all()
    
    return {
        "categories": [{"category": r.category, "sales": float(r.total_sales), "profit": float(r.total_profit)} for r in rows],
        "sub_categories": [{"category": r.category, "sub_category": r.sub_category, "sales": float(r.total_sales), "profit": float(r.total_profit)} for r in sub_rows]
    }

def get_category_profit(db: Session, filters_str: str, params: dict) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT 
        category,
        COALESCE(SUM(profit), 0) AS total_profit
    FROM sales
    WHERE 1=1 {filters_str}
    GROUP BY category
    ORDER BY total_profit DESC
    """
    rows = db.execute(text(sql), params).all()
    return [{"category": r.category, "profit": float(r.total_profit)} for r in rows]

def get_top_products(db: Session, filters_str: str, params: dict) -> Dict[str, Any]:
    # Top 10 products by sales using RANK()
    top_sql = f"""
    WITH Ranked AS (
        SELECT 
            product_id,
            product_name,
            category,
            COALESCE(SUM(sales), 0) AS total_sales,
            RANK() OVER (ORDER BY SUM(sales) DESC) as rank_num
        FROM sales
        WHERE 1=1 {filters_str}
        GROUP BY product_id, product_name, category
    )
    SELECT product_id, product_name, category, total_sales, rank_num
    FROM Ranked
    WHERE rank_num <= 10
    ORDER BY total_sales DESC
    """
    top_rows = db.execute(text(top_sql), params).all()
    
    # Bottom 10 products by profit using RANK()
    bottom_sql = f"""
    WITH Ranked AS (
        SELECT 
            product_id,
            product_name,
            category,
            COALESCE(SUM(profit), 0) AS total_profit,
            RANK() OVER (ORDER BY SUM(profit) ASC) as rank_num
        FROM sales
        WHERE 1=1 {filters_str}
        GROUP BY product_id, product_name, category
    )
    SELECT product_id, product_name, category, total_profit, rank_num
    FROM Ranked
    WHERE rank_num <= 10
    ORDER BY total_profit ASC
    """
    bottom_rows = db.execute(text(bottom_sql), params).all()
    
    return {
        "top_sales": [{"product_id": r.product_id, "product_name": r.product_name, "category": r.category, "sales": float(r.total_sales), "rank": r.rank_num} for r in top_rows],
        "bottom_profit": [{"product_id": r.product_id, "product_name": r.product_name, "category": r.category, "profit": float(r.total_profit), "rank": r.rank_num} for r in bottom_rows]
    }

def get_top_customers(db: Session, filters_str: str, params: dict) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT 
        customer_id,
        customer_name,
        COALESCE(SUM(sales), 0) AS total_sales,
        COALESCE(SUM(profit), 0) AS total_profit,
        COUNT(DISTINCT order_id) AS total_orders
    FROM sales
    WHERE 1=1 {filters_str}
    GROUP BY customer_id, customer_name
    ORDER BY total_sales DESC
    LIMIT 10
    """
    rows = db.execute(text(sql), params).all()
    return [{"customer_id": r.customer_id, "customer_name": r.customer_name, "sales": float(r.total_sales), "profit": float(r.total_profit), "orders": int(r.total_orders)} for r in rows]

def get_region_sales(db: Session, filters_str: str, params: dict) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT 
        region,
        COALESCE(SUM(sales), 0) AS total_sales,
        COALESCE(SUM(profit), 0) AS total_profit
    FROM sales
    WHERE 1=1 {filters_str}
    GROUP BY region
    ORDER BY total_sales DESC
    """
    rows = db.execute(text(sql), params).all()
    return [{"region": r.region, "sales": float(r.total_sales), "profit": float(r.total_profit)} for r in rows]

def get_segment_sales(db: Session, filters_str: str, params: dict) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT 
        segment,
        COALESCE(SUM(sales), 0) AS total_sales,
        COALESCE(SUM(profit), 0) AS total_profit
    FROM sales
    WHERE 1=1 {filters_str}
    GROUP BY segment
    ORDER BY total_sales DESC
    """
    rows = db.execute(text(sql), params).all()
    return [{"segment": r.segment, "sales": float(r.total_sales), "profit": float(r.total_profit)} for r in rows]

def get_discount_impact(db: Session, filters_str: str, params: dict) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT 
        discount,
        COALESCE(SUM(profit), 0) AS total_profit,
        COALESCE(SUM(sales), 0) AS total_sales,
        COUNT(*) as row_count
    FROM sales
    WHERE 1=1 {filters_str}
    GROUP BY discount
    ORDER BY discount
    """
    rows = db.execute(text(sql), params).all()
    return [{"discount": float(r.discount), "profit": float(r.total_profit), "sales": float(r.total_sales), "count": int(r.row_count)} for r in rows]

def get_monthly_growth(db: Session, filters_str: str, params: dict) -> List[Dict[str, Any]]:
    sql = f"""
    WITH MonthlySales AS (
        SELECT 
            TO_CHAR(order_date, 'YYYY-MM') AS month_key,
            SUM(sales) AS total_sales
        FROM sales
        WHERE 1=1 {filters_str}
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
    ORDER BY month_key
    """
    rows = db.execute(text(sql), params).all()
    return [
        {
            "month": r.month_key,
            "sales": float(r.total_sales or 0.0),
            "prev_sales": float(r.prev_month_sales or 0.0),
            "growth_amount": float(r.sales_diff or 0.0),
            "growth_percentage": float(r.growth_percentage or 0.0)
        }
        for r in rows
    ]

def get_insights(db: Session, filters_str: str, params: dict) -> Dict[str, Any]:
    # Check if there is data
    check_sql = f"SELECT COUNT(*) FROM sales WHERE 1=1 {filters_str}"
    count = db.execute(text(check_sql), params).scalar()
    if not count:
        return {
            "best_performing_category": "No Data",
            "lowest_profit_category": "No Data",
            "highest_sales_region": "No Data",
            "fastest_growing_month": "No Data",
            "product_highest_sales": "No Data",
            "customer_highest_spending": "No Data",
            "discount_impact_status": "No Data"
        }

    # Best-performing category
    sql_cat = f"""
    SELECT category 
    FROM sales 
    WHERE 1=1 {filters_str} 
    GROUP BY category 
    ORDER BY SUM(sales) DESC 
    LIMIT 1
    """
    best_cat = db.execute(text(sql_cat), params).scalar() or "N/A"

    # Lowest-profit category
    sql_cat_profit = f"""
    SELECT category 
    FROM sales 
    WHERE 1=1 {filters_str} 
    GROUP BY category 
    ORDER BY SUM(profit) ASC 
    LIMIT 1
    """
    lowest_cat = db.execute(text(sql_cat_profit), params).scalar() or "N/A"

    # Highest-sales region
    sql_reg = f"""
    SELECT region 
    FROM sales 
    WHERE 1=1 {filters_str} 
    GROUP BY region 
    ORDER BY SUM(sales) DESC 
    LIMIT 1
    """
    highest_reg = db.execute(text(sql_reg), params).scalar() or "N/A"

    # Product with highest sales
    sql_prod = f"""
    SELECT product_name 
    FROM sales 
    WHERE 1=1 {filters_str} 
    GROUP BY product_id, product_name 
    ORDER BY SUM(sales) DESC 
    LIMIT 1
    """
    highest_prod = db.execute(text(sql_prod), params).scalar() or "N/A"

    # Customer with highest spending
    sql_cust = f"""
    SELECT customer_name 
    FROM sales 
    WHERE 1=1 {filters_str} 
    GROUP BY customer_id, customer_name 
    ORDER BY SUM(sales) DESC 
    LIMIT 1
    """
    highest_cust = db.execute(text(sql_cust), params).scalar() or "N/A"

    # Fastest-growing month (highest MoM growth percentage)
    sql_growth = f"""
    WITH MonthlySales AS (
        SELECT 
            TO_CHAR(order_date, 'YYYY-MM') AS month_key,
            SUM(sales) AS total_sales
        FROM sales
        WHERE 1=1 {filters_str}
        GROUP BY TO_CHAR(order_date, 'YYYY-MM')
    )
    SELECT 
        month_key,
        CASE 
            WHEN LAG(total_sales) OVER (ORDER BY month_key) IS NULL OR LAG(total_sales) OVER (ORDER BY month_key) = 0 THEN 0.0
            ELSE ((total_sales - LAG(total_sales) OVER (ORDER BY month_key)) / LAG(total_sales) OVER (ORDER BY month_key)) * 100
        END AS growth_percentage
    FROM MonthlySales
    ORDER BY growth_percentage DESC
    LIMIT 1
    """
    fastest_month_row = db.execute(text(sql_growth), params).first()
    fastest_month = "N/A"
    if fastest_month_row and fastest_month_row.growth_percentage > 0:
        fastest_month = f"{fastest_month_row.month_key} (+{fastest_month_row.growth_percentage:.1f}%)"

    # Check discount vs profit relationship
    # Compare average profit on transactions with high discount (e.g. >= 20%) vs low/no discount (< 20%)
    sql_disc = f"""
    SELECT 
        COALESCE(AVG(CASE WHEN discount >= 0.20 THEN profit END), 0) AS high_discount_avg_profit,
        COALESCE(AVG(CASE WHEN discount < 0.20 THEN profit END), 0) AS low_discount_avg_profit
    FROM sales
    WHERE 1=1 {filters_str}
    """
    disc_row = db.execute(text(sql_disc), params).first()
    
    discount_status = "No association found"
    if disc_row:
        high_prof = float(disc_row.high_discount_avg_profit)
        low_prof = float(disc_row.low_discount_avg_profit)
        
        if high_prof < 0 and low_prof > 0:
            discount_status = f"High discounts (>=20%) are strongly associated with losses (average profit: ${high_prof:.2f} vs low-discount profit: ${low_prof:.2f})."
        elif high_prof < low_prof:
            discount_status = f"High discounts lower profitability (average profit: ${high_prof:.2f} vs low-discount profit: ${low_prof:.2f})."
        else:
            discount_status = f"High discounts maintain healthy profitability (average profit: ${high_prof:.2f})."

    return {
        "best_performing_category": best_cat,
        "lowest_profit_category": lowest_cat,
        "highest_sales_region": highest_reg,
        "fastest_growing_month": fastest_month,
        "product_highest_sales": highest_prod,
        "customer_highest_spending": highest_cust,
        "discount_impact_status": discount_status
    }
