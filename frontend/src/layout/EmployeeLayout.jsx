import SidebarEmployee from "../components/SidebarEmployee";
import { Outlet } from "react-router-dom";
function EmployeeLayout() {
  return (
    <div className="owner-layout">
      <SidebarEmployee />
      <div className="owner-content">
        <Outlet />
      </div>{" "}
    </div>
  );
}
export default EmployeeLayout;
