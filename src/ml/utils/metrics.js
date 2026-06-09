/**
 * Calculate Mean Absolute Error
 */
export function calculateMAE(actual, predicted) {
  const errors = actual.map((a, i) => Math.abs(a - predicted[i]));
  return errors.reduce((sum, err) => sum + err, 0) / errors.length;
}

/**
 * Calculate R² Score
 */
export function calculateR2Score(actual, predicted) {
  const meanActual = actual.reduce((a, b) => a + b, 0) / actual.length;

  const totalSS = actual.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0);
  const residualSS = actual.reduce((sum, a, i) => sum + Math.pow(a - predicted[i], 2), 0);

  return 1 - (residualSS / totalSS);
}

/**
 * Validate prediction accuracy
 */
export function validatePredictionAccuracy(prediction, actual) {
  const error = Math.abs(actual - prediction);
  const percentError = (error / actual) * 100;

  return {
    error,
    percentError,
    isAccurate: percentError < 15
  };
}
