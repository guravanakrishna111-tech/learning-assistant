import React, { useState, useEffect } from 'react';
import { getPrediction, savePredictionHistory, generateRecommendations } from '../services/performancePredictionService';
import PredictionForm from '../Components/PredictionService/PredictionForm';
import PredictionResult from '../Components/PredictionService/PredictionResult';
import PredictionGraphs from '../Components/PredictionService/PredictionGraphs';
import RecommendationPanel from '../Components/PredictionService/RecommendationPanel';
import './PerformancePrediction.css';

export default function PerformancePrediction({ user }) {
  const [metrics, setMetrics] = useState({
    studyHours: 5,
    sleepHours: 6,
    previousScore: 60,
    practiceTests: 3
  });

  const [prediction, setPrediction] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize model metrics, dataset, and initial predictions on load (always visible)
  useEffect(() => {
    try {
      const result = getPrediction(metrics);
      setModelData({
        dataset: result.dataset,
        predictions: result.predictions,
        mae: result.mae,
        r2Score: result.r2Score
      });
    } catch (err) {
      console.error('Error initializing predictor model data:', err);
    }
  }, []);

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
    <div className="prediction-page-container">
      {/* Streamlit-style Sidebar on the Left */}
      <div className="streamlit-sidebar">
        {user && (
          <div className="sidebar-welcome">
            👤 Welcome, {user.email}!
          </div>
        )}
        <h3>📊 Student Inputs</h3>
        <PredictionForm
          metrics={metrics}
          setMetrics={setMetrics}
          onPredict={handlePredict}
          loading={loading}
        />
      </div>

      {/* Streamlit-style Main Content on the Right */}
      <div className="streamlit-main">
        <h1 className="main-title">🎓 Student Performance Predictor</h1>
        <p className="subtitle">Predict exam score based on study habits</p>

        {error && <div className="error-message">{error}</div>}

        {prediction && (
          <div className="prediction-result-container">
            <PredictionResult prediction={prediction} metrics={metrics} />
          </div>
        )}

        {modelData && (
          <div className="streamlit-charts-section">
            <PredictionGraphs
              dataset={modelData.dataset}
              predictions={modelData.predictions}
            />

            <div className="metrics-row">
              <div className="metric-card">
                <span className="metric-label">📉 Mean Absolute Error</span>
                <span className="metric-value">{modelData.mae.toFixed(2)}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">📊 R2 Score</span>
                <span className="metric-value">{modelData.r2Score.toFixed(2)}</span>
              </div>
            </div>

            <div className="dataset-preview-section">
              <h3>📋 Dataset Preview</h3>
              <div className="dataset-table-container">
                <table className="dataset-table">
                  <thead>
                    <tr>
                      <th>Study Hours</th>
                      <th>Sleep Hours</th>
                      <th>Previous Score</th>
                      <th>Practice Tests</th>
                      <th>Exam Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelData.dataset.slice(0, 20).map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.studyHours}</td>
                        <td>{row.sleepHours}</td>
                        <td>{row.previousScore}</td>
                        <td>{row.practiceTests}</td>
                        <td>{row.examScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <RecommendationPanel recommendations={recommendations} />
        )}
      </div>
    </div>
  );
}
