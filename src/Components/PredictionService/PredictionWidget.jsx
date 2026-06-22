import React, { useState, useEffect } from 'react';
import { getPrediction } from '../../services/performancePredictionService';
import './PredictionWidget.css';

export default function PredictionWidget({ recentMetrics }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recentMetrics) {
      setLoading(true);
      try {
        const result = getPrediction(recentMetrics);
        setPrediction(result);
      } finally {
        setLoading(false);
      }
    }
  }, [recentMetrics]);

  if (!prediction) return null;

  return (
    <div className="prediction-widget">
      <h3>📊 Predicted Score</h3>
      {loading ? (
        <div>Calculating...</div>
      ) : (
        <>
          <div className="score-display">
            <span className="score-value">{prediction.prediction}</span>
            <span className="score-max">/100</span>
          </div>
          <div className="confidence">
            Confidence: {(prediction.confidence * 100).toFixed(0)}%
          </div>
          <div className="range">
            Range: {prediction.range.min} - {prediction.range.max}
          </div>
        </>
      )}
    </div>
  );
}
