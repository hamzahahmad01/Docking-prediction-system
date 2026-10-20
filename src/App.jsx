import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DivisionManagement from './pages/DivisionManagement.jsx';
import DataManagement from './pages/DataManagement.jsx';
import EmployeeManagement from './pages/EmployeeManagement.jsx';
import FundingAgencyManagement from './pages/FundingAgencyManagement.jsx';
import Login from './pages/Login.jsx';
import Prediction from './pages/Prediction.jsx';
import Reports from './pages/Reports.jsx';
import ExcelUpload from './pages/ExcelUpload.jsx';
import AccessDenied from './pages/AccessDenied.jsx';
import { apiRequest } from './utils/api.js';
import { getStoredAuthSession, logoutEmployee, saveAuthSession } from './utils/auth.js';
import { canAccess } from './utils/access.js';

const landingPageMap = {
  '/admin-dashboard': '/dashboard',
  '/project-leader-dashboard': '/project-leader-form',
  '/viewer-home': '/dashboard',
};

function resolveLandingPath(employee) {
  if (!employee) {
    return '/login';
  }

  if (employee.landingPage && landingPageMap[employee.landingPage]) {
    return landingPageMap[employee.landingPage];
  }

  if (employee.role === 'Project Lead') {
    return '/project-leader-form';
  }

  return '/dashboard';
}

function App() {
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSession = getStoredAuthSession();

    if (storedSession?.employee) {
      setCurrentEmployee(storedSession.employee);
    }
  }, []);

  useEffect(() => {
    if (!currentEmployee) {
      setProjects([]);
      return;
    }

    loadProjects();
  }, [currentEmployee]);

  async function loadProjects() {
    try {
      const data = await apiRequest('/project');
      setProjects(data);
    } catch (error) {
      console.error(error);
    }
  }

  const handleLogin = (employee, token) => {
    saveAuthSession(employee, token);
    setCurrentEmployee(employee);
    navigate(resolveLandingPath(employee));
  };

  const handleLogout = async () => {
    await logoutEmployee();
    setCurrentEmployee(null);
    navigate('/login');
  };

  const withAccess = (feature, element) =>
    canAccess(currentEmployee?.role, feature) ? element : <AccessDenied role={currentEmployee?.role || 'Viewer'} />;

  return (
    <Routes>
      <Route
        path="/"
        element={currentEmployee ? <Navigate to={resolveLandingPath(currentEmployee)} replace /> : <Login onLogin={handleLogin} />}
      />
      <Route
        path="/login"
        element={currentEmployee ? <Navigate to={resolveLandingPath(currentEmployee)} replace /> : <Login onLogin={handleLogin} />}
      />

      <Route
        element={
          currentEmployee ? (
            <MainLayout currentEmployee={currentEmployee} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard projects={projects} currentEmployee={currentEmployee} />}
        />
        <Route
          path="/admin-dashboard"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/project-leader-dashboard"
          element={<Navigate to="/project-leader-form" replace />}
        />
        <Route
          path="/viewer-home"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/division-management"
          element={withAccess('divisions', <DivisionManagement />)}
        />
        <Route
          path="/employee-management"
          element={withAccess('employees', <EmployeeManagement currentEmployee={currentEmployee} />)}
        />
        <Route
          path="/funding-agency-management"
          element={withAccess('fundingAgencies', <FundingAgencyManagement />)}
        />
        <Route
          path="/project-registration"
          element={withAccess(
            'registration',
            <DataManagement
              projects={projects}
              setProjects={setProjects}
              currentEmployee={currentEmployee}
            />,
          )}
        />
        <Route
          path="/excel-upload"
          element={withAccess(
            'upload',
            <ExcelUpload
              currentEmployee={currentEmployee}
              setProjects={setProjects}
            />,
          )}
        />
        <Route
          path="/milestone-tracking"
          element={withAccess(
            'milestones',
            <Prediction projects={projects} setProjects={setProjects} currentEmployee={currentEmployee} />,
          )}
        />
        <Route
          path="/project-leader-form"
          element={withAccess(
            'leaderForm',
            <Reports projects={projects} setProjects={setProjects} currentEmployee={currentEmployee} />,
          )}
        />
      </Route>

      <Route path="*" element={<Navigate to={currentEmployee ? resolveLandingPath(currentEmployee) : '/login'} replace />} />
    </Routes>
  );
}

export default App;
