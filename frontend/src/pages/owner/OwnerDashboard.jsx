import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ownerAPI } from "../../services/api";
import "../../css/OwnerDashboard.scss";

function OwnerDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    role: "",
  });

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "owner") {
      navigate("/owner/login");
      return;
    }

    // ✅ FIXED: Get ownerId from localStorage
    const ownerPhone = localStorage.getItem("ownerId");
    if (ownerPhone) {
      setOwnerId(ownerPhone);
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
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // ✅ FIXED: Validate ownerId exists
    if (!ownerId) {
      setError("Owner ID not found. Please refresh the page.");
      return;
    }
    setLoading(true);
    try {
      const response = await ownerAPI.createEmployee({
        ...formData,
        ownerId: ownerId,
      });

      if (response.success) {
        setMessage("Employee added successfully! Setup email sent.");
        setFormData({
          name: "",
          email: "",
          department: "",
          phone: "",
          role: "",
        });
        setShowAddForm(false);
        loadEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add employee");
    } finally {
      setLoading(false); 
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      const response = await ownerAPI.deleteEmployee(employeeId);
      if (response.success) {
        setMessage("Employee deleted successfully");
        loadEmployees();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete employee");
    }
  };

  const handleChatWithEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowChat(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/owner/login");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <div className="loader-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const activeEmployees = employees.filter((e) => e.accountSetup).length;
  const pendingEmployees = employees.filter((e) => !e.accountSetup).length;

  return (
    <div className="dashboard-container">
      {/* Animated background */}
      <div className="dashboard-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
      {/* <button type="submit" disabled={loading}>
        {loading ? "Adding employee..." : "Add Employee"}
      </button> */}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-wrapper">
            <svg viewBox="0 0 24 24" fill="none" className="logo-icon">
              <path
                d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="header-title">
            <h1>Manager Dashboard</h1>
            <p>Employee Management System</p>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17L21 12L16 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Logout
        </button>
      </header>

      {/* Notifications */}
      {error && (
        <div className="notification error-notification">
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8V12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
          {error}
          <button onClick={() => setError("")} className="close-notification">
            ✕
          </button>
        </div>
      )}

      {message && (
        <div className="notification success-notification">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M22 4L12 14.01L9 11.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {message}
          <button onClick={() => setMessage("")} className="close-notification">
            ✕
          </button>
        </div>
      )}

      <div className="dashboard-content">
        <div className="main-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card total-employees">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
                  <path
                    d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M22 4L12 14.01L9 11.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 6V12L16 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="stat-info">
                <h3>{pendingEmployees}</h3>
                <p>Pending Setup</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions glass-card">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/owner/manage-employees" className="action-card">
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3>Manage Employees</h3>
                <p>Add, edit, and manage your team members</p>
              </Link>

              <Link to="/owner/manage-tasks" className="action-card">
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 11L12 14L22 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3>Manage Tasks</h3>
                <p>Create and assign tasks to employees</p>
              </Link>

              <div
                className="action-card"
                style={{ opacity: 0.6, pointerEvents: "none" }}
              >
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 6V12L16 14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3>Reports</h3>
                <p>Coming soon...</p>
              </div>

              <div
                className="action-card"
                style={{ opacity: 0.6, pointerEvents: "none" }}
              >
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3>Settings</h3>
                <p>Coming soon...</p>
              </div>
            </div>
          </div>

          {/* Employee Section */}
          <div className="employee-section glass-card">
            <div className="section-header">
              <div className="header-title-wrapper">
                <svg viewBox="0 0 24 24" fill="none" className="section-icon">
                  <path
                    d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h2>Employees ({employees.length})</h2>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="add-button"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5V19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {showAddForm ? "Cancel" : "Add Employee"}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddEmployee} className="employee-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="input-icon"
                      >
                        <path
                          d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Full Name
                    </label>
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
                    <label>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="input-icon"
                      >
                        <path
                          d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22 6L12 13L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Email
                    </label>
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
                    <label>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="input-icon"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M3 9H21"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M9 21V9"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Department
                    </label>
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
                    <label>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="input-icon"
                      >
                        <path
                          d="M22 16.92V19.92C22 20.4833 21.7761 21.0235 21.3728 21.4228C20.9694 21.8261 20.4293 22.05 19.866 22.05C16.6193 21.7659 13.4987 20.6409 10.78 18.78C8.26254 17.0821 6.16097 14.8905 4.63 12.36C2.73999 9.61119 1.59997 6.45503 1.33 3.184C1.31 2.62182 1.52892 2.07945 1.93216 1.67477C2.33539 1.27009 2.87776 1.05001 3.44 1.05001H6.44C7.46006 1.03898 8.31995 1.77009 8.45 2.78C8.60122 3.78808 8.85893 4.77801 9.22 5.73C9.48 6.42 9.3 7.2 8.74 7.76L7.51 8.99C9.08004 11.6275 11.3725 13.92 14.01 15.49L15.24 14.26C15.8 13.7 16.58 13.52 17.27 13.78C18.222 14.1411 19.2119 14.3988 20.22 14.55C21.24 14.68 21.98 15.56 21.98 16.59L22 16.92Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <svg viewBox="0 0 24 24" fill="none" className="input-icon">
                      <rect
                        x="2"
                        y="7"
                        width="20"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
                <button type="submit" className="submit-button">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 21V13H7V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 3V8H15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add Employee
                </button>
              </form>
            )}

            <div className="employee-list">
              {employees.length === 0 ? (
                <div className="no-employees">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3>No employees yet</h3>
                  <p>Add your first employee to get started</p>
                </div>
              ) : (
                employees.map((employee, index) => (
                  <div
                    key={employee.employeeId}
                    className="employee-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="employee-avatar">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="employee-info">
                      <div className="flex">
                        <h3>{employee.name}</h3>

                        <span
                          className={`status-badge ${employee.accountSetup ? "active" : "pending"}`}
                        >
                          {employee.accountSetup ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.58 20 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M22 4L12 14.01L9 11.01"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Account Active
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none">
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M12 6V12L16 14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                              Setup Pending
                            </>
                          )}
                        </span>
                      </div>
                      <p className="email">{employee.email}</p>
                      <p className="department">
                        {employee.department}
                        {employee.role && ` • ${employee.role}`}
                      </p>
                      {employee.phone && (
                        <p className="phone">
                          <svg viewBox="0 0 24 24" fill="none">
                            <path
                              d="M22 16.92V19.92C22 20.4833 21.7761 21.0235 21.3728 21.4228C20.9694 21.8261 20.4293 22.05 19.866 22.05C16.6193 21.7659 13.4987 20.6409 10.78 18.78C8.26254 17.0821 6.16097 14.8905 4.63 12.36C2.73999 9.61119 1.59997 6.45503 1.33 3.184C1.31 2.62182 1.52892 2.07945 1.93216 1.67477C2.33539 1.27009 2.87776 1.05001 3.44 1.05001H6.44C7.46006 1.03898 8.31995 1.77009 8.45 2.78C8.60122 3.78808 8.85893 4.77801 9.22 5.73C9.48 6.42 9.3 7.2 8.74 7.76L7.51 8.99C9.08004 11.6275 11.3725 13.92 14.01 15.49L15.24 14.26C15.8 13.7 16.58 13.52 17.27 13.78C18.222 14.1411 19.2119 14.3988 20.22 14.55C21.24 14.68 21.98 15.56 21.98 16.59L22 16.92Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {employee.phone}
                        </p>
                      )}
                    </div>

                    <div className="employee-actions">
                      <button
                        onClick={() => handleChatWithEmployee(employee)}
                        className="chat-button"
                        disabled={!employee.accountSetup}
                        title={
                          !employee.accountSetup
                            ? "Employee must complete account setup first"
                            : "Chat with employee"
                        }
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Chat
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteEmployee(employee.employeeId)
                        }
                        className="delete-button"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 6H5H21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
