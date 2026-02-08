import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerDashboard from "./pages/OwnerDashboard";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeSetup from "./pages/EmployeeSetup";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import OwnerMessage from "./pages/OwnerMessage";
import EmployeeMessage from "./pages/EmployeeMessage";
import "./App.css";
import OwnerLayout from "./layout/OwnerLayout";
import { ChatProvider } from "./context/ChatContext";
import EmployeeLayout from "./layout/EmployeeLayout";

function App() {
  return (
    <ChatProvider ownerId={localStorage.getItem("ownerId")}>
      <Router>
        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/owner/login" replace />} />

          {/* Login riêng */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />

          {/* OWNER dùng chung sidebar */}
          <Route path="/owner" element={<OwnerLayout />}>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="message" element={<OwnerMessage />} />
            {/* sau này thêm */}
            {/* <Route path="employee" element={<EmployeePage />} /> */}
            {/* <Route path="task" element={<TaskPage />} /> */}
          </Route>

          {/* Employee */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route path="dashboard" element={<EmployeeDashboard />} />
            {/* <Route path="task" element={<EmployeeTask />} /> */}
            <Route path="message" element={<EmployeeMessage />} />  
            
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ChatProvider>
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
