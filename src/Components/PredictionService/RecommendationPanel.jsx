import React from 'react';
import './RecommendationPanel.css';

export default function RecommendationPanel({ recommendations }) {
  return (
    <div className="recommendation-panel">
      <h2>💡 Personalized Recommendations</h2>
      <div className="recommendations-list">
        {recommendations.map((rec, idx) => (
          <div key={idx} className={`recommendation-item rec-${rec.category}`}>
            <div className="rec-icon">
              {rec.category === 'info' && '📌'}
              {rec.category === 'opportunity' && '⭐'}
              {rec.category === 'recommendation' && '💪'}
            </div>
            <div className="rec-text">{rec.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
