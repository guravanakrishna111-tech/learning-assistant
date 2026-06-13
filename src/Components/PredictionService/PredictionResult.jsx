import React from 'react';
import PredictionGraphs from './PredictionGraphs';
import './PredictionResult.css';

export default function PredictionResult({ prediction, metrics }) {
  // Format the score display
  const scoreFormatted = prediction.prediction.toFixed(2);

  // Generate feedback details based on prediction (matching Streamlit messages and levels)
  const getAlertDetails = () => {
    const score = prediction.prediction;
    if (score >= 80) {
      return {
        className: 'streamlit-alert streamlit-success',
        text: '🌟 Excellent performance! Keep up the great work!'
      };
    } else if (score >= 60) {
      return {
        className: 'streamlit-alert streamlit-info',
        text: '📈 Good progress! Focus on your weak areas.'
      };
    } else {
      return {
        className: 'streamlit-alert streamlit-warning',
        text: '⚠️ Need improvement. Increase study hours and practice more!'
      };
    }
  };

  const alert = getAlertDetails();

  return (
    <div className="prediction-result">
      {/* Streamlit-style prediction display banner */}
      <div className="prediction">
        🎯 Predicted Exam Score: {scoreFormatted}/100
      </div>

      {/* Streamlit-style alert banner */}
      <div className={alert.className}>
        {alert.text}
      </div>

      {/* Factors Importance Analysis (kept from Learning Assistant for UI richness) */}
      <div className="factors-analysis">
        <h3>📊 Factor Importance</h3>
        <div className="factors-grid">
          {Object.entries(prediction.factors).map(([factor, importance]) => (
            <div key={factor} className="factor-item">
              <div className="factor-name">
                {factor === 'studyHours' && '📚 Study Hours'}
                {factor === 'sleepHours' && '😴 Sleep Hours'}
                {factor === 'previousScore' && '📈 Previous Score'}
                {factor === 'practiceTests' && '✏️ Practice Tests'}
              </div>
              <div className="factor-bar-bg">
                <div
                  className="factor-bar-fill"
                  style={{ width: `${importance}%` }}
                />
              </div>
              <span className="factor-percent">{importance}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
