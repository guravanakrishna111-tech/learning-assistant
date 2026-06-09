import modelWeights from './modelWeights.json';

/**
 * Normalize input value to 0-1 scale
 */
function normalizeValue(value, min, max) {
  return (value - min) / (max - min);
}

/**
 * Main prediction function
 * @param {Object} metrics - {studyHours, sleepHours, previousScore, practiceTests}
 * @returns {Object} - {prediction, confidence, range, factors}
 */
export function predictExamScore(metrics) {
  const { coefficients, intercept, metrics: modelMetrics } = modelWeights;

  // Validate inputs
  const validMetrics = validateMetrics(metrics);

  // Normalize inputs
  const normalized = {
    studyHours: normalizeValue(validMetrics.studyHours, 0, 15),
    sleepHours: normalizeValue(validMetrics.sleepHours, 4, 12),
    previousScore: normalizeValue(validMetrics.previousScore, 0, 100),
    practiceTests: normalizeValue(validMetrics.practiceTests, 0, 10)
  };

  // Linear regression formula
  let prediction = intercept;
  prediction += normalized.studyHours * coefficients.studyHours;
  prediction += normalized.sleepHours * coefficients.sleepHours;
  prediction += normalized.previousScore * coefficients.previousScore;
  prediction += normalized.practiceTests * coefficients.practiceTests;

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
    factors: calculateFactorImportance(coefficients, normalized)
  };
}

/**
 * Calculate relative importance of each factor
 */
function calculateFactorImportance(coefficients, normalized) {
  const contributions = {
    studyHours: Math.abs(normalized.studyHours * coefficients.studyHours),
    sleepHours: Math.abs(normalized.sleepHours * coefficients.sleepHours),
    previousScore: Math.abs(normalized.previousScore * coefficients.previousScore),
    practiceTests: Math.abs(normalized.practiceTests * coefficients.practiceTests)
  };

  const total = Object.values(contributions).reduce((a, b) => a + b, 0);

  return Object.fromEntries(
    Object.entries(contributions).map(([key, val]) => [key, (val / total * 100).toFixed(1)])
  );
}

/**
 * Validate and sanitize input metrics
 */
function validateMetrics(metrics) {
  const defaults = {
    studyHours: 5,
    sleepHours: 7,
    previousScore: 60,
    practiceTests: 3
  };

  const ranges = {
    studyHours: [0, 15],
    sleepHours: [4, 12],
    previousScore: [0, 100],
    practiceTests: [0, 10]
  };

  const validated = { ...defaults, ...metrics };

  Object.keys(validated).forEach(key => {
    const [min, max] = ranges[key];
    validated[key] = Math.max(min, Math.min(max, Number(validated[key]) || defaults[key]));
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
