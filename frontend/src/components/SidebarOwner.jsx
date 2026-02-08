import Sidebar from "./Sidebar";
function SidebarOwner() {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/owner/dashboard" },
    { id: "employee", label: "Manage Employee", path: "/owner/employee" },
    { id: "task", label: "Manage Task", path: "/owner/task" },
    { id: "message", label: "Message", path: "/owner/message" },
  ];

  return (
    <Sidebar
      menuItems={menuItems}
      messagePath="/owner/message"
    />
  );
}

export default SidebarOwner;
