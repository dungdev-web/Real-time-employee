import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerAPI } from '../../services/api';
import '../../css/OwnerManageEmployee.scss';

function OwnerManageEmployee() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
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
      setLoading(true);
      const response = await ownerAPI.getAllEmployees();
      if (response.success) {
        setEmployees(response.employees || []);
      }
    } catch (err) {
      setError('Failed to load employees');
      console.error(err);
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

    const ownerId = localStorage.getItem('ownerId');
    if (!ownerId) {
      setError('Owner ID not found. Please refresh the page.');
      return;
    }

    try {
      const response = await ownerAPI.createEmployee({
        ...formData,
        ownerId: ownerId
      });

      if (response.success) {
        setMessage('Employee added successfully! Setup email sent.');
        setFormData({ name: '', email: '', department: '', phone: '', role: '' });
        setShowAddForm(false);
        loadEmployees();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await ownerAPI.deleteEmployee(employeeId);
      if (response.success) {
        setMessage('Employee deleted successfully');
        loadEmployees();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  const getFilteredEmployees = () => {
    let filtered = employees;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        (emp.phone && emp.phone.includes(query))
      );
    }

    // Department filter
    if (filterDept !== 'all') {
      filtered = filtered.filter(emp => emp.department === filterDept);
    }

    return filtered;
  };

  const getSortedEmployees = (emps) => {
    const sorted = [...emps];

    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'status':
        return sorted.sort((a, b) => {
          const aStatus = a.accountSetup ? 0 : 1;
          const bStatus = b.accountSetup ? 0 : 1;
          return aStatus - bStatus;
        });
      default:
        return sorted;
    }
  };

  const filteredEmployees = getFilteredEmployees();
  const sortedEmployees = getSortedEmployees(filteredEmployees);

  const activeEmployees = employees.filter(e => e.accountSetup).length;
  const pendingEmployees = employees.filter(e => !e.accountSetup).length;
  const departments = [...new Set(employees.map(e => e.department))];

  if (loading) {
    return (
      <div className="manage-loading">
        <div className="loader">
          <div className="loader-spinner"></div>
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-container">
      {/* Background */}
      <div className="manage-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Header */}
      <header className="manage-header">
        <div className="header-content">
          <h1>Manage Employees</h1>
          <p>Hire, manage, and track your team</p>
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
      <div className="manage-content">
        {/* Stats Cards */}
        {/* <div className="stats-grid">
          <div className="stat-card total-employees">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{employees.length}</h3>
              <p>Total Employees</p>
            </div>
          </div>

          <div className="stat-card active-employees">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{activeEmployees}</h3>
              <p>Active</p>
            </div>
          </div>

          <div className="stat-card pending-employees">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{pendingEmployees}</h3>
              <p>Pending Setup</p>
            </div>
          </div>
        </div> */}

        {/* Add Employee Button & Controls */}
        <div className="controls-section glass-card">
          <div className="controls-header">
            <button 
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingEmployee(null);
              }} 
              className="add-button"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {showAddForm ? 'Cancel' : 'Add Employee'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddEmployee} className="add-employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Engineering"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="Senior Developer"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add Employee
                </button>
              </div>
            </form>
          )}

          {/* Search & Filter */}
          <div className="search-filter-section">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-controls">
              <select 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="status">Active First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employees Table/Cards */}
        <div className="employees-section glass-card">
          <div className="section-header">
            <h2>
              Employees
              <span className="employee-count">({sortedEmployees.length})</span>
            </h2>
          </div>

          {sortedEmployees.length === 0 ? (
            <div className="no-employees">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No employees found</h3>
              <p>
                {searchQuery && 'No employees match your search. Try a different query.'}
                {!searchQuery && filterDept !== 'all' && 'No employees in this department.'}
                {!searchQuery && filterDept === 'all' && 'Add your first employee to get started.'}
              </p>
            </div>
          ) : (
            <div className="employees-grid">
              {sortedEmployees.map((employee, index) => (
                <div 
                  key={employee.employeeId} 
                  className={`employee-card ${employee.accountSetup ? 'active' : 'pending'}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="employee-avatar">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="employee-details">
                    <h3 className="employee-name">{employee.name}</h3>
                    <p className="employee-email">{employee.email}</p>
                    
                    <div className="employee-meta">
                      <span className="department">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
                          <path d="M9 21V9" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {employee.department}
                      </span>
                      
                      {employee.role && (
                        <span className="role">{employee.role}</span>
                      )}
                    </div>

                    {employee.phone && (
                      <p className="employee-phone">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M22 16.92V19.92C22 20.4833 21.7761 21.0235 21.3728 21.4228C20.9694 21.8261 20.4293 22.05 19.866 22.05C16.6193 21.7659 13.4987 20.6409 10.78 18.78C8.26254 17.0821 6.16097 14.8905 4.63 12.36C2.73999 9.61119 1.59997 6.45503 1.33 3.184C1.31 2.62182 1.52892 2.07945 1.93216 1.67477C2.33539 1.27009 2.87776 1.05001 3.44 1.05001H6.44C7.46006 1.03898 8.31995 1.77009 8.45 2.78C8.60122 3.78808 8.85893 4.77801 9.22 5.73C9.48 6.42 9.3 7.2 8.74 7.76L7.51 8.99C9.08004 11.6275 11.3725 13.92 14.01 15.49L15.24 14.26C15.8 13.7 16.58 13.52 17.27 13.78C18.222 14.1411 19.2119 14.3988 20.22 14.55C21.24 14.68 21.98 15.56 21.98 16.59L22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {employee.phone}
                      </p>
                    )}

                    
                  </div>

                  <div className="employee-actions">
                    <div className="status-section">
                      <span className={`status-badge ${employee.accountSetup ? 'active' : 'pending'}`}>
                        {employee.accountSetup ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Active
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
                    <button 
                      onClick={() => handleDeleteEmployee(employee.employeeId)}
                      className="delete-button"
                      title="Delete employee"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerManageEmployee;