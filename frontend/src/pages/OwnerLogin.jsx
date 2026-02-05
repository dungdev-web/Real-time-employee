import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerAPI } from '../services/api';
import '../css/OwnerLogin.css';

function OwnerLogin() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
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
      const response = await ownerAPI.createAccessCode(phoneNumber);
      if (response.success) {
        setMessage('Access code sent to your phone!');
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
      const response = await ownerAPI.validateAccessCode(phoneNumber, accessCode);
      if (response.success) {
        // Save to local storage
        localStorage.setItem('userType', 'owner');
        localStorage.setItem('phoneNumber', phoneNumber);
        localStorage.setItem('ownerId', response.ownerId);
        
        // Navigate to dashboard
        navigate('/owner/dashboard');
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
        <h1>Owner Login</h1>
        <p className="subtitle">Employee Task Management System</p>

        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                required
                disabled={loading}
              />
              <small>Enter your phone number with country code</small>
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
              <small>Check your phone for the access code</small>
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
            Employee? <a href="/employee/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OwnerLogin;