import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import './AdminMonitor.css';

const AdminMonitor = () => {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    loadUsers();
    loadActivities();
  }, []);

  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const activitiesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesList);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  return (
    <div className="admin-monitor">
      <h1>🔍 Admin Monitor</h1>
      
      <div className="monitor-section">
        <h2>👤 Users & Passwords</h2>
        <button onClick={() => setShowPasswords(!showPasswords)}>
          {showPasswords ? '🙈 Hide' : '👁️ Show'} Passwords
        </button>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{showPasswords ? user.password : '••••••••'}</td>
                <td>{user.role}</td>
                <td>{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="monitor-section">
        <h2>📊 User Activities</h2>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(activity => (
              <tr key={activity.id}>
                <td>{activity.username}</td>
                <td>{activity.action}</td>
                <td>{activity.details}</td>
                <td>{activity.timestamp ? new Date(activity.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMonitor;