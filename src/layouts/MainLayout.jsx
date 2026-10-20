import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';

function MainLayout({ currentEmployee, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
        currentEmployee={currentEmployee}
      />
      <main className="main-panel">
        <Navbar currentEmployee={currentEmployee} onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
