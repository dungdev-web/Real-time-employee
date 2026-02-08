import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../services/api';
import Chat from '../../components/Chat';
import '../../css/EmployeeDashboard.scss';

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
    return (
      <div className="loading-screen">
        <div className="loader">
          <div className="loader-spinner"></div>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return <div className="loading-screen">No employee data found</div>;
  }

// Lấy owner ID từ task hoặc từ localStorage
let ownerId = null;

if (tasks.length > 0 && tasks[0].assignedBy) {
  ownerId = tasks[0].assignedBy;
} else {
  // Lấy từ employee data (owner info khi login)
  const employeeData = employee;
  ownerId = employeeData?.ownerId || employeeData?.assignedBy;
}

// Fallback: nếu vẫn không có, log error
if (!ownerId || ownerId === 'owner') {
  console.error('❌ Owner ID not found!', { ownerId, tasks });
  // Có thể set giá trị mặc định hoặc show error cho user
  ownerId = null;
}  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="dashboard-container">
      {/* Animated background */}
      <div className="dashboard-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-wrapper">
            <svg viewBox="0 0 24 24" fill="none" className="logo-icon">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="header-title">
            <h1>Dashboard</h1>
            <p>Welcome back, {employee.name}!</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowChat(!showChat)} className="chat-toggle-button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {showChat ? 'Hide Chat' : 'Chat'}
          </button>
          <button onClick={handleLogout} className="logout-button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="notification error-notification">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          {error}
          <button onClick={() => setError('')} className="close-notification">✕</button>
        </div>
      )}
      
      {message && (
        <div className="notification success-notification">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {message}
          <button onClick={() => setMessage('')} className="close-notification">✕</button>
        </div>
      )}

      <div className="dashboard-content">
        <div className="main-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card total-tasks">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>{tasks.length}</h3>
                <p>Total Tasks</p>
              </div>
            </div>

            <div className="stat-card pending-tasks">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>{pendingTasks}</h3>
                <p>Pending</p>
              </div>
            </div>

            <div className="stat-card completed-tasks">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>{completedTasks}</h3>
                <p>Completed</p>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="profile-section glass-card">
            <div className="section-header">
              <div className="header-title-wrapper">
                <svg viewBox="0 0 24 24" fill="none" className="section-icon">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2>My Profile</h2>
              </div>
              <button onClick={() => setEditMode(!editMode)} className="edit-button">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" className="input-icon">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Name
                    </label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" className="input-icon">
                        <path d="M22 16.92V19.92C22 20.4833 21.7761 21.0235 21.3728 21.4228C20.9694 21.8261 20.4293 22.05 19.866 22.05C16.6193 21.7659 13.4987 20.6409 10.78 18.78C8.26254 17.0821 6.16097 14.8905 4.63 12.36C2.73999 9.61119 1.59997 6.45503 1.33 3.184C1.31 2.62182 1.52892 2.07945 1.93216 1.67477C2.33539 1.27009 2.87776 1.05001 3.44 1.05001H6.44C7.46006 1.03898 8.31995 1.77009 8.45 2.78C8.60122 3.78808 8.85893 4.77801 9.22 5.73C9.48 6.42 9.3 7.2 8.74 7.76L7.51 8.99C9.08004 11.6275 11.3725 13.92 14.01 15.49L15.24 14.26C15.8 13.7 16.58 13.52 17.27 13.78C18.222 14.1411 19.2119 14.3988 20.22 14.55C21.24 14.68 21.98 15.56 21.98 16.59L22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="save-button">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="profile-info">
                <div className="profile-avatar">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="profile-details">
                  <div className="profile-item">
                    <span className="label">Name:</span>
                    <span className="value">{employee.name}</span>
                  </div>
                  <div className="profile-item">
                    <span className="label">Email:</span>
                    <span className="value">{employee.email}</span>
                  </div>
                  <div className="profile-item">
                    <span className="label">Department:</span>
                    <span className="value">{employee.department}</span>
                  </div>
                  <div className="profile-item">
                    <span className="label">Role:</span>
                    <span className="value">{employee.role || 'Employee'}</span>
                  </div>
                  {employee.phone && (
                    <div className="profile-item">
                      <span className="label">Phone:</span>
                      <span className="value">{employee.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="tasks-section glass-card">
            <div className="section-header">
              <div className="header-title-wrapper">
                <svg viewBox="0 0 24 24" fill="none" className="section-icon">
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2>My Tasks ({tasks.length})</h2>
              </div>
            </div>
            
            {tasks.length === 0 ? (
              <div className="no-tasks">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3>No tasks assigned yet</h3>
                <p>Check back later for new assignments</p>
              </div>
            ) : (
              <div className="task-list">
                {tasks.map((task, index) => (
                  <div 
                    key={task.taskId} 
                    className={`task-card ${task.status}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="task-header">
                      <h3>{task.title}</h3>
                      <span className={`status-badge ${task.status}`}>
                        {task.status === 'completed' ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Completed
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Pending
                          </>
                        )}
                      </span>
                    </div>
                    <p className="task-description">{task.description}</p>
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleCompleteTask(task.taskId)}
                        className="complete-button"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Mark as Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        {showChat && (
          <div className="chat-section glass-card">
            <div className="chat-header">
              <div className="chat-header-info">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>Chat with Manager</h3>
              </div>
              <button onClick={() => setShowChat(false)} className="close-chat-button">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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