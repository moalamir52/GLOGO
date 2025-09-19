import { useState } from 'react';
import './LoginScreen.css';
import { USERS } from '../config/passwords';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');



  const handleSubmit = (e) => {
    e.preventDefault();
    const user = USERS[username.toLowerCase()];
    if (user && user.password === password) {
      onLogin(user.role, username);
      setError('');
    } else {
      setError('Invalid username or password');
      setPassword('');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>🚗 GLOGO Car Wash</h1>
          <p>Schedule Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          

          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        
        <div className="login-footer">
          <p>© 2024 GLOGO Car Wash - Developed by Mihamed Alamir</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;