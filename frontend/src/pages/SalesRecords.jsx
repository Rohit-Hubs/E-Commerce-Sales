import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

const formatPercent = (val) => {
  const pct = val <= 1.0 && val > 0 ? val * 100 : val;
  return `${pct.toFixed(1)}%`;
};

const SalesRecords = () => {
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search trigger
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSales({
        page,
        limit,
        search,
        sort_by: sortBy,
        sort_desc: sortDesc
      });
      setRecords(data.records || []);
      setTotalRecords(data.total_records || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve sales records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, limit, search, sortBy, sortDesc]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
    setPage(1); // Reset back to first page on sort change
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const renderSortIndicator = (column) => {
    if (sortBy !== column) return null;
    return sortDesc ? ' ↓' : ' ↑';
  };

  return (
    <div className="page-content">
      <div className="header-title">
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Sales Ledger</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View, sort, and inspect transactional data loaded in the system.</p>
      </div>

      <div className="table-card">
        {/* Controls: Search and Page size */}
        <div className="table-controls">
          <div className="search-input-wrapper">
            <Search />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search by Order ID, Customer, or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Rows per page:</label>
            <select 
              className="filter-input" 
              style={{ width: '80px', padding: '6px 10px' }}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <div className="alert-icon"><AlertCircle size={20} /></div>
            <div className="alert-content">
              <h4>Database Error</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Responsive Table */}
        <div className="table-responsive">
          {loading ? (
            <div className="loader-wrapper">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading ledger records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <SlidersHorizontal className="empty-state-icon" />
              <h3>No Records Found</h3>
              <p>No transaction rows match your search query, or the database is currently empty.</p>
            </div>
          ) : (
            <table className="sales-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('order_date')}>Order Date{renderSortIndicator('order_date')}</th>
                  <th className="sortable" onClick={() => handleSort('order_id')}>Order ID{renderSortIndicator('order_id')}</th>
                  <th className="sortable" onClick={() => handleSort('customer_name')}>Customer{renderSortIndicator('customer_name')}</th>
                  <th className="sortable" onClick={() => handleSort('category')}>Category{renderSortIndicator('category')}</th>
                  <th>Sub-Category</th>
                  <th>Product</th>
                  <th className="sortable" onClick={() => handleSort('sales')}>Sales{renderSortIndicator('sales')}</th>
                  <th className="sortable" onClick={() => handleSort('quantity')}>Qty{renderSortIndicator('quantity')}</th>
                  <th className="sortable" onClick={() => handleSort('discount')}>Discount{renderSortIndicator('discount')}</th>
                  <th className="sortable" onClick={() => handleSort('profit')}>Profit{renderSortIndicator('profit')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.row_id}>
                    <td>{new Date(row.order_date).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.order_id}</td>
                    <td>{row.customer_name || 'Unknown'}</td>
                    <td>{row.category}</td>
                    <td>{row.sub_category}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.product_name}>
                      {row.product_name}
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatCurrency(row.sales)}</td>
                    <td>{row.quantity}</td>
                    <td>{formatPercent(row.discount)}</td>
                    <td>
                      <span className={`profit-text ${row.profit >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(row.profit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Info & Buttons */}
        {!loading && records.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing <strong>{((page - 1) * limit) + 1}</strong> to <strong>{Math.min(page * limit, totalRecords)}</strong> of <strong>{totalRecords}</strong> ledger entries
            </div>

            <div className="pagination-buttons">
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', fontWeight: 600 }}>
                Page {page} of {totalPages}
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesRecords;
