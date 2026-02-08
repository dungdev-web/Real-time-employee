import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ownerAPI } from "../../services/api";
import "../../css/OwnerLogin.scss";

function OwnerLogin() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
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
      const response = await ownerAPI.createAccessCode(phoneNumber);
      if (response.success) {
        setMessage("Access code sent to your phone!");
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
      const response = await ownerAPI.validateAccessCode(
        phoneNumber,
        accessCode,
      );
      if (response.success) {
        // Save to local storage
        localStorage.setItem("userType", "owner");
        localStorage.setItem("phoneNumber", phoneNumber);
        localStorage.setItem("ownerId", response.ownerId);

        // Navigate to dashboard
        navigate("/owner/dashboard");
      } else {
        setError(response.error || "Invalid access code");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid access code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <div className="login-box">
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
          <h1>Owner Login</h1>
          <p className="subtitle">Employee Task Management System</p>
        </div>
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? "active" : ""}`}>
            <div className="step-number">1</div>
            <span>Phone</span>
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
                <svg
                  className="input-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                  <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                </svg>
                Phone Number
              </label>
              {/* <div className="input-wrapper"> */}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  required
                  disabled={loading}
                />
              {/* </div> */}
              <small>Enter your phone number with country code</small>
            </div>

            {error && (
              <div className="error-message">
                {" "}
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
                {" "}
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
                )}{" "}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="login-form">
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
              <div className="input-wrapper">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  required
                  disabled={loading}
                />
              </div>
              <small>Check your phone for the access code</small>
            </div>

            {error && (
              <div className="error-message">
                {" "}
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
                )}{" "}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
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
            Employee? <a href="/employee/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OwnerLogin;
