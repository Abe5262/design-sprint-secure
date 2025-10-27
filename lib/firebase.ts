import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyDGKCNN33Ee3NAOBRNQJ0HCYcWbb9d-U",
  authDomain: "industrial-competitivene-67b78.firebaseapp.com",
  projectId: "industrial-competitivene-67b78",
  storageBucket: "industrial-competitivene-67b78.firebasestorage.app",
  messagingSenderId: "754137375405",
  appId: "1:754137375405:web:1b7c663a8d6665f7dedc24",
  measurementId: "G-L21QS9964K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };
