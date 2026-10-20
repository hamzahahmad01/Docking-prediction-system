const db = require("../config/db");

function ensureImportHistoryTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS project_import_history (
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
        )
    `;

    db.query(sql, (err) => {
        if (err) {
            console.log("Failed to ensure project_import_history table.");
            console.log(err);
        }
    });
}

module.exports = {
    ensureImportHistoryTable,
};
