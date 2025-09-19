import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { clients } from '../data';

export const initializeFirebaseData = async () => {
  try {
    // Check if clients data already exists
    const docRef = doc(db, 'schedule', 'clients');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Upload initial clients data
      await setDoc(docRef, {
        clients: clients,
        lastUpdated: new Date().toISOString()
      });
      console.log('Initial clients data uploaded to Firebase');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Firebase data:', error);
    return false;
  }
};