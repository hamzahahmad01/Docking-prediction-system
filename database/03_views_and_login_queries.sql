USE docking_prediction_db;

CREATE OR REPLACE VIEW vw_user_login_profile AS
SELECT
  u.user_id,
  u.password_hash,
  u.is_active,
  r.role_id,
  r.role_name,
  r.landing_page,
  e.emp_id,
  e.emp_name,
  e.member_type,
  e.position,
  d.division_id,
  d.div_name
FROM users u
INNER JOIN roles r ON r.role_id = u.role_id
LEFT JOIN employees e ON e.emp_id = u.employee_id
LEFT JOIN divisions d ON d.division_id = e.division_id;

CREATE OR REPLACE VIEW vw_project_overview AS
SELECT
  p.project_number,
  p.title,
  e.emp_id,
  e.emp_name,
  d.div_name,
  fa.agency_name,
  p.start_date,
  p.completion_date,
  p.project_cost,
  p.status,
  m.serial_no AS milestone_serial_no,
  m.description AS milestone_description,
  m.milestone_completion_date_agreement,
  m.pi
FROM projects p
INNER JOIN employees e ON e.emp_id = p.employee_id
INNER JOIN divisions d ON d.division_id = p.division_id
INNER JOIN funding_agencies fa ON fa.serial_no = p.funding_agency_serial_no
LEFT JOIN milestones m ON m.serial_no = (
  SELECT MAX(m2.serial_no)
  FROM milestones m2
  WHERE m2.project_number = p.project_number
);

-- Login validation query:
-- Replace 'admin' and 'admin123' with runtime values from your login form.
SELECT
  user_id,
  role_name,
  landing_page,
  emp_id,
  emp_name,
  div_name,
  position
FROM vw_user_login_profile
WHERE user_id = 'admin'
  AND password_hash = SHA2('admin123', 256)
  AND is_active = 1;

-- Role-specific page mapping:
SELECT role_name, landing_page
FROM roles
ORDER BY role_id;

-- Viewer dashboard data:
SELECT *
FROM vw_project_overview
ORDER BY project_number;

-- Project leader only assigned projects:
SELECT p.*
FROM vw_project_overview p
WHERE p.emp_id = 'EMP003'
ORDER BY p.project_number;
