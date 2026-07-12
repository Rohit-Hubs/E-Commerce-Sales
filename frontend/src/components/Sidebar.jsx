import React from 'react';
import { LayoutDashboard, FileSpreadsheet, UploadCloud, ShoppingBag } from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <ShoppingBag size={24} />
        <h1>SalesPulse</h1>
      </div>
      
      <nav className="sidebar-nav">
        <button 
          onClick={() => setCurrentPage('dashboard')}
          className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <LayoutDashboard />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => setCurrentPage('sales')}
          className={`nav-item ${currentPage === 'sales' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FileSpreadsheet />
          <span>Sales Records</span>
        </button>

        <button 
          onClick={() => setCurrentPage('upload')}
          className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <UploadCloud />
          <span>Upload Data</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div>
          <p style={{ fontWeight: 600 }}>E-Commerce Analytics</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>v1.0.0 • Portfolio</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
