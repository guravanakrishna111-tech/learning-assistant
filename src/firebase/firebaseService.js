import { db, auth, storage } from './firebaseconfig';
import {
  addDoc,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  onSnapshot,
  orderBy,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Get current user ID
export const getCurrentUserId = () => {
  return auth.currentUser?.uid;
};

// ================= AUTHENTICATION HELPERS =================
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

/**
 * Sign in an existing user using email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Create a new user (register) with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export const signUp = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Send a password reset email to the given address.
 * @param {string} email
 * @returns {Promise<void>}
 */
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

// Google provider
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in using Google popup
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ========== TASKS ==========

// Save/Update tasks
export const saveTasks = async (userId, tasks) => {
  try {
    if (!userId) return;
    const userRef = doc(db, 'users', userId, 'data', 'tasks');
    await setDoc(userRef, { tasks, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw error;
  }
};

// Get tasks for user
export const getTasks = async (userId) => {
  try {
    if (!userId) return [];
    const userRef = doc(db, 'users', userId, 'data', 'tasks');
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data().tasks || [] : [];
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

// Real-time listener for tasks
export const onTasksChange = (userId, callback) => {
  if (!userId) return () => {};
  const userRef = doc(db, 'users', userId, 'data', 'tasks');
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().tasks || []);
    } else {
      callback([]);
    }
  });
};

// ========== CALCULATION HISTORY ==========

// Save calculation
export const saveCalculation = async (userId, calculation) => {
  try {
    if (!userId) return;
    const userRef = doc(db, 'users', userId, 'data', 'calculations');
    await updateDoc(userRef, {
      history: arrayUnion(calculation),
      updatedAt: new Date()
    }).catch(() => {
      setDoc(userRef, { history: [calculation], updatedAt: new Date() });
    });
    return true;
  } catch (error) {
    console.error('Error saving calculation:', error);
    throw error;
  }
};

// Get calculation history
export const getCalculationHistory = async (userId) => {
  try {
    if (!userId) return [];
    const userRef = doc(db, 'users', userId, 'data', 'calculations');
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data().history || [] : [];
  } catch (error) {
    console.error('Error getting calculation history:', error);
    return [];
  }
};

// Clear calculation history
export const clearCalculationHistory = async (userId) => {
  try {
    if (!userId) return;
    const userRef = doc(db, 'users', userId, 'data', 'calculations');
    await setDoc(userRef, { history: [], updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error clearing calculation history:', error);
    throw error;
  }
};

// Delete calculation
export const deleteCalculation = async (userId, calculation) => {
  try {
    if (!userId) return;
    const userRef = doc(db, 'users', userId, 'data', 'calculations');
    await updateDoc(userRef, {
      history: arrayRemove(calculation),
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error deleting calculation:', error);
    throw error;
  }
};

// Real-time listener for calculations
export const onCalculationsChange = (userId, callback) => {
  if (!userId) return () => {};
  const userRef = doc(db, 'users', userId, 'data', 'calculations');
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().history || []);
    } else {
      callback([]);
    }
  });
};

// ========== PROFILE ==========

// Save profile
export const saveProfile = async (userId, profile) => {
  try {
    if (!userId) return;
    // Store profile under a document within a "data" subcollection to keep
    // user-level data organized (consistent with tasks / calculations).
    const userRef = doc(db, 'users', userId, 'data', 'profile');
    await setDoc(userRef, { ...profile, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

// Get profile
export const getProfile = async (userId) => {
  try {
    if (!userId) return {};
    const userRef = doc(db, 'users', userId, 'data', 'profile');
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data() : {};
  } catch (error) {
    console.error('Error getting profile:', error);
    return {};
  }
};

// Real-time listener for profile
export const onProfileChange = (userId, callback) => {
  if (!userId) return () => {};
  const userRef = doc(db, 'users', userId, 'data', 'profile');
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({});
    }
  });
};

// ========== SETTINGS ==========

// Save settings
export const saveSettings = async (userId, settings) => {
  try {
    if (!userId) return;
    const userRef = doc(db, 'users', userId, 'data', 'settings');
    await setDoc(userRef, { ...settings, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

// Get settings
export const getSettings = async (userId) => {
  try {
    if (!userId) return {};
    const userRef = doc(db, 'users', userId, 'data', 'settings');
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data() : {};
  } catch (error) {
    console.error('Error getting settings:', error);
    return {};
  }
};

// Real-time listener for settings
export const onSettingsChange = (userId, callback) => {
  if (!userId) return () => {};
  const userRef = doc(db, 'users', userId, 'data', 'settings');
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({});
    }
  });
};

// ========== STREAK ==========

// Save streak data
export const saveStreak = async (userId, streak, lastDate) => {
  try {
    if (!userId) return;
    const userRef = doc(db, 'users', userId, 'data', 'streak');
    await setDoc(userRef, { streak, lastDate, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving streak:', error);
    throw error;
  }
};

// Get streak data
export const getStreak = async (userId) => {
  try {
    if (!userId) return { streak: 0, lastDate: null };
    const userRef = doc(db, 'users', userId, 'data', 'streak');
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return { streak: 0, lastDate: null };
  } catch (error) {
    console.error('Error getting streak:', error);
    return { streak: 0, lastDate: null };
  }
};

// Real-time listener for streak
export const onStreakChange = (userId, callback) => {
  if (!userId) return () => {};
  const userRef = doc(db, 'users', userId, 'data', 'streak');
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ streak: 0, lastDate: null });
    }
  });
};

// ========== RESOURCES ==========

const normalizeFirestoreDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
};

const normalizeResource = (docSnap) => {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    ...data,
    createdAt: normalizeFirestoreDate(data.createdAt),
    updatedAt: normalizeFirestoreDate(data.updatedAt),
    lastOpenedAt: normalizeFirestoreDate(data.lastOpenedAt),
    lastStudiedAt: normalizeFirestoreDate(data.lastStudiedAt)
  };
};

const sanitizeFileName = (fileName = 'file') => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const uploadResourceFile = async (userId, file) => {
  try {
    if (!userId || !file) return null;

    const normalizedName = sanitizeFileName(file.name);
    const storagePath = `users/${userId}/resources/${Date.now()}-${normalizedName}`;
    const fileRef = storageRef(storage, storagePath);

    await uploadBytes(fileRef, file, {
      contentType: file.type || 'application/octet-stream'
    });

    const fileUrl = await getDownloadURL(fileRef);

    return {
      fileUrl,
      storagePath,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size
    };
  } catch (error) {
    console.error('Error uploading resource file:', error);
    throw error;
  }
};

export const uploadProfileImage = async (userId, file) => {
  try {
    if (!userId || !file) return null;

    const fileRef = storageRef(storage, `users/${userId}/profile/avatar`);

    await uploadBytes(fileRef, file, {
      contentType: file.type || 'application/octet-stream'
    });

    const photoUrl = await getDownloadURL(fileRef);

    return {
      photoUrl,
      photoName: file.name,
      photoStoragePath: fileRef.fullPath
    };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const deleteStoredFile = async (storagePath) => {
  try {
    if (!storagePath) return false;

    const fileRef = storageRef(storage, storagePath);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Error deleting stored file:', error);
    return false;
  }
};

export const addResource = async (userId, resource) => {
  try {
    if (!userId) return null;

    const now = new Date();
    const resourcesRef = collection(db, 'users', userId, 'resources');
    const docRef = await addDoc(resourcesRef, {
      ...resource,
      createdAt: now,
      updatedAt: now
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding resource:', error);
    throw error;
  }
};

export const getResources = async (userId) => {
  try {
    if (!userId) return [];

    const resourcesRef = collection(db, 'users', userId, 'resources');
    const resourcesQuery = query(resourcesRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(resourcesQuery);

    return snapshot.docs.map(normalizeResource);
  } catch (error) {
    console.error('Error getting resources:', error);
    return [];
  }
};

export const updateResource = async (userId, resourceId, updates) => {
  try {
    if (!userId || !resourceId) return false;

    const resourceRef = doc(db, 'users', userId, 'resources', resourceId);
    await updateDoc(resourceRef, {
      ...updates,
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (userId, resourceId, storagePath = '') => {
  try {
    if (!userId || !resourceId) return false;

    if (storagePath) {
      await deleteStoredFile(storagePath);
    }

    const resourceRef = doc(db, 'users', userId, 'resources', resourceId);
    await deleteDoc(resourceRef);

    return true;
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

export const onResourcesChange = (userId, callback) => {
  if (!userId) return () => {};

  const resourcesRef = collection(db, 'users', userId, 'resources');
  const resourcesQuery = query(resourcesRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(resourcesQuery, (snapshot) => {
    callback(snapshot.docs.map(normalizeResource));
  });
};
