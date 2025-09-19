import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBQeCrtOOY2AFP8r8VEASMve6xThKbIn9k",
  authDomain: "glogo-carwash.firebaseapp.com",
  projectId: "glogo-carwash",
  storageBucket: "glogo-carwash.firebasestorage.app",
  messagingSenderId: "996997125827",
  appId: "1:996997125827:web:5b121692fd1410b41f3476",
  measurementId: "G-DPW5H4V9FP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);