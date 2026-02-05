import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OwnerLogin from './pages/OwnerLogin';
import OwnerDashboard from './pages/OwnerDashboard';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeSetup from './pages/EmployeeSetup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import './App.css';
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/owner/login" replace />} />
          
          {/* Owner routes */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          
          {/* Employee routes */}
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee/setup" element={<EmployeeSetup />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

function NotFound() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>404 - Page Not Found</h1>
        <p className="subtitle">The page you're looking for doesn't exist.</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <a href="/owner/login" style={{ flex: 1 }}>
            <button style={{ width: '100%' }}>Owner Login</button>
          </a>
          <a href="/employee/login" style={{ flex: 1 }}>
            <button style={{ width: '100%' }}>Employee Login</button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;