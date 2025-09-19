import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const useActivityLogger = () => {
  const logActivity = async (action, details = '') => {
    try {
      const username = localStorage.getItem('glogo_username') || 'Unknown';
      await addDoc(collection(db, 'activities'), {
        username,
        action,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return { logActivity };
};