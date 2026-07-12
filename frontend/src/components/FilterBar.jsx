import React from 'react';
import { RotateCcw, Filter } from 'lucide-react';

const FilterBar = ({ filters, setFilters, filterOptions, onReset }) => {
  const { categories = [], sub_categories = [], regions = [], states = [], segments = [], min_date = '', max_date = '' } = filterOptions || {};

  const handleFieldChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="filter-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <Filter size={18} style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Analytics Filter Engine</h3>
      </div>
      <div className="filter-row">
        {/* Start Date */}
        <div className="filter-group">
          <label>Start Date</label>
          <input 
            type="date" 
            className="filter-input"
            value={filters.start_date || ''}
            min={min_date}
            max={max_date}
            onChange={(e) => handleFieldChange('start_date', e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="filter-group">
          <label>End Date</label>
          <input 
            type="date" 
            className="filter-input"
            value={filters.end_date || ''}
            min={min_date}
            max={max_date}
            onChange={(e) => handleFieldChange('end_date', e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="filter-group">
          <label>Category</label>
          <select 
            className="filter-input"
            value={filters.category || ''}
            onChange={(e) => handleFieldChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Sub-Category */}
        <div className="filter-group">
          <label>Sub-Category</label>
          <select 
            className="filter-input"
            value={filters.sub_category || ''}
            onChange={(e) => handleFieldChange('sub_category', e.target.value)}
          >
            <option value="">All Sub-Categories</option>
            {sub_categories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div className="filter-group">
          <label>Region</label>
          <select 
            className="filter-input"
            value={filters.region || ''}
            onChange={(e) => handleFieldChange('region', e.target.value)}
          >
            <option value="">All Regions</option>
            {regions.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="filter-group">
          <label>State</label>
          <select 
            className="filter-input"
            value={filters.state || ''}
            onChange={(e) => handleFieldChange('state', e.target.value)}
          >
            <option value="">All States</option>
            {states.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Segment */}
        <div className="filter-group">
          <label>Segment</label>
          <select 
            className="filter-input"
            value={filters.segment || ''}
            onChange={(e) => handleFieldChange('segment', e.target.value)}
          >
            <option value="">All Segments</option>
            {segments.map(seg => (
              <option key={seg} value={seg}>{seg}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="filter-actions">
        <button className="btn btn-secondary" onClick={onReset}>
          <RotateCcw size={16} />
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
