import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCx-Ee9kbneoAGzqvaKC9CZE-Im6Id1El4",
  authDomain: "schedule-3314f.firebaseapp.com",
  projectId: "schedule-3314f",
  storageBucket: "schedule-3314f.firebasestorage.app",
  messagingSenderId: "964408323673",
  appId: "1:964408323673:web:a23552c25ffd7e0ead4b48",
  measurementId: "G-KN9DPN7L1Y"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);