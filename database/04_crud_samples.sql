USE docking_prediction_db;

/* =======================
   1. ROLES TABLE CRUD
   ======================= */

INSERT INTO roles (role_name, landing_page, role_description)
VALUES ('XXXX Role', '/xxxx-dashboard', 'XXXX');

SELECT * FROM roles ORDER BY role_id;

UPDATE roles
SET landing_page = '/xxxx-home'
WHERE role_name = 'Viewer';

DELETE FROM roles
WHERE role_name = 'XXXX Role';

/* =======================
   2. DIVISIONS TABLE CRUD
   ======================= */

INSERT INTO divisions (div_name, employee_name)
VALUES ('XXXX100', 'XXXX');

SELECT * FROM divisions ORDER BY division_id;

UPDATE divisions
SET employee_name = 'XXXX'
WHERE division_id = 1;

DELETE FROM divisions
WHERE div_name = 'XXXX100';

/* =======================
   3. EMPLOYEES TABLE CRUD
   ======================= */

INSERT INTO employees (emp_id, emp_name, division_id, member_type, position)
VALUES ('EMP100', 'XXXX', 1, 'Team Member', 'XXXX');

SELECT e.emp_id, e.emp_name, d.div_name, e.member_type, e.position
FROM employees e
INNER JOIN divisions d ON d.division_id = e.division_id
ORDER BY e.emp_id;

UPDATE employees
SET position = 'XXXX'
WHERE emp_id = 'EMP100';

DELETE FROM employees
WHERE emp_id = 'EMP100';

/* ==============================
   4. FUNDING AGENCIES TABLE CRUD
   ============================== */

INSERT INTO funding_agencies (agency_name, email, address, agency_type)
VALUES ('XXXX', 'xxxx@xxxx.com', 'XXXX', 'Govt');

SELECT * FROM funding_agencies ORDER BY serial_no;

UPDATE funding_agencies
SET agency_type = 'PSU'
WHERE serial_no = 1;

DELETE FROM funding_agencies
WHERE agency_name = 'XXXX';

/* =======================
   5. PROJECTS TABLE CRUD
   ======================= */

INSERT INTO projects (
  project_number,
  title,
  employee_id,
  division_id,
  funding_agency_serial_no,
  start_date,
  completion_date,
  project_cost,
  status
) VALUES (
  'PRJ-100',
  'XXXX',
  'EMP003',
  1,
  1,
  '2026-06-01',
  '2027-01-15',
  99999999.00,
  'Ongoing'
);

SELECT * FROM vw_project_overview ORDER BY project_number;

UPDATE projects
SET status = 'Milestone Pending', project_cost = 99999999.00
WHERE project_number = 'PRJ-100';

DELETE FROM projects
WHERE project_number = 'PRJ-100';

/* =========================
   6. MILESTONES TABLE CRUD
   ========================= */

INSERT INTO milestones (description, project_number, milestone_completion_date_agreement, pi)
VALUES ('XXXX', 'PRJ-001', '2026-09-01', 'XXXX');

SELECT * FROM milestones ORDER BY serial_no;

UPDATE milestones
SET pi = 'XXXX'
WHERE serial_no = 1;

DELETE FROM milestones
WHERE serial_no = 4;

/* =======================
   7. USERS TABLE CRUD
   ======================= */

INSERT INTO users (user_id, password_hash, role_id, employee_id, is_active)
VALUES ('userx', SHA2('XXXX', 256), 2, 'EMP002', 1);

SELECT u.user_id, r.role_name, u.employee_id, u.is_active
FROM users u
INNER JOIN roles r ON r.role_id = u.role_id
ORDER BY u.user_id;

UPDATE users
SET is_active = 0
WHERE user_id = 'userx';

DELETE FROM users
WHERE user_id = 'userx';
