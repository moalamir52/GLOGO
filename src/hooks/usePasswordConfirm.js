import { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { USERS } from '../config/passwords';

export const usePasswordConfirm = (username) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const confirmWithPassword = (action) => {
    setPendingAction(() => action);
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async (enteredPassword) => {
    try {
      // Get user's actual password
      let userPassword = null;
      
      // Check if admin using hardcoded password
      if (username.toLowerCase() === 'admin' && USERS.admin) {
        userPassword = USERS.admin.password;
      } else {
        // Check database for user password
        const querySnapshot = await getDocs(collection(db, 'users'));
        const dbUser = querySnapshot.docs.find(doc => 
          doc.data().username === username.toLowerCase()
        );
        if (dbUser) {
          userPassword = dbUser.data().password;
        }
      }

      if (userPassword === enteredPassword) {
        setShowPasswordModal(false);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      } else {
        throw new Error('Incorrect password');
      }
    } catch (error) {
      alert('Incorrect password. Please try again.');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingAction(null);
  };

  return {
    showPasswordModal,
    confirmWithPassword,
    handlePasswordConfirm,
    handlePasswordCancel
  };
};