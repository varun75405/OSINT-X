import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <Navbar />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}

export default AppLayout;
