import React from 'react';
import { DollarSign, ShoppingCart, Users, TrendingUp, Percent, Tag } from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

const formatNumber = (val) => {
  return new Intl.NumberFormat('en-US').format(val);
};

const formatPercent = (val) => {
  return `${val.toFixed(2)}%`;
};

const KPICard = ({ type, title, value }) => {
  let displayValue = '';
  let icon = null;
  let cardClass = '';

  switch (type) {
    case 'sales':
      displayValue = formatCurrency(value);
      icon = <DollarSign size={20} />;
      cardClass = 'sales';
      break;
    case 'profit':
      displayValue = formatCurrency(value);
      icon = <DollarSign size={20} />;
      cardClass = 'profit';
      break;
    case 'orders':
      displayValue = formatNumber(value);
      icon = <ShoppingCart size={20} />;
      cardClass = 'orders';
      break;
    case 'customers':
      displayValue = formatNumber(value);
      icon = <Users size={20} />;
      cardClass = 'customers';
      break;
    case 'aov':
      displayValue = formatCurrency(value);
      icon = <TrendingUp size={20} />;
      cardClass = 'aov';
      break;
    case 'margin':
      displayValue = formatPercent(value);
      icon = <Percent size={20} />;
      cardClass = 'margin';
      break;
    case 'discount':
      // discount is a value like 0.15 (15%) or 15
      // let's assume if it is <= 1.0, it is a decimal fraction, otherwise it is already a percent
      const pct = value <= 1.0 && value > 0 ? value * 100 : value;
      displayValue = formatPercent(pct);
      icon = <Tag size={20} />;
      cardClass = 'discount';
      break;
    case 'quantity':
      displayValue = formatNumber(value);
      icon = <ShoppingCart size={20} />;
      cardClass = 'quantity';
      break;
    default:
      displayValue = value;
      icon = <DollarSign size={20} />;
      cardClass = '';
  }

  return (
    <div className={`kpi-card ${cardClass}`}>
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon">{icon}</div>
      </div>
      <div className="kpi-value">{displayValue}</div>
    </div>
  );
};

export default KPICard;
