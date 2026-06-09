import React from 'react';
import PredictionGraphs from './PredictionGraphs';
import './PredictionResult.css';

export default function PredictionResult({ prediction, metrics }) {
  // Format the score display
  const scoreFormatted = prediction.prediction.toFixed(2);
  const maeFmt = prediction.mae.toFixed(1);
  const r2Fmt = (prediction.r2Score * 100).toFixed(0);

  // Generate feedback message based on prediction
  const getFeedbackMessage = () => {
    if (prediction.prediction >= 80) {
      return '✅ Excellent! You are on track for great performance.';
    } else if (prediction.prediction >= 70) {
      return '👍 Good progress! Focus on your weak areas.';
    } else if (prediction.prediction >= 60) {
      return '⚠️ Room for improvement! Increase study hours and practice tests.';
    } else {
      return '🚀 Challenge ahead! Consider reviewing fundamentals and increasing study time.';
    }
  };

  return (
    <div className="prediction-result">
      <div className="score-card">
        <h2>🎯 Predicted Exam Score</h2>
        <div className="score-display">
          <div className="score-value">{scoreFormatted}</div>
          <div className="score-max">/100</div>
        </div>
        
        <div className="feedback-message">
          <p>{getFeedbackMessage()}</p>
        </div>
      </div>

      <div className="metrics-container">
        <div className="metric-item">
          <div className="metric-label">📊 Mean Absolute Error</div>
          <div className="metric-value">{maeFmt}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">📈 R² Score</div>
          <div className="metric-value">{r2Fmt}%</div>
        </div>
      </div>

      <div className="confidence-info">
        <div className="confidence-label">Model Confidence</div>
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${prediction.confidence * 100}%` }}
          />
        </div>
        <div className="confidence-percent">{(prediction.confidence * 100).toFixed(0)}%</div>
      </div>

      <div className="range-info">
        <div className="range-label">Expected Range (±1.5 MAE)</div>
        <div className="range-display">
          <span className="range-min">{prediction.range.min}</span>
          <span className="range-dash">-</span>
          <span className="range-max">{prediction.range.max}</span>
        </div>
      </div>

      <PredictionGraphs dataset={prediction.dataset} predictions={prediction.predictions} />

      <div className="factors-analysis">
        <h3>Factor Importance</h3>
        <div className="factors-grid">
          {Object.entries(prediction.factors).map(([factor, importance]) => (
            <div key={factor} className="factor-item">
              <div className="factor-name">
                {factor === 'studyHours' && '📚 Study Hours'}
                {factor === 'sleepHours' && '😴 Sleep Hours'}
                {factor === 'previousScore' && '📈 Previous Score'}
                {factor === 'practiceTests' && '✏️ Practice Tests'}
              </div>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${importance}%` }}
                />
              </div>
              <div className="factor-percent">{importance}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="input-summary">
        <h3>Your Input</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Study Hours:</span>
            <span className="summary-value">{metrics.studyHours}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Sleep Hours:</span>
            <span className="summary-value">{metrics.sleepHours}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Previous Score:</span>
            <span className="summary-value">{metrics.previousScore}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Practice Tests:</span>
            <span className="summary-value">{metrics.practiceTests}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
