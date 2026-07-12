import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import SalesRecords from './pages/SalesRecords';
import { api } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [apiConnected, setApiConnected] = useState(false);

  // Ping backend health check on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        await api.health();
        setApiConnected(true);
      } catch (err) {
        console.error('API connectivity check failed:', err);
        setApiConnected(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <Upload />;
      case 'sales':
        return <SalesRecords />;
      default:
        return <Dashboard />;
    }
  };

  const getPageHeaderTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Executive Analytics Portal';
      case 'upload':
        return 'Import Transaction Log';
      case 'sales':
        return 'Sales Ledger';
      default:
        return 'Analytics Console';
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <div className="main-wrapper">
        <header className="header">
          <div className="header-title">
            <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
              {getPageHeaderTitle()}
            </h2>
          </div>
          
          <div className="header-meta">
            <div className="api-status" style={{ 
              backgroundColor: apiConnected ? 'var(--success-light)' : 'var(--danger-light)',
              color: apiConnected ? 'var(--success)' : 'var(--danger)'
            }}>
              <span className="status-dot" style={{ backgroundColor: apiConnected ? 'var(--success)' : 'var(--danger)' }}></span>
              <span>{apiConnected ? 'API Connected' : 'API Offline'}</span>
            </div>
          </div>
        </header>
        
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
