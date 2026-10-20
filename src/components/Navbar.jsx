import { useLocation } from 'react-router-dom';
import { MenuIcon, ShieldIcon } from './Icons.jsx';

const routeTitles = {
  '/dashboard': {
    title: 'Dashboard',
  },
  '/division-management': {
    title: 'Division Management',
  },
  '/employee-management': {
    title: 'Employee Management',
  },
  '/funding-agency-management': {
    title: 'Funding Agency Management',
  },
  '/project-registration': {
    title: 'Research Project Registration',
  },
  '/excel-upload': {
    title: 'Excel Upload',
  },
  '/milestone-tracking': {
    title: 'Milestone Monitoring',
  },
  '/project-leader-form': {
    title: 'Project Closure & Review',
  },
};

function Navbar({ currentEmployee, onMenuClick }) {
  const location = useLocation();
  const current = routeTitles[location.pathname] || routeTitles['/dashboard'];

  return (
    <header className="topbar">
      <button className="icon-button mobile-menu-button" type="button" onClick={onMenuClick} aria-label="Open menu">
        <MenuIcon size={21} />
      </button>

      <div>
        <h1>{current.title}</h1>
      </div>

      <div className="topbar-tools">
        <div className="security-chip">
          <ShieldIcon size={18} />
          {currentEmployee.role}
        </div>

        <div className="employee-badge">
          <strong>{currentEmployee.name}</strong>
          <span>{`${currentEmployee.employeeId} | ${currentEmployee.division}`}</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
