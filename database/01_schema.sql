CREATE DATABASE IF NOT EXISTS docking_prediction_db;
USE docking_prediction_db;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS project_import_history;
DROP TABLE IF EXISTS milestones;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS funding_agencies;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS divisions;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  landing_page VARCHAR(100) NOT NULL,
  role_description VARCHAR(255) NULL
);

CREATE TABLE divisions (
  division_id INT AUTO_INCREMENT PRIMARY KEY,
  div_name VARCHAR(120) NOT NULL,
  employee_name VARCHAR(120) NOT NULL
);

CREATE TABLE employees (
  emp_id VARCHAR(30) PRIMARY KEY,
  emp_name VARCHAR(120) NOT NULL,
  division_id INT NOT NULL,
  member_type ENUM('HOD', 'Team Member') NOT NULL,
  position VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_employees_division
    FOREIGN KEY (division_id) REFERENCES divisions (division_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE funding_agencies (
  serial_no INT AUTO_INCREMENT PRIMARY KEY,
  agency_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  address TEXT NOT NULL,
  agency_type ENUM('Govt', 'PSU', 'Pvt', 'Foreign') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  project_number VARCHAR(40) PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  employee_id VARCHAR(30) NOT NULL,
  division_id INT NOT NULL,
  funding_agency_serial_no INT NOT NULL,
  start_date DATE NOT NULL,
  completion_date DATE NOT NULL,
  project_cost DECIMAL(14, 2) NOT NULL DEFAULT 0,
  status ENUM('Ongoing', 'Milestone Pending', 'Completed') NOT NULL DEFAULT 'Ongoing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_employee
    FOREIGN KEY (employee_id) REFERENCES employees (emp_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_projects_division
    FOREIGN KEY (division_id) REFERENCES divisions (division_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_projects_funding_agency
    FOREIGN KEY (funding_agency_serial_no) REFERENCES funding_agencies (serial_no)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE milestones (
  serial_no INT AUTO_INCREMENT PRIMARY KEY,
  description TEXT NOT NULL,
  project_number VARCHAR(40) NOT NULL,
  milestone_completion_date_agreement DATE NOT NULL,
  pi VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_milestones_project
    FOREIGN KEY (project_number) REFERENCES projects (project_number)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE users (
  user_id VARCHAR(50) PRIMARY KEY,
  password_hash CHAR(64) NOT NULL,
  role_id INT NOT NULL,
  employee_id VARCHAR(30) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles (role_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_users_employee
    FOREIGN KEY (employee_id) REFERENCES employees (emp_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE project_import_history (
  import_id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  worksheet_name VARCHAR(120) NULL,
  uploaded_by_employee_id VARCHAR(30) NULL,
  uploaded_by_role VARCHAR(50) NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  ready_rows INT NOT NULL DEFAULT 0,
  blocked_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  import_status ENUM('Template Rejected', 'Validation Issues', 'Validated', 'Imported', 'Import Failed') NOT NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_import_history_employee
    FOREIGN KEY (uploaded_by_employee_id) REFERENCES employees (emp_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX idx_employees_division_id ON employees (division_id);
CREATE INDEX idx_projects_employee_id ON projects (employee_id);
CREATE INDEX idx_projects_division_id ON projects (division_id);
CREATE INDEX idx_projects_funding_agency_serial_no ON projects (funding_agency_serial_no);
CREATE INDEX idx_milestones_project_number ON milestones (project_number);
CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_employee_id ON users (employee_id);
CREATE INDEX idx_project_import_history_employee_id ON project_import_history (uploaded_by_employee_id);
CREATE INDEX idx_project_import_history_created_at ON project_import_history (created_at);
