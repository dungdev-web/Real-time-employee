import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerAPI } from '../services/api';
import Chat from '../components/Chat';
import '../css/OwnerDashboard.css';

function OwnerDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    role: ''
  });

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType !== 'owner') {
      navigate('/owner/login');
      return;
    }
    loadEmployees();
  }, [navigate]);

  const loadEmployees = async () => {
    try {
      const response = await ownerAPI.getAllEmployees();
      if (response.success) {
        setEmployees(response.employees || []);
      }
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await ownerAPI.createEmployee(formData);
      if (response.success) {
        setMessage('Employee added successfully! Setup email sent.');
        setFormData({ name: '', email: '', department: '', phone: '', role: '' });
        setShowAddForm(false);
        loadEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const response = await ownerAPI.deleteEmployee(employeeId);
      if (response.success) {
        setMessage('Employee deleted successfully');
        loadEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  const handleChatWithEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowChat(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/owner/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Employee Management Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="dashboard-content">
        <div className="employee-section">
          <div className="section-header">
            <h2>Employees ({employees.length})</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="add-button"
            >
              {showAddForm ? 'Cancel' : '+ Add Employee'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddEmployee} className="employee-form">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                required
              />
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Department"
                required
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number (optional)"
              />
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                placeholder="Role (optional)"
              />
              <button type="submit">Add Employee</button>
            </form>
          )}

          <div className="employee-list">
            {employees.length === 0 ? (
              <p className="no-employees">No employees yet. Add your first employee!</p>
            ) : (
              employees.map((employee) => (
                <div key={employee.employeeId} className="employee-card">
                  <div className="employee-info">
                    <h3>{employee.name}</h3>
                    <p>{employee.email}</p>
                    <p>{employee.department} {employee.role && `- ${employee.role}`}</p>
                    {employee.phone && <p>📱 {employee.phone}</p>}
                    <p className="account-status">
                      {employee.accountSetup ? '✅ Account Active' : '⏳ Setup Pending'}
                    </p>
                  </div>
                  <div className="employee-actions">
                    <button
                      onClick={() => handleChatWithEmployee(employee)}
                      className="chat-button"
                      disabled={!employee.accountSetup}
                      title={!employee.accountSetup ? 'Employee must complete account setup first' : 'Chat with employee'}
                    >
                      💬 Chat
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.employeeId)}
                      className="delete-button"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showChat && selectedEmployee && (
          <div className="chat-section">
            <div className="chat-header">
              <h3>Chat with {selectedEmployee.name}</h3>
              <button onClick={() => setShowChat(false)} className="close-button">
                ✕
              </button>
            </div>
            <Chat
              currentUserId={localStorage.getItem('ownerId')}
              currentUserType="owner"
              otherUserId={selectedEmployee.employeeId}
              otherUserName={selectedEmployee.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;