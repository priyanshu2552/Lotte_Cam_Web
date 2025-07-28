import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faEnvelope, faPhone, faLock,
  faEdit, faTrash, faPlus, faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/Sidebar';
import '../styles/Profile.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    contact: '',
    role: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    contact: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:3000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setProfile(response.data);
        
        // If user is admin, fetch all users
        if (response.data.role === 'admin') {
          const usersResponse = await axios.get('http://localhost:3000/api/users/getallusers', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUsers(usersResponse.data);
        }

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3000/api/users/profile', {
        name: profile.name,
        contact: profile.contact
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/users/delete-user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(users.filter(user => user.id !== userId));
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/users/create-user', userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers([...users, response.data]);
      setUserForm({
        name: '',
        email: '',
        contact: '',
        password: '',
        role: 'user'
      });
      setShowUserModal(false);
      setSuccess('User created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <Sidebar />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Sidebar />
      <div className="profile-content">
        <h1>Profile Settings</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="profile-card">
          <div className="profile-header">
            <h2>
              <FontAwesomeIcon icon={faUser} /> Personal Information
              {!isEditing && (
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
              )}
            </h2>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faEnvelope} /> Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                />
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faPhone} /> Contact</label>
                <input
                  type="text"
                  value={profile.contact}
                  onChange={(e) => setProfile({...profile, contact: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <FontAwesomeIcon icon={faSave} /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{profile.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{profile.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Contact:</span>
                <span className="info-value">{profile.contact || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role:</span>
                <span className="info-value">{profile.role}</span>
              </div>
            </div>
          )}
          
          <div className="password-section">
            <h3><FontAwesomeIcon icon={faLock} /> Password</h3>
            <button 
              className="change-password-btn"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              Change Password
            </button>
            
            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value
                    })}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        {/* Admin Section - User Management */}
        {profile.role === 'admin' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>User Management</h2>
              <button 
                className="add-user-btn"
                onClick={() => setShowUserModal(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add New User
              </button>
            </div>
            
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.contact || '-'}</td>
                      <td>{user.role}</td>
                      <td className="actions">
                        <button 
                          className="delete-btn"
                          onClick={() => handleUserDelete(user.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Add User Modal */}
        {showUserModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add New User</h2>
                <button onClick={() => setShowUserModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <form onSubmit={handleUserSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({
                      ...userForm,
                      name: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({
                      ...userForm,
                      email: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input
                    type="text"
                    value={userForm.contact}
                    onChange={(e) => setUserForm({
                      ...userForm,
                      contact: e.target.value
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({
                      ...userForm,
                      password: e.target.value
                    })}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({
                      ...userForm,
                      role: e.target.value
                    })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    onClick={() => setShowUserModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    <FontAwesomeIcon icon={faSave} /> Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;