import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import Chat from '../components/Chat';
import '../css/EmployeeDashboard.css';

function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const employeeData = localStorage.getItem('employeeData');
    
    if (userType !== 'employee') {
      navigate('/employee/login');
      return;
    }

    if (employeeData) {
      const parsedData = JSON.parse(employeeData);
      setEmployee(parsedData);
      setEditData({
        name: parsedData.name || '',
        phone: parsedData.phone || ''
      });
    }

    loadProfile();
    loadTasks();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const response = await employeeAPI.getProfile(employeeId);
      if (response.success) {
        setEmployee(response.employee);
        localStorage.setItem('employeeData', JSON.stringify(response.employee));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const response = await employeeAPI.getTasks(employeeId);
      if (response.success) {
        setTasks(response.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const employeeId = localStorage.getItem('employeeId');
      const response = await employeeAPI.updateProfile({
        employeeId,
        ...editData
      });
      
      if (response.success) {
        setMessage('Profile updated successfully!');
        setEditMode(false);
        loadProfile();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const response = await employeeAPI.completeTask(employeeId, taskId);
      
      if (response.success) {
        setMessage('Task marked as complete!');
        loadTasks();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete task');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/employee/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!employee) {
    return <div className="loading">No employee data found</div>;
  }

  // Get owner ID from the first task or use a default
  const ownerId = tasks.length > 0 ? tasks[0].assignedBy : localStorage.getItem('ownerId') || 'owner';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Employee Dashboard</h1>
        <div className="header-actions">
          <button onClick={() => setShowChat(!showChat)} className="chat-toggle-button">
            💬 {showChat ? 'Hide Chat' : 'Chat with Manager'}
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="dashboard-content">
        <div className="main-content">
          {/* Profile Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>My Profile</h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="edit-button"
              >
                {editMode ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>
                <button type="submit" className="save-button">Save Changes</button>
              </form>
            ) : (
              <div className="profile-info">
                <p><strong>Name:</strong> {employee.name}</p>
                <p><strong>Email:</strong> {employee.email}</p>
                <p><strong>Department:</strong> {employee.department}</p>
                <p><strong>Role:</strong> {employee.role || 'Employee'}</p>
                {employee.phone && <p><strong>Phone:</strong> {employee.phone}</p>}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="tasks-section">
            <h2>My Tasks ({tasks.length})</h2>
            
            {tasks.length === 0 ? (
              <p className="no-tasks">No tasks assigned yet.</p>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <div key={task.taskId} className={`task-card ${task.status}`}>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <div className="task-meta">
                      <span className={`status-badge ${task.status}`}>
                        {task.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                      </span>
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleCompleteTask(task.taskId)}
                          className="complete-button"
                        >
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showChat && (
          <div className="chat-section">
            <div className="chat-header">
              <h3>Chat with Manager</h3>
              <button onClick={() => setShowChat(false)} className="close-button">
                ✕
              </button>
            </div>
            <Chat
              currentUserId={employee.employeeId}
              currentUserType="employee"
              otherUserId={ownerId}
              otherUserName="Manager"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;