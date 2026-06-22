import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './PredictionGraphs.css';

export default function PredictionGraphs({ dataset, predictions }) {
  if (!dataset || !predictions) {
    return null;
  }

  // Prepare data for Study Hours vs Exam Score chart
  const studyHoursData = dataset.map(item => ({
    x: item.studyHours,
    y: item.examScore
  }));

  // Prepare data for Actual vs Predicted chart
  const actualVsPredictedData = predictions.map((pred) => ({
    x: pred.actual,
    y: pred.predicted,
    actual: pred.actual,
    predicted: pred.predicted
  }));

  return (
    <div className="prediction-graphs">
      <div className="graphs-container">
        <div className="graph-item">
          <h3>📚 Study Hours vs Exam Score</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              data={studyHoursData}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Study Hours"
                label={{ value: 'Study Hours', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Exam Score"
                label={{ value: 'Exam Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '8px'
                }}
              />
              <Scatter
                name="Score Data"
                data={studyHoursData}
                fill="#4CAF50"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="graph-item">
          <h3>📊 Actual vs Predicted</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              data={actualVsPredictedData}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Actual Score"
                label={{ value: 'Actual Score', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Predicted Score"
                label={{ value: 'Predicted Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '8px'
                }}
              />
              <Scatter
                name="Predictions"
                data={actualVsPredictedData}
                fill="#FF6B6B"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
