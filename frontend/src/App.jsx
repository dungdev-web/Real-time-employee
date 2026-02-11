import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import OwnerLogin from "./pages/owner/OwnerLogin";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerMessage from "./pages/owner/OwnerMessage";
import OwnerManageEmployee from "./pages/owner/OwnerManageEmployee";
import OwnerManageTask from "./pages/owner/OwnerManageTask";
import EmployeeLogin from "./pages/employee/EmployeeLogin";
import EmployeeSetup from "./pages/employee/EmployeeSetup";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeMessage from "./pages/employee/EmployeeMessage";
import "./App.css";
import OwnerLayout from "./layout/OwnerLayout";
import { ChatProvider } from "./context/ChatContext";
import EmployeeLayout from "./layout/EmployeeLayout";
import EmployeeTask from "./pages/employee/EmployeeTask";
import { ToastContainer } from "react-toastify";
function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="white"
      />
      <ChatProvider ownerId={localStorage.getItem("ownerId")}>
        <Router>
          <Routes>
            {/* Default */}
            <Route path="/" element={<Navigate to="/owner/login" replace />} />

            {/* Login riêng */}
            <Route path="/owner/login" element={<OwnerLogin />} />
            <Route path="/employee/login" element={<EmployeeLogin />} />
            <Route path="/employee/setup" element={<EmployeeSetup />} />
            {/* OWNER dùng chung sidebar */}
            <Route path="/owner" element={<OwnerLayout />}>
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="message" element={<OwnerMessage />} />
              <Route path="employee" element={<OwnerManageEmployee />} />
              <Route path="task" element={<OwnerManageTask />} />
            </Route>

            {/* Employee */}
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="task" element={<EmployeeTask />} />
              <Route path="message" element={<EmployeeMessage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ChatProvider>
    </>
  );
}

function NotFound() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>404 - Page Not Found</h1>
        <p className="subtitle">The page you're looking for doesn't exist.</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <a href="/owner/login" style={{ flex: 1 }}>
            <button style={{ width: "100%" }}>Owner Login</button>
          </a>
          <a href="/employee/login" style={{ flex: 1 }}>
            <button style={{ width: "100%" }}>Employee Login</button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
