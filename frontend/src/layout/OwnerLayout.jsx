import SidebarOwner from "../components/SidebarOwner";
import { Outlet } from "react-router-dom";
function OwnerLayout() {
  return (
    <div className="owner-layout">
      <SidebarOwner />
      
      <div className="owner-content">
        <Outlet />
      </div>
    </div>
  );
}
export default OwnerLayout