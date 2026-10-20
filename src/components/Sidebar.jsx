import { NavLink } from 'react-router-dom';
import Button from './Button.jsx';
import { canAccess } from '../utils/access.js';
import { CheckFileIcon, DashboardIcon, DatabaseIcon, LogoutIcon, PredictionIcon, ReportIcon, TeamIcon, UploadIcon } from './Icons.jsx';
import csirLogo from '../assets/csir-logo.png';

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, permission: 'overview' },
  { label: 'Division Management', path: '/division-management', icon: DatabaseIcon, permission: 'divisions' },
  { label: 'Employee Management', path: '/employee-management', icon: TeamIcon, permission: 'employees' },
  { label: 'Funding Agency Management', path: '/funding-agency-management', icon: ReportIcon, permission: 'fundingAgencies' },
  { label: 'Research Project Registration', path: '/project-registration', icon: DatabaseIcon, permission: 'registration' },
  { label: 'Excel Upload', path: '/excel-upload', icon: UploadIcon, permission: 'upload' },
  { label: 'Milestone Monitoring', path: '/milestone-tracking', icon: PredictionIcon, permission: 'milestones' },
  { label: 'Project Closure & Review', path: '/project-leader-form', icon: CheckFileIcon, permission: 'leaderForm' },
];

function Sidebar({ isOpen, onClose, onLogout, currentEmployee }) {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <img src={csirLogo} alt="CSIR-IIP logo" className="sidebar-logo" />
          <div>
            <strong>CSIR-IIP</strong>
            <small>Docking and Prediction System</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation
            .filter((item) => canAccess(currentEmployee.role, item.permission))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} onClick={onClose}>
                  <Icon size={19} />
                  {item.label}
                </NavLink>
              );
            })}
        </nav>

        <div className="sidebar-footer">
          <div className="role-note">
            <strong>{currentEmployee.name}</strong>
            <span>{`${currentEmployee.designation} | ${currentEmployee.employeeId}`}</span>
          </div>
          <Button variant="ghost" className="logout-button" onClick={onLogout}>
            <LogoutIcon size={18} />
            Logout
          </Button>
        </div>
      </aside>
      <button
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop-visible' : ''}`}
        type="button"
        aria-label="Close menu"
        onClick={onClose}
      />
    </>
  );
}

export default Sidebar;
