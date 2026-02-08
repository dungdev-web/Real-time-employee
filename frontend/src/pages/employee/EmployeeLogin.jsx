import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeAPI } from "../../services/api";
import "../../css/OwnerLogin.scss";

function EmployeeLogin() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // ✅ Send email to get access code
      const response = await employeeAPI.loginEmail(email);
      if (response.success) {
        // ✅ Save email in sessionStorage (temporary)
        sessionStorage.setItem("loginEmail", email);
        
        setMessage("Access code sent to your email!");
        setStep(2);
      } else {
        setError(response.error || "Failed to send access code");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send access code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Get email from sessionStorage
      const loginEmail = sessionStorage.getItem("loginEmail");
      
      if (!loginEmail) {
        setError("Session expired. Please start over.");
        setStep(1);
        setLoading(false);
        return;
      }

      // ✅ Send EMAIL + code (not employeeId!)
      const response = await employeeAPI.validateAccessCode(loginEmail, accessCode);
      
      if (response.success) {
        // ✅ Save employee data including ownerId
        localStorage.setItem("userType", "employee");
        localStorage.setItem("email", loginEmail);
          localStorage.setItem("ownerId", response.employee.ownerId);
        localStorage.setItem("employeeId", response.employee.employeeId);
        localStorage.setItem("employeeData", JSON.stringify(response.employee));

        // ✅ Clear temporary session
        sessionStorage.removeItem("loginEmail");
        
        // Redirect
        navigate("/employee/dashboard");
      } else {
        setError(response.error || "Invalid access code");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid access code");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setError("");
    setMessage("");
  };

  return (
    <div className="login-container">
      {/* Animated background elements */}
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-box">
        {/* Header with icon */}
        <div className="login-header">
          <div className="icon-wrapper">
            <svg
              className="login-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
          </div>
          <h1>Employee Login</h1>
          <p className="subtitle">Employee Task Management System</p>
        </div>

        {/* Progress indicator */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? "active" : ""}`}>
            <div className="step-number">1</div>
            <span>Email</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>
            <div className="step-number">2</div>
            <span>Verify</span>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="login-form">
            <div className="form-group">
              <label>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
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
                Email Address
              </label>
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

            {error && (
              <div className="error-message">
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
              </div>
            )}

            {message && (
              <div className="success-message">
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
              </div>
            )}
            <div className="button-container">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 2L11 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M22 2L15 22L11 13L2 9L22 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Send Access Code
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="login-form">
            {/* ✅ Show which email we're verifying */}
            <div className="form-group">
              <p className="email-display">
                Verifying: <strong>{sessionStorage.getItem("loginEmail")}</strong>
              </p>
            </div>

            <div className="form-group">
              <label>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Access Code
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
                disabled={loading}
                className="code-input"
              />
              <small>Check your email for the access code</small>
            </div>

            {error && (
              <div className="error-message">
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
              </div>
            )}
            <div className="button-container" style={{ gap: "10px" }}>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
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
                    Verify Code
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                className="btn-secondary"
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 19L5 12L12 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>
            </div>
          </form>
        )}

        <div className="login-footer">
          <div className="divider">
            <span>or</span>
          </div>
          <p>
            Manager? <a href="/owner/login">Login here →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmployeeLogin;