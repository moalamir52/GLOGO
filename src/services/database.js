import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Save appointments to Firebase
export const saveAppointments = async (appointments) => {
  try {
    await setDoc(doc(db, 'schedule', 'appointments'), {
      appointments: appointments,
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error saving appointments:', error);
    return false;
  }
};

// Load appointments from Firebase
export const loadAppointments = async () => {
  try {
    const docRef = doc(db, 'schedule', 'appointments');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().appointments || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading appointments:', error);
    const savedAppointments = localStorage.getItem('appointments');
    return savedAppointments ? JSON.parse(savedAppointments) : [];
  }
};

// Save clients data to Firebase
export const saveClientsData = async (clientsData) => {
  try {
    await setDoc(doc(db, 'schedule', 'clients'), {
      clients: clientsData,
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error saving clients:', error);
    return false;
  }
};

// Load clients data from Firebase
export const loadClientsData = async () => {
  try {
    const docRef = doc(db, 'schedule', 'clients');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().clients || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading clients:', error);
    const savedClients = localStorage.getItem('clientsData');
    return savedClients ? JSON.parse(savedClients) : [];
  }
};