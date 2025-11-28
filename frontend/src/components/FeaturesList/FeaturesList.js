import React from 'react';
import './FeaturesList.css';

const FeaturesList = ({ darkMode }) => {
  const features = [
    {
      icon: '📊',
      title: 'Portfolio Summary',
      description: 'Overview by fund house with cost and market values'
    },
    {
      icon: '💰',
      title: 'Detailed Transactions',
      description: 'Complete history with NAV, units, and balances'
    },
    {
      icon: '📈',
      title: 'MF Holdings',
      description: 'Current holdings with folio details, PAN, ISIN'
    }
  ];

  return (
    <div className="features-panel">
      <h2>What You'll Get</h2>
      {features.map((feature, index) => (
        <div key={index} className="feature-item">
          <span className="feature-icon">{feature.icon}</span>
          <div>
            <strong>{feature.title}</strong>
            <p>{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturesList;
