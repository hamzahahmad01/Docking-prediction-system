USE docking_prediction_db;

INSERT INTO roles (role_id, role_name, landing_page, role_description) VALUES
  (1, 'Admin', '/admin-dashboard', 'Full access to all master data and project transactions'),
  (2, 'Viewer', '/viewer-dashboard', 'Read-only access to reports and project status'),
  (3, 'Project Leader', '/project-leader-dashboard', 'Can update project leader and milestone related records');

INSERT INTO divisions (division_id, div_name, employee_name) VALUES
  (1, 'XXXX1', 'XXXX'),
  (2, 'XXXX2', 'XXXX'),
  (3, 'XXXX3', 'XXXX'),
  (4, 'XXXX4', 'XXXX');

INSERT INTO employees (emp_id, emp_name, division_id, member_type, position) VALUES
  ('EMP001', 'XXXX', 1, 'HOD', 'XXXX'),
  ('EMP002', 'XXXX', 2, 'Team Member', 'XXXX'),
  ('EMP003', 'XXXX', 1, 'Team Member', 'XXXX'),
  ('EMP004', 'XXXX', 3, 'Team Member', 'XXXX'),
  ('EMP005', 'XXXX', 4, 'HOD', 'XXXX');

INSERT INTO funding_agencies (serial_no, agency_name, email, address, agency_type) VALUES
  (1, 'XXXX', 'xxxx@xxxx.com', 'XXXX', 'Govt'),
  (2, 'XXXX', 'xxxx@xxxx.com', 'XXXX', 'PSU'),
  (3, 'XXXX', 'xxxx@xxxx.com', 'XXXX', 'Pvt'),
  (4, 'XXXX', 'xxxx@xxxx.com', 'XXXX', 'Foreign');

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
) VALUES
  ('PRJ-001', 'XXXX', 'EMP003', 1, 1, '2026-04-12', '2026-11-30', 99999999.00, 'Ongoing'),
  ('PRJ-002', 'XXXX', 'EMP001', 1, 2, '2026-03-01', '2026-12-18', 99999999.00, 'Milestone Pending'),
  ('PRJ-003', 'XXXX', 'EMP004', 3, 4, '2026-01-20', '2026-09-28', 99999999.00, 'Completed');

INSERT INTO milestones (
  serial_no,
  description,
  project_number,
  milestone_completion_date_agreement,
  pi
) VALUES
  (1, 'XXXX', 'PRJ-001', '2026-07-15', 'XXXX'),
  (2, 'XXXX', 'PRJ-002', '2026-08-10', 'XXXX'),
  (3, 'XXXX', 'PRJ-003', '2026-05-30', 'XXXX');

INSERT INTO users (user_id, password_hash, role_id, employee_id, is_active) VALUES
  ('admin', SHA2('admin123', 256), 1, 'EMP001', 1),
  ('viewer', SHA2('viewer123', 256), 2, 'EMP002', 1),
  ('leader', SHA2('leader123', 256), 3, 'EMP003', 1);
