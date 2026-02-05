import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import '../css/OwnerLogin.css';

function EmployeeLogin() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await employeeAPI.loginEmail(email);
      if (response.success) {
        setMessage('Access code sent to your email!');
        setStep(2);
      } else {
        setError(response.error || 'Failed to send access code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send access code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await employeeAPI.validateAccessCode(email, accessCode);
      if (response.success) {
        // Save to local storage
        localStorage.setItem('userType', 'employee');
        localStorage.setItem('email', email);
        localStorage.setItem('employeeId', response.employeeId);
        localStorage.setItem('employeeData', JSON.stringify(response.employee));
        
        // Navigate to dashboard
        navigate('/employee/dashboard');
      } else {
        setError(response.error || 'Invalid access code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Employee Login</h1>
        <p className="subtitle">Employee Task Management System</p>

        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                required
                disabled={loading}
              />
              <small>Enter your work email address</small>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Access Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label>Access Code</label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
                disabled={loading}
              />
              <small>Check your email for the access code</small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="secondary-button"
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>
            Manager? <a href="/owner/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmployeeLogin;