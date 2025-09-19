import { useState, useEffect } from 'react';
import './LoginScreen.css';
import { USERS } from '../config/passwords';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [dbUsers, setDbUsers] = useState({});

  useEffect(() => {
    loadUsersFromDB();
  }, []);

  const loadUsersFromDB = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = {};
      querySnapshot.docs.forEach(doc => {
        const userData = doc.data();
        users[userData.username] = {
          password: userData.password,
          role: userData.role
        };
      });
      setDbUsers(users);
    } catch (error) {
      console.error('Error loading users from database:', error);
    }
  };



  const handleSubmit = (e) => {
    e.preventDefault();
    const userKey = username.toLowerCase();
    
    // Only allow admin from hardcoded users, all others must be from database
    let user = null;
    if (userKey === 'admin' && USERS[userKey] && USERS[userKey].password === password) {
      user = USERS[userKey];
    } else {
      user = dbUsers[userKey];
    }
    
    if (user && user.password === password) {
      // Log login activity
      addDoc(collection(db, 'activities'), {
        username: username,
        action: 'Login',
        details: `User logged in with role: ${user.role}`,
        timestamp: new Date()
      }).catch(err => console.error('Error logging activity:', err));
      
      onLogin(user.role, username);
      setError('');
    } else {
      // Log failed login attempt
      addDoc(collection(db, 'activities'), {
        username: username || 'Unknown',
        action: 'Failed Login',
        details: 'Invalid credentials',
        timestamp: new Date()
      }).catch(err => console.error('Error logging activity:', err));
      
      setError('Invalid username or password');
      setPassword('');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <img src="/logo.png" alt="GLOGO Logo" className="login-logo" />
          <h1>GLOGO Car Wash</h1>
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