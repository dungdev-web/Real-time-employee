import AppLayout from "./AppLayout";
import SidebarEmployee from "../components/SidebarEmployee";

function EmployeeLayout() {
  return <AppLayout SidebarComponent={SidebarEmployee} />;
}

export default EmployeeLayout;
