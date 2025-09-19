import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import { usePasswordConfirm } from '../hooks/usePasswordConfirm';
import { useActivityLogger } from '../hooks/useActivityLogger';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(true);
  
  const currentUsername = localStorage.getItem('glogo_username');
  const { showPasswordModal, confirmWithPassword, handlePasswordConfirm, handlePasswordCancel } = usePasswordConfirm(currentUsername);
  const { logActivity } = useActivityLogger();

  useEffect(() => {
    loadUsers();
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;

    confirmWithPassword(async () => {
      try {
        await addDoc(collection(db, 'users'), {
          username: newUser.username.toLowerCase(),
          password: newUser.password,
          role: newUser.role,
          createdAt: new Date()
        });
        
        await logActivity('Add User', `Added user: ${newUser.username} with role: ${newUser.role}`);
        
        setNewUser({ username: '', password: '', role: 'user' });
        setShowAddForm(false);
        loadUsers();
      } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user');
      }
    });
  };

  const handleDeleteUser = (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    confirmWithPassword(async () => {
      try {
        const userToDelete = users.find(u => u.id === userId);
        await deleteDoc(doc(db, 'users', userId));
        await logActivity('Delete User', `Deleted user: ${userToDelete?.username}`);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    });
  };

  const handleRoleChange = (userId, newRole) => {
    confirmWithPassword(async () => {
      try {
        const user = users.find(u => u.id === userId);
        await updateDoc(doc(db, 'users', userId), { role: newRole });
        await logActivity('Change Role', `Changed ${user?.username} role to: ${newRole}`);
        loadUsers();
      } catch (error) {
        console.error('Error updating role:', error);
        alert('Error updating role');
      }
    });
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <button 
          className="add-user-btn"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Add User
        </button>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="add-user-form">
            <h2>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-buttons">
                <button type="submit">Add User</button>
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`role-select ${user.role}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        username={currentUsername}
      />
    </div>
  );
};

export default UserManagement;