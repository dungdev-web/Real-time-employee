import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import '../css/OwnerLogin.scss';

function EmployeeSetup() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const employeeId = searchParams.get('id');

  useEffect(() => {
    if (!token || !employeeId) {
      setError('Invalid setup link. Please contact your manager.');
    }
  }, [token, employeeId]);

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await employeeAPI.setupAccount(token, employeeId, password);
      if (response.success) {
        setMessage('Account set up successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/employee/login');
        }, 2000);
      } else {
        setError(response.error || 'Failed to set up account');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set up account');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !employeeId) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Invalid Link</h1>
          <div className="error-message">
            This setup link is invalid or has expired. Please contact your manager for a new link.
          </div>
          <button onClick={() => navigate('/employee/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Set Up Your Account</h1>
        <p className="subtitle">Welcome to Employee Task Management</p>

        <form onSubmit={handleSetup}>
          <div className="form-group">
            <label>Create Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
              minLength="6"
            />
            <small>Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              disabled={loading}
              minLength="6"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Already set up? <a href="/employee/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmployeeSetup;