USE docking_prediction_db;

DROP VIEW IF EXISTS vw_project_overview;

DROP TABLE IF EXISTS project_status_updates;

CREATE VIEW vw_project_overview AS
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