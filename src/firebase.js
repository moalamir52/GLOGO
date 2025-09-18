import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCx-Ee9kbneoAGzqvaKC9CZE-Im6Id1El4",
  authDomain: "schedule-3314f.firebaseapp.com",
  projectId: "schedule-3314f",
  storageBucket: "schedule-3314f.firebasestorage.app",
  messagingSenderId: "964408323673",
  appId: "1:964408323673:web:4e7e9c2af4bc4ebfad4b48",
  measurementId: "G-QCBPLPVL9H"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);