import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../services/api';
import '../../css/EmployeeTask.scss';

function EmployeeTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const navigate = useNavigate();

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType !== 'employee') {
      navigate('/employee/login');
      return;
    }
    loadTasks();
  }, [navigate]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const employeeId = localStorage.getItem('employeeId');
      const response = await employeeAPI.getTasks(employeeId);
      
      if (response.success) {
        setTasks(response.tasks || []);
      }
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const response = await employeeAPI.completeTask(employeeId, taskId);
      
      if (response.success) {
        setMessage('Task completed successfully!');
        loadTasks();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete task');
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    return filtered;
  };

  const getSortedTasks = (tasksToSort) => {
    const sorted = [...tasksToSort];

    switch (sortBy) {
      case 'deadline':
        return sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return sorted.sort((a, b) => {
          const aPriority = priorityOrder[a.priority] ?? 2;
          const bPriority = priorityOrder[b.priority] ?? 2;
          return aPriority - bPriority;
        });
      case 'recent':
        return sorted.sort((a, b) => {
          const aDate = a.createdAt || 0;
          const bDate = b.createdAt || 0;
          return bDate - aDate;
        });
      default:
        return sorted;
    }
  };

  const filteredTasks = getFilteredTasks();
  const sortedTasks = getSortedTasks(filteredTasks);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getDateColor = (dateString) => {
    if (!dateString) return 'neutral';
    const date = new Date(dateString);
    const today = new Date();
    
    if (date < today) {
      return 'overdue';
    } else if (date.getTime() - today.getTime() < 86400000) {
      return 'urgent';
    } else {
      return 'normal';
    }
  };

  if (loading) {
    return (
      <div className="task-loading">
        <div className="loader">
          <div className="loader-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-container">
      {/* Background */}
      <div className="task-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Header */}
      <header className="task-header">
        <div className="header-content">
          <h1>Tasks</h1>
          <p>Manage your assignments and track progress</p>
        </div>
        <button onClick={() => window.history.back()} className="back-button">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
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

      {/* Main Content */}
      <div className="task-content">
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
              <h3>{pendingCount}</h3>
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
              <h3>{completedCount}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card high-priority-tasks">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26H22L17.45 12.42L19.54 18.58L12 14.42L4.46 18.58L6.55 12.42L2 8.26H8.91L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{highPriorityCount}</h3>
              <p>High Priority</p>
            </div>
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="task-controls glass-card">
          <div className="filter-section">
            <h3>Filter by Status</h3>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All Tasks
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="sort-section">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="tasks-section glass-card">
          <div className="section-header">
            <h2>
              {filterStatus === 'all' ? 'All Tasks' : filterStatus === 'pending' ? 'Pending Tasks' : 'Completed Tasks'}
              <span className="task-count">({sortedTasks.length})</span>
            </h2>
          </div>

          {sortedTasks.length === 0 ? (
            <div className="no-tasks">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No tasks found</h3>
              <p>
                {filterStatus === 'all' && 'No tasks assigned yet. Check back later!'}
                {filterStatus === 'pending' && 'Great! You have no pending tasks.'}
                {filterStatus === 'completed' && 'You haven\'t completed any tasks yet.'}
              </p>
            </div>
          ) : (
            <div className="task-list">
              {sortedTasks.map((task, index) => (
                <div 
                  key={task.taskId} 
                  className={`task-card ${task.status}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="task-checkbox">
                    {task.status === 'completed' ? (
                      <div className="checkbox checked">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="checkbox"></div>
                    )}
                  </div>

                  <div className="task-info">
                    <h3 className="task-title">{task.title}</h3>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    
                    <div className="task-meta">
                      {task.priority && (
                        <span className={`priority-badge ${task.priority}`}>
                          {task.priority === 'high' && '⚡'}
                          {task.priority === 'medium' && '→'}
                          {task.priority === 'low' && '↓'}
                          {' '}{task.priority}
                        </span>
                      )}
                      
                      {task.dueDate && (
                        <span className={`date-badge ${getDateColor(task.dueDate)}`}>
                          <svg viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleCompleteTask(task.taskId)}
                      className="complete-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Complete
                    </button>
                  )}

                  {task.status === 'completed' && (
                    <div className="completed-badge">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Done
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Section */}
        {tasks.length > 0 && (
          <div className="progress-section glass-card">
            <h2>Your Progress</h2>
            <div className="progress-bar-wrapper">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                ></div>
              </div>
              <p className="progress-text">
                {completedCount} of {tasks.length} tasks completed ({Math.round((completedCount / tasks.length) * 100)}%)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeTask;