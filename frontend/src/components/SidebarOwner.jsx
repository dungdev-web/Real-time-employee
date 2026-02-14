"use client";
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { ownerAPI } from "../services/api";

function SidebarOwner() {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/owner/dashboard" },
    { id: "employee", label: "Manage Employee", path: "/owner/employee" },
    { id: "task", label: "Manage Task", path: "/owner/task" },
    { id: "message", label: "Message", path: "/owner/message" },
  ];
  const [openSidebar, setOpenSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [employees, setEmployees] = useState([]); // ✅ Danh sách employees

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await ownerAPI.getAllEmployees();
        if (response.success) {
          setEmployees(response.employees || []);
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
      }
    };
    loadEmployees();
  }, []);
  return (
    <>
      {isMobile && (
        <button className="hamburger-btn" onClick={() => setOpenSidebar(true)}>
          <Menu size={24} />
        </button>
      )}
      <Sidebar
        isOpen={openSidebar}
        setIsOpen={setOpenSidebar}
        isMobile={isMobile}
        menuItems={menuItems}
        messagePath="/owner/message"
        users={employees}        // ✅ Truyền employees
        userType="owner"  
      />
       {isMobile && openSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpenSidebar(false)}
        />
      )}
    </>
  );
}

export default SidebarOwner;
