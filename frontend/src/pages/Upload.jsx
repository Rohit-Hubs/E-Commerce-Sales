import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, HelpCircle, FileCheck } from 'lucide-react';
import { api } from '../services/api';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Only CSV files are allowed.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.uploadSales(file);
      setResult(res);
      setFile(null);
    } catch (err) {
      setError(err.message || 'An error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  const requiredColumns = [
    { name: 'order_id', type: 'Text (e.g. CA-2024-152156)' },
    { name: 'order_date', type: 'Date (e.g. 2024-01-08)' },
    { name: 'ship_date', type: 'Date (e.g. 2024-01-11)' },
    { name: 'customer_id', type: 'Text (e.g. CG-12520)' },
    { name: 'product_id', type: 'Text (e.g. FUR-BO-10001798)' },
    { name: 'sales', type: 'Numeric (e.g. 261.96)' },
    { name: 'quantity', type: 'Integer (e.g. 2)' },
    { name: 'discount', type: 'Numeric (e.g. 0.2)' },
    { name: 'profit', type: 'Numeric (e.g. 41.91)' }
  ];

  return (
    <div className="page-content">
      <div className="header-title">
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Import Transaction Log</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Upload your transaction spreadsheet in CSV format to build business analytics.</p>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
        {/* File drop zone & stats */}
        <div className="table-card" style={{ gap: '24px' }}>
          {error && (
            <div className="alert alert-danger">
              <div className="alert-icon"><AlertTriangle size={20} /></div>
              <div className="alert-content">
                <h4>Upload Failed</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="alert alert-success">
              <div className="alert-icon"><CheckCircle2 size={20} /></div>
              <div className="alert-content">
                <h4>Data Ingested Successfully!</h4>
                <p>
                  Inserted <strong>{result.uploaded_rows}</strong> new sales rows into the database.
                </p>
                <div style={{ marginTop: '8px', fontSize: '0.85rem', display: 'flex', gap: '16px' }}>
                  <span>Duplicates skipped: {result.duplicate_rows}</span>
                  <span>Invalid rows skipped: {result.invalid_rows}</span>
                </div>
              </div>
            </div>
          )}

          <div 
            className={`upload-area ${dragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-file-picker').click()}
          >
            <UploadCloud className="upload-icon" />
            <div>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>
                Drag & drop your CSV file here, or <span className="highlight">browse files</span>
              </p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Supports standard CSV files (.csv) up to 10MB</p>
            </div>
            <input 
              id="csv-file-picker" 
              type="file" 
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileCheck style={{ color: 'var(--primary)' }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Processing File...' : 'Start Ingesting'}
              </button>
            </div>
          )}
        </div>

        {/* Required Columns Reference */}
        <div className="upload-requirements">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <HelpCircle size={20} style={{ color: 'var(--primary)' }} />
            <h3>CSV Column Requirements</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            To map and process data correctly, your CSV headers should contain the following fields. If headers are capitalized or have spaces/hyphens (e.g. "Order Date"), the backend will automatically normalize them.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-secondary)' }}>Expected Name</th>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-secondary)' }}>Required Data Type</th>
              </tr>
            </thead>
            <tbody>
              {requiredColumns.map(col => (
                <tr key={col.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text)' }}>{col.name}</td>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{col.type}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', borderLeft: '3px solid var(--primary)' }}>
            <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>💡 Helpful Tip</p>
            <p style={{ color: 'var(--text-secondary)' }}>Optional columns like <code>customer_name</code>, <code>category</code>, <code>region</code>, and <code>product_name</code> are highly recommended to unlock advanced chart segmentation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
