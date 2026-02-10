import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeAPI } from "../../services/api";
import "../../css/OwnerLogin.scss";

function EmployeeLogin() {
  const [loginMethod, setLoginMethod] = useState("credentials"); // credentials or email
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // ✅ Login bằng Username + Password
  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await employeeAPI.login(username, password);

      if (response.status) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userType", "employee");
        localStorage.setItem("employeeId", response.data.employeeId);
        localStorage.setItem("employeeData", JSON.stringify(response.data));

        navigate("/employee/dashboard");
      } else {
        setError(response.error || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Login bằng Email + Access Code - Bước 1: Gửi code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await employeeAPI.loginEmail(email);
      if (response.success) {
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

  // ✅ Login bằng Email + Access Code - Bước 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loginEmail = sessionStorage.getItem("loginEmail");

      if (!loginEmail) {
        setError("Session expired. Please start over.");
        setStep(1);
        setLoading(false);
        return;
      }

      const response = await employeeAPI.validateAccessCode(
        loginEmail,
        accessCode
      );

      if (response.success) {
        localStorage.setItem("userType", "employee");
        localStorage.setItem("email", loginEmail);
        localStorage.setItem("employeeId", response.employee.employeeId);
        localStorage.setItem("employeeData", JSON.stringify(response.employee));
        localStorage.setItem("authToken", response.employee.token); // ✅ Lưu token nếu có

        sessionStorage.removeItem("loginEmail");
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

  const handleSwitchMethod = () => {
    setLoginMethod(loginMethod === "credentials" ? "email" : "credentials");
    setError("");
    setMessage("");
    setStep(1);
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
          <h1>Employee Login</h1>
          <p className="subtitle">Employee Task Management System</p>
        </div>

        {/* ✅ TAB để chọn phương pháp login */}
        <div className="login-tabs">
          <button
            className={`tab ${loginMethod === "credentials" ? "active" : ""}`}
            onClick={() => handleSwitchMethod()}
            disabled={loginMethod === "credentials"}
          >
            Username & Password
          </button>
          <button
            className={`tab ${loginMethod === "email" ? "active" : ""}`}
            onClick={() => handleSwitchMethod()}
            disabled={loginMethod === "email"}
          >
            Email & Code
          </button>
        </div>

        {/* ✅ PHƯƠNG PHÁP 1: Username + Password */}
        {loginMethod === "credentials" && (
          <form onSubmit={handleCredentialsLogin} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
                minLength="4"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                minLength="6"
              />
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

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* ✅ PHƯƠNG PHÁP 2: Email + Access Code */}
        {loginMethod === "email" && (
          <>
            {step === 1 ? (
              <form onSubmit={handleSendCode} className="login-form">
                <div className="progress-steps">
                  <div className="step active">
                    <div className="step-number">1</div>
                    <span>Email</span>
                  </div>
                  <div className="step-line"></div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <span>Verify</span>
                  </div>
                </div>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Sending..." : "Send Access Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="login-form">
                <div className="progress-steps">
                  <div className="step active">
                    <div className="step-number">1</div>
                    <span>Email</span>
                  </div>
                  <div className="step-line"></div>
                  <div className="step active">
                    <div className="step-number">2</div>
                    <span>Verify</span>
                  </div>
                </div>

                <div className="form-group">
                  <p className="email-display">
                    Verifying:{" "}
                    <strong>{sessionStorage.getItem("loginEmail")}</strong>
                  </p>
                </div>

                <div className="form-group">
                  <label>Access Code</label>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) =>
                      setAccessCode(e.target.value.toUpperCase())
                    }
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

                <div
                  className="button-container"
                  style={{ gap: "10px", display: "flex" }}
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="btn-secondary"
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </>
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