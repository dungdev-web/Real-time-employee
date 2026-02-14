import { Outlet } from "react-router-dom";

function AppLayout({ SidebarComponent }) {
  return (
    <div className="owner-layout">
      <SidebarComponent />
      <div className="owner-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;
