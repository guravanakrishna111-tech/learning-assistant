import React, { useState, useEffect } from 'react';
import { getPrediction, savePredictionHistory, generateRecommendations } from '../services/performancePredictionService';
import PredictionForm from '../components/PredictionService/PredictionForm';
import PredictionResult from '../components/PredictionService/PredictionResult';
import RecommendationPanel from '../components/PredictionService/RecommendationPanel';
import './PerformancePrediction.css';

export default function PerformancePrediction({ user }) {
  const [metrics, setMetrics] = useState({
    studyHours: 5,
    sleepHours: 7,
    previousScore: 60,
    practiceTests: 3
  });

  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = getPrediction(metrics);
      setPrediction(result);

      if (user?.uid) {
        await savePredictionHistory(user.uid, result, metrics);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!user?.uid) return;
    try {
      const recs = await generateRecommendations(user.uid);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  useEffect(() => {
    if (user?.uid && prediction) {
      loadRecommendations();
    }
  }, [user?.uid, prediction]);

  return (
    <div className="prediction-page">
      <h1>📊 Performance Prediction</h1>

      <div className="prediction-container">
        <div className="prediction-input">
          <PredictionForm
            metrics={metrics}
            setMetrics={setMetrics}
            onPredict={handlePredict}
            loading={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {prediction && (
          <div className="prediction-output">
            <PredictionResult prediction={prediction} metrics={metrics} />
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <RecommendationPanel recommendations={recommendations} />
      )}
    </div>
  );
}
