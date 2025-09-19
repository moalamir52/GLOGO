import { useState } from 'react';

export const usePasswordProtection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionDescription, setActionDescription] = useState('');

  const requestPassword = (action, description) => {
    setPendingAction(() => action);
    setActionDescription(description);
    setIsModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setIsModalOpen(false);
  };

  const handlePasswordClose = () => {
    setIsModalOpen(false);
    setPendingAction(null);
    setActionDescription('');
  };

  return {
    isModalOpen,
    actionDescription,
    requestPassword,
    handlePasswordSuccess,
    handlePasswordClose
  };
};