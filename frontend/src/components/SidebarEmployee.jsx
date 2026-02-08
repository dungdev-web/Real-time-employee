import Sidebar from "./Sidebar";

function SidebarEmployee() {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/employee/dashboard" },
    { id: "task", label: "My Task", path: "/employee/task" },
    { id: "message", label: "Message", path: "/employee/message" },
  ];

  return (
    <Sidebar
      menuItems={menuItems}
      messagePath="/employee/message"
    />
  );
}

export default SidebarEmployee;
