

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLuToOe1enzbXT9ZMay9_KlKX3qVr_dRQ",
  authDomain: "task-manager-app-28084.firebaseapp.com",
  projectId: "task-manager-app-28084",
  storageBucket: "task-manager-app-28084.firebasestorage.app",
  messagingSenderId: "116877350412",
  appId: "1:116877350412:web:4b71d43cb229909445c029",
  measurementId: "G-SE3MMFWK6S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
