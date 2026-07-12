import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, ArrowRight, Award, MapPin, 
  ShoppingBag, Sparkles, HelpCircle, Package, AlertCircle 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';

import { api } from '../services/api';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    category: '',
    sub_category: '',
    region: '',
    state: '',
    segment: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    sub_categories: [],
    regions: [],
    states: [],
    segments: [],
    min_date: '',
    max_date: ''
  });

  // Analytics states
  const [kpis, setKpis] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [catSales, setCatSales] = useState({ categories: [], sub_categories: [] });
  const [catProfit, setCatProfit] = useState([]);
  const [topProducts, setTopProducts] = useState({ top_sales: [], bottom_profit: [] });
  const [topCustomers, setTopCustomers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [segments, setSegments] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [insights, setInsights] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dropdown options once on mount
  useEffect(() => {
    const fetchFilterOpts = async () => {
      try {
        const opts = await api.getFilterOptions();
        setFilterOptions(opts);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchFilterOpts();
  }, []);

  // Fetch dashboard data on filter change
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        kpiRes,
        monthlyRes,
        catSalesRes,
        catProfitRes,
        productsRes,
        customersRes,
        regionsRes,
        segmentsRes,
        discountsRes,
        growthRes,
        insightsRes
      ] = await Promise.all([
        api.getKPIs(filters),
        api.getMonthlySales(filters),
        api.getCategorySales(filters),
        api.getCategoryProfit(filters),
        api.getTopProducts(filters),
        api.getTopCustomers(filters),
        api.getRegionSales(filters),
        api.getSegmentSales(filters),
        api.getDiscountImpact(filters),
        api.getMonthlyGrowth(filters),
        api.getInsights(filters)
      ]);

      setKpis(kpiRes);
      setMonthly(monthlyRes);
      setCatSales(catSalesRes);
      setCatProfit(catProfitRes);
      setTopProducts(productsRes);
      setTopCustomers(customersRes);
      setRegions(regionsRes);
      setSegments(segmentsRes);
      setDiscounts(discountsRes);
      setGrowth(growthRes);
      setInsights(insightsRes);
    } catch (err) {
      setError(err.message || 'Failed to load analytical dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      category: '',
      sub_category: '',
      region: '',
      state: '',
      segment: ''
    });
  };

  // Check if DB is empty
  const isDatabaseEmpty = !loading && (!kpis || kpis.total_orders === 0);

  // Chart configs & data mappings
  const monthlySalesChartData = {
    labels: monthly.map(d => d.month),
    datasets: [
      {
        label: 'Monthly Sales ($)',
        data: monthly.map(d => d.sales),
        borderColor: 'hsl(221, 83%, 53%)',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Monthly Profit ($)',
        data: monthly.map(d => d.profit),
        borderColor: 'hsl(142, 71%, 45%)',
        backgroundColor: 'transparent',
        tension: 0.3,
        borderDash: [5, 5],
        yAxisID: 'y'
      }
    ]
  };

  const catSalesChartData = {
    labels: catSales.categories.map(c => c.category),
    datasets: [
      {
        label: 'Total Sales ($)',
        data: catSales.categories.map(c => c.sales),
        backgroundColor: 'hsl(221, 83%, 53%)',
        borderRadius: 6
      }
    ]
  };

  const catProfitChartData = {
    labels: catProfit.map(c => c.category),
    datasets: [
      {
        label: 'Total Profit ($)',
        data: catProfit.map(c => c.profit),
        backgroundColor: catProfit.map(c => c.profit >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'),
        borderRadius: 6
      }
    ]
  };

  const regionSalesChartData = {
    labels: regions.map(r => r.region),
    datasets: [
      {
        label: 'Sales Revenue ($)',
        data: regions.map(r => r.sales),
        backgroundColor: 'hsl(221, 83%, 65%)',
        borderRadius: 6
      }
    ]
  };

  const segmentChartData = {
    labels: segments.map(s => s.segment),
    datasets: [
      {
        label: 'Sales Breakdown ($)',
        data: segments.map(s => s.sales),
        backgroundColor: [
          'hsl(221, 83%, 53%)',
          'hsl(142, 71%, 45%)',
          'hsl(38, 92%, 50%)'
        ],
        borderWidth: 1
      }
    ]
  };

  const topProductsChartData = {
    labels: topProducts.top_sales.map(p => p.product_name.length > 25 ? p.product_name.substring(0, 25) + '...' : p.product_name),
    datasets: [
      {
        label: 'Sales ($)',
        data: topProducts.top_sales.map(p => p.sales),
        backgroundColor: 'hsl(221, 83%, 53%)',
        borderRadius: 4
      }
    ]
  };

  const topCustomersChartData = {
    labels: topCustomers.map(c => c.customer_name),
    datasets: [
      {
        label: 'Total Spends ($)',
        data: topCustomers.map(c => c.sales),
        backgroundColor: 'hsl(142, 71%, 45%)',
        borderRadius: 4
      }
    ]
  };

  const discountScatterChartData = {
    datasets: [
      {
        label: 'Discount vs Profit',
        // Multiply by 100 to show readable percentage (e.g. 20% instead of 0.2)
        data: discounts.map(d => ({ x: d.discount <= 1.0 ? d.discount * 100 : d.discount, y: d.profit })),
        backgroundColor: 'hsl(0, 84%, 60%)',
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // General Chart Options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { grid: { color: 'var(--border)' } },
      x: { grid: { display: false } }
    }
  };

  const horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { color: 'var(--border)' } },
      y: { grid: { display: false } }
    }
  };

  return (
    <div className="page-content">
      {/* Title */}
      <div className="header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>Executive Analytics Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Monitor key health indicators, revenue pipelines, and product margin performance.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        filterOptions={filterOptions} 
        onReset={handleResetFilters} 
      />

      {error && (
        <div className="alert alert-danger">
          <div className="alert-icon"><AlertCircle size={20} /></div>
          <div className="alert-content">
            <h4>Failed to Load Analytics</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loader-wrapper">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Compiling transactional database analytics...</p>
        </div>
      ) : isDatabaseEmpty ? (
        <div className="empty-state" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <Package className="empty-state-icon" />
          <h3>Database is Empty</h3>
          <p>No transaction sales records are currently registered. Please import a CSV sheet in the "Upload Data" page to populate the executive dashboard.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="kpi-grid">
            <KPICard type="sales" title="Total Sales" value={kpis.total_sales} />
            <KPICard type="profit" title="Total Profit" value={kpis.total_profit} />
            <KPICard type="orders" title="Total Orders" value={kpis.total_orders} />
            <KPICard type="customers" title="Unique Customers" value={kpis.total_customers} />
            <KPICard type="aov" title="Avg Order Value" value={kpis.average_order_value} />
            <KPICard type="margin" title="Profit Margin" value={kpis.profit_margin} />
          </div>

          {/* Business Insights Panel */}
          {insights && (
            <div className="insights-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <Sparkles size={18} style={{ color: 'var(--warning)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700 }}>AI-Driven Rules-Based Insights</h3>
              </div>
              <div className="insights-grid">
                <div className="insight-item success">
                  <div className="insight-icon"><Award size={18} /></div>
                  <div className="insight-details">
                    <h4>Best Performing Category</h4>
                    <p>{insights.best_performing_category}</p>
                  </div>
                </div>

                <div className="insight-item danger">
                  <div className="insight-icon"><TrendingDown size={18} /></div>
                  <div className="insight-details">
                    <h4>Lowest Profit Category</h4>
                    <p>{insights.lowest_profit_category}</p>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-icon"><MapPin size={18} /></div>
                  <div className="insight-details">
                    <h4>Highest Sales Region</h4>
                    <p>{insights.highest_sales_region}</p>
                  </div>
                </div>

                <div className="insight-item warning">
                  <div className="insight-icon"><TrendingUp size={18} /></div>
                  <div className="insight-details">
                    <h4>Fastest Growing Month</h4>
                    <p>{insights.fastest_growing_month || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.9rem' }}>
                  🥇 <strong>Top Product by Sales:</strong> <span style={{ color: 'var(--text-secondary)' }}>{insights.product_highest_sales}</span>
                </p>
                <p style={{ fontSize: '0.9rem' }}>
                  👤 <strong>Top Spender Account:</strong> <span style={{ color: 'var(--text-secondary)' }}>{insights.customer_highest_spending}</span>
                </p>
                <p style={{ fontSize: '0.9rem', padding: '10px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--danger)' }}>
                  ⚠️ <strong>Discount Impact Evaluation:</strong> {insights.discount_impact_status}
                </p>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Monthly Trend - Line */}
            <div className="chart-card span-2">
              <div className="chart-header">
                <span className="chart-title">Monthly Sales & Profit Growth Trend</span>
              </div>
              <div className="chart-container">
                <Line 
                  data={monthlySalesChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { grid: { color: 'var(--border)' } },
                      x: { grid: { display: false } }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Sales by Category - Bar */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Revenue by Category</span>
              </div>
              <div className="chart-container">
                <Bar data={catSalesChartData} options={barOptions} />
              </div>
            </div>

            {/* Profit by Category - Bar */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Profitability by Category</span>
              </div>
              <div className="chart-container">
                <Bar data={catProfitChartData} options={barOptions} />
              </div>
            </div>

            {/* Sales by Region - Bar */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Sales by Region</span>
              </div>
              <div className="chart-container">
                <Bar data={regionSalesChartData} options={barOptions} />
              </div>
            </div>

            {/* Sales by Segment - Doughnut */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Sales Distribution by Segment</span>
              </div>
              <div className="chart-container" style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: '280px', width: '100%' }}>
                  <Doughnut data={segmentChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            {/* Top Products - Horizontal Bar */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Top 10 Products by Sales Volume</span>
              </div>
              <div className="chart-container">
                <Bar data={topProductsChartData} options={horizontalBarOptions} />
              </div>
            </div>

            {/* Top Customers - Horizontal Bar */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Top 10 Customers by Purchase Value</span>
              </div>
              <div className="chart-container">
                <Bar data={topCustomersChartData} options={horizontalBarOptions} />
              </div>
            </div>

            {/* Discount vs Profit - Scatter */}
            <div className="chart-card span-2">
              <div className="chart-header">
                <span className="chart-title">Discount vs Profit Correlation</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>x: Discount %, y: Profit $</p>
              </div>
              <div className="chart-container">
                <Scatter 
                  data={discountScatterChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: { display: true, text: 'Discount Rate (%)', color: 'var(--text-secondary)' },
                        grid: { color: 'var(--border)' }
                      },
                      y: {
                        title: { display: true, text: 'Profit ($)', color: 'var(--text-secondary)' },
                        grid: { color: 'var(--border)' }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
