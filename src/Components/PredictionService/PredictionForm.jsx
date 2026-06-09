import React, { useState } from 'react';
import './PredictionForm.css';

export default function PredictionForm({ metrics, setMetrics, onPredict, loading }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMetrics(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  return (
    <div className="prediction-form">
      <h2>📝 Enter Your Study Metrics</h2>

      <div className="form-group">
        <label htmlFor="studyHours">
          Study Hours (0-15)
        </label>
        <input
          type="range"
          id="studyHours"
          name="studyHours"
          min="0"
          max="15"
          step="0.5"
          value={metrics.studyHours}
          onChange={handleChange}
          className="slider"
        />
        <span className="value-display">{metrics.studyHours} hours</span>
      </div>

      <div className="form-group">
        <label htmlFor="sleepHours">
          Sleep Hours (4-12)
        </label>
        <input
          type="range"
          id="sleepHours"
          name="sleepHours"
          min="4"
          max="12"
          step="0.5"
          value={metrics.sleepHours}
          onChange={handleChange}
          className="slider"
        />
        <span className="value-display">{metrics.sleepHours} hours</span>
      </div>

      <div className="form-group">
        <label htmlFor="previousScore">
          Previous Score (0-100)
        </label>
        <input
          type="range"
          id="previousScore"
          name="previousScore"
          min="0"
          max="100"
          step="1"
          value={metrics.previousScore}
          onChange={handleChange}
          className="slider"
        />
        <span className="value-display">{metrics.previousScore}</span>
      </div>

      <div className="form-group">
        <label htmlFor="practiceTests">
          Practice Tests (0-10)
        </label>
        <input
          type="range"
          id="practiceTests"
          name="practiceTests"
          min="0"
          max="10"
          step="1"
          value={metrics.practiceTests}
          onChange={handleChange}
          className="slider"
        />
        <span className="value-display">{metrics.practiceTests}</span>
      </div>

      <button
        onClick={onPredict}
        disabled={loading}
        className="predict-button"
      >
        {loading ? '⏳ Calculating...' : '🚀 Get Prediction'}
      </button>
    </div>
  );
}
