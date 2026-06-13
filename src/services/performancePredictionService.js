import { predictExamScore, getModelInfo } from '../ml/predictor';
import { generateStudentData } from '../ml/utils/dataGenerator';
import { calculateMAE, calculateR2Score } from '../ml/utils/metrics';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';

let cachedDataset = null;
const DATASET_SIZE = 200;

// Seeded pseudo-random generator (LCG)
function createRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Deterministic shuffle using seed
function seededShuffle(arr, seed) {
  const random = createRandom(seed);
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

/**
 * Get historical dataset for visualization
 */
function getHistoricalDataset() {
  if (!cachedDataset) {
    cachedDataset = generateStudentData(DATASET_SIZE);
  }
  return cachedDataset;
}

/**
 * Get a single prediction for given metrics with extended data
 */
export function getPrediction(metrics) {
  const prediction = predictExamScore(metrics);
  const dataset = getHistoricalDataset();
  
  // Deterministically split dataset (80/20) for model metrics (similar to train_test_split in Python)
  const shuffledDataset = seededShuffle(dataset, 42);
  const trainSize = Math.floor(DATASET_SIZE * 0.8);
  const testSet = shuffledDataset.slice(trainSize); // 40 items

  // Get predicted scores for test data points
  const testPredictions = testSet.map(data => ({
    studyHours: data.studyHours,
    actual: data.examScore,
    predicted: predictExamScore({
      studyHours: data.studyHours,
      sleepHours: data.sleepHours,
      previousScore: data.previousScore,
      practiceTests: data.practiceTests
    }).prediction
  }));

  // Calculate metrics on the test set
  const actualScores = testSet.map(d => d.examScore);
  const predictedScores = testPredictions.map(p => p.predicted);
  
  const mae = calculateMAE(actualScores, predictedScores);
  const r2 = calculateR2Score(actualScores, predictedScores);

  return {
    ...prediction,
    prediction: Math.round(prediction.prediction * 100) / 100,
    mae: Math.round(mae * 100) / 100,
    r2Score: Math.round(r2 * 100) / 100,
    dataset, // Full 200 items for study hours scatter plot & preview
    predictions: testPredictions, // 40 test items for actual vs predicted scatter plot
    modelMetrics: {
      mae: Math.round(mae * 100) / 100,
      r2Score: Math.round(r2 * 100) / 100,
      dataPoints: dataset.length
    }
  };
}

/**
 * Save prediction to user's history
 */
export async function savePredictionHistory(userId, prediction, metrics) {
  try {
    const predictionsRef = collection(db, 'users', userId, 'predictions');
    const docRef = await addDoc(predictionsRef, {
      timestamp: Timestamp.now(),
      metrics: {
        studyHours: metrics.studyHours,
        sleepHours: metrics.sleepHours,
        previousScore: metrics.previousScore,
        practiceTests: metrics.practiceTests
      },
      prediction: {
        score: prediction.prediction,
        confidence: prediction.confidence,
        rangeMin: prediction.range.min,
        rangeMax: prediction.range.max,
        factors: prediction.factors,
        mae: prediction.mae,
        r2Score: prediction.r2Score
      },
      actual: null,
      accuracy: null,
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving prediction:', error);
    throw error;
  }
}

/**
 * Get user's prediction history
 */
export async function getPredictionHistory(userId, limitCount = 10) {
  try {
    const predictionsRef = collection(db, 'users', userId, 'predictions');
    const q = query(
      predictionsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    return [];
  }
}

/**
 * Record actual exam score for a prediction
 */
export async function recordActualScore(userId, predictionId, actualScore) {
  try {
    const predRef = doc(db, 'users', userId, 'predictions', predictionId);
    const predSnap = await getDoc(predRef);

    if (!predSnap.exists()) throw new Error('Prediction not found');

    const predictedScore = predSnap.data().prediction.score;
    const accuracy = calculateAccuracy(predictedScore, actualScore);

    await updateDoc(predRef, {
      actual: actualScore,
      accuracy,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error recording actual score:', error);
    throw error;
  }
}

/**
 * Calculate prediction accuracy
 */
function calculateAccuracy(predicted, actual) {
  const error = Math.abs(predicted - actual);
  return {
    error: Math.round(error * 10) / 10,
    percentError: Math.round((error / actual) * 1000) / 10,
    isAccurate: error <= 5
  };
}

/**
 * Set performance goal
 */
export async function setPerformanceGoal(userId, goalData) {
  try {
    const goalsRef = collection(db, 'users', userId, 'goals');
    const docRef = await addDoc(goalsRef, {
      title: goalData.title,
      targetScore: goalData.targetScore,
      deadline: goalData.deadline,
      createdAt: Timestamp.now(),
      status: 'active',
      description: goalData.description || ''
    });

    return docRef.id;
  } catch (error) {
    console.error('Error setting goal:', error);
    throw error;
  }
}

/**
 * Get active goals
 */
export async function getActiveGoals(userId) {
  try {
    const goalsRef = collection(db, 'users', userId, 'goals');
    const q = query(
      goalsRef,
      where('status', '==', 'active'),
      orderBy('deadline', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
}

/**
 * Log daily habit metrics
 */
export async function logDailyMetrics(userId, metrics) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const habitsRef = collection(db, 'users', userId, 'habits');

    const q = query(habitsRef, where('date', '==', today));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await addDoc(habitsRef, {
        date: today,
        studyHours: metrics.studyHours,
        sleepHours: metrics.sleepHours,
        practiceTests: metrics.practiceTests,
        createdAt: Timestamp.now()
      });
    } else {
      await updateDoc(snapshot.docs[0].ref, {
        studyHours: metrics.studyHours,
        sleepHours: metrics.sleepHours,
        practiceTests: metrics.practiceTests,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error logging metrics:', error);
    throw error;
  }
}

/**
 * Generate growth recommendations
 */
export async function generateRecommendations(userId) {
  try {
    const predictions = await getPredictionHistory(userId, 5);

    if (predictions.length === 0) {
      return [{
        category: 'info',
        text: 'Make your first prediction to get personalized recommendations'
      }];
    }

    const recommendations = [];
    const latestPrediction = predictions[0];
    const factors = latestPrediction.prediction.factors;

    if (Number(factors.studyHours) < 30) {
      recommendations.push({
        category: 'opportunity',
        text: 'Increasing study hours could significantly boost your score'
      });
    }

    if (Number(factors.practiceTests) < 20) {
      recommendations.push({
        category: 'recommendation',
        text: 'Practice tests are highly impactful - aim for 5+ practice tests'
      });
    }

    if (Number(factors.sleepHours) < 25) {
      recommendations.push({
        category: 'recommendation',
        text: 'Ensure 7-8 hours of sleep for optimal cognitive function'
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Get model metadata
 */
export function getModelMetadata() {
  return getModelInfo();
}
