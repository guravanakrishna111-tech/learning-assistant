import modelWeights from './modelWeights.json';

/**
 * Main prediction function
 * @param {Object} metrics - {studyHours, sleepHours, previousScore, practiceTests}
 * @returns {Object} - {prediction, confidence, range, factors}
 */
export function predictExamScore(metrics) {
  const { coefficients, intercept, metrics: modelMetrics } = modelWeights;

  // Validate inputs
  const validMetrics = validateMetrics(metrics);

  // Linear regression formula using raw features (matching Python)
  let prediction = intercept;
  prediction += validMetrics.studyHours * coefficients.studyHours;
  prediction += validMetrics.sleepHours * coefficients.sleepHours;
  prediction += validMetrics.previousScore * coefficients.previousScore;
  prediction += validMetrics.practiceTests * coefficients.practiceTests;

  // Clip to valid range [0, 100]
  const clipped = Math.max(0, Math.min(100, prediction));

  // Calculate confidence interval (±1.5 MAE)
  const margin = modelMetrics.mae * 1.5;

  return {
    prediction: Math.round(clipped * 10) / 10,
    confidence: modelMetrics.r2Score,
    range: {
      min: Math.max(0, Math.round(clipped - margin)),
      max: Math.min(100, Math.round(clipped + margin))
    },
    factors: calculateFactorImportance(coefficients, validMetrics)
  };
}

/**
 * Calculate relative importance of each factor
 */
function calculateFactorImportance(coefficients, metrics) {
  const contributions = {
    studyHours: Math.abs(metrics.studyHours * coefficients.studyHours),
    sleepHours: Math.abs(metrics.sleepHours * coefficients.sleepHours),
    previousScore: Math.abs(metrics.previousScore * coefficients.previousScore),
    practiceTests: Math.abs(metrics.practiceTests * coefficients.practiceTests)
  };

  const total = Object.values(contributions).reduce((a, b) => a + b, 0);

  return Object.fromEntries(
    Object.entries(contributions).map(([key, val]) => [key, total > 0 ? (val / total * 100).toFixed(1) : '0.0'])
  );
}

/**
 * Validate and sanitize input metrics
 */
function validateMetrics(metrics) {
  const defaults = {
    studyHours: 5,
    sleepHours: 6,
    previousScore: 60,
    practiceTests: 3
  };

  const ranges = {
    studyHours: [0, 15],
    sleepHours: [0, 12],
    previousScore: [0, 100],
    practiceTests: [0, 10]
  };

  const validated = { ...defaults, ...metrics };

  Object.keys(validated).forEach(key => {
    const [min, max] = ranges[key];
    const numericValue = Number(validated[key]);
    validated[key] = Number.isFinite(numericValue)
      ? Math.max(min, Math.min(max, numericValue))
      : defaults[key];
  });

  return validated;
}

/**
 * Get model metadata
 */
export function getModelInfo() {
  return {
    type: modelWeights.modelType,
    version: modelWeights.version,
    timestamp: modelWeights.timestamp,
    r2Score: modelWeights.metrics.r2Score,
    mae: modelWeights.metrics.mae,
    trainingSetSize: modelWeights.metrics.trainingSetSize
  };
}
