import { useState } from 'react';
import './PasswordConfirmModal.css';

const PasswordConfirmModal = ({ isOpen, onConfirm, onCancel, username }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);

  // Load saved password on mount
  useState(() => {
    const savedPassword = localStorage.getItem(`saved_password_${username}`);
    if (savedPassword) {
      setPassword(savedPassword);
      setRememberPassword(true);
    }
  }, [username]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    
    // Save password if remember is checked
    if (rememberPassword) {
      localStorage.setItem(`saved_password_${username}`, password);
    } else {
      localStorage.removeItem(`saved_password_${username}`);
    }
    
    onConfirm(password);
    if (!rememberPassword) {
      setPassword('');
    }
    setError('');
  };

  const handleCancel = () => {
    if (!rememberPassword) {
      setPassword('');
    }
    setError('');
    setShowPassword(false);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <h3>🔒 Confirm Action</h3>
        <p>Please enter your password to confirm this action:</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Password for {username}:</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
              />
              Remember my password
            </label>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-buttons">
            <button type="submit" className="confirm-btn">Confirm</button>
            <button type="button" onClick={handleCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordConfirmModal;