"use client";
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";

function SidebarEmployee() {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/employee/dashboard" },
    { id: "task", label: "My Task", path: "/employee/task" },
    { id: "message", label: "Message", path: "/employee/message" },
  ];

  const [openSidebar, setOpenSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {isMobile && (
        <button
          className="hamburger-btn"
          onClick={() => setOpenSidebar(true)}
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar
        isOpen={openSidebar}
        setIsOpen={setOpenSidebar}
        isMobile={isMobile}
        menuItems={menuItems}
        messagePath="/employee/message"
        users={[]}              
        userType="employee"  
      />

      {/* Overlay */}
      {isMobile && openSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpenSidebar(false)}
        />
      )}
    </>
  );
}

export default SidebarEmployee;
