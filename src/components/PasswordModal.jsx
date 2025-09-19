import { useState } from 'react';
import './PasswordModal.css';

const PasswordModal = ({ isOpen, onClose, onSuccess, action }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ADMIN_PASSWORD = 'GLOGO2025'; // Can be changed

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
      setPassword('');
      setError('');
      onClose();
    } else {
      setError('Incorrect password');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <h3>Confirm Action</h3>
        <p>Enter password to {action}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {error && <div className="error">Incorrect password</div>}
          <div className="modal-buttons">
            <button type="submit">Confirm</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;