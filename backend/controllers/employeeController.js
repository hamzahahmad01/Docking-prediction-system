const db = require("../config/db");

const allowedMemberTypes = new Set(["HOD", "Team Member"]);

function sendDatabaseError(res, err) {
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Employee ID already exists." });
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ message: "Selected division does not exist." });
    }

    console.log(err);
    return res.status(500).json({ message: "Database operation failed.", error: err.code || err.message });
}

function validateEmployeePayload(body) {
    const employeeId = String(body.emp_id || "").trim();
    const employeeName = String(body.emp_name || "").trim();
    const position = String(body.position || "").trim();
    const memberType = String(body.member_type || "").trim();
    const divisionId = Number(body.division_id);

    if (!employeeId) {
        return { error: "Employee ID is required." };
    }

    if (!employeeName) {
        return { error: "Employee name is required." };
    }

    if (Number.isNaN(divisionId)) {
        return { error: "Division selection is required." };
    }

    if (!allowedMemberTypes.has(memberType)) {
        return { error: "Member type must be HOD or Team Member." };
    }

    if (!position) {
        return { error: "Position is required." };
    }

    return {
        error: null,
        payload: {
            emp_id: employeeId,
            emp_name: employeeName,
            division_id: divisionId,
            member_type: memberType,
            position,
        },
    };
}

function fetchEmployeeById(employeeId, callback) {
    const sql = `
        SELECT
            e.emp_id,
            e.emp_name,
            e.division_id,
            d.div_name,
            e.member_type,
            e.position,
            e.created_at
        FROM employees e
        LEFT JOIN divisions d ON d.division_id = e.division_id
        WHERE e.emp_id = ?
    `;

    db.query(sql, [employeeId], callback);
}

exports.getAllEmployees = (req, res) => {
    const sql = `
        SELECT
            e.emp_id,
            e.emp_name,
            e.division_id,
            d.div_name,
            e.member_type,
            e.position,
            e.created_at
        FROM employees e
        LEFT JOIN divisions d ON d.division_id = e.division_id
        ORDER BY e.emp_id ASC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        return res.json(result);
    });
};

exports.getEmployeeById = (req, res) => {
    const employeeId = String(req.params.id || "").trim();

    if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is invalid." });
    }

    fetchEmployeeById(employeeId, (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!result.length) {
            return res.status(404).json({ message: "Employee record not found." });
        }

        return res.json(result[0]);
    });
};

exports.createEmployee = (req, res) => {
    const { error, payload } = validateEmployeePayload(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const sql = `
        INSERT INTO employees (emp_id, emp_name, division_id, member_type, position)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [payload.emp_id, payload.emp_name, payload.division_id, payload.member_type, payload.position],
        (err) => {
            if (err) {
                return sendDatabaseError(res, err);
            }

            fetchEmployeeById(payload.emp_id, (fetchErr, rows) => {
                if (fetchErr) {
                    return sendDatabaseError(res, fetchErr);
                }

                return res.status(201).json({
                    message: "Employee created successfully.",
                    employee: rows[0],
                });
            });
        },
    );
};

exports.updateEmployee = (req, res) => {
    const employeeId = String(req.params.id || "").trim();

    if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is invalid." });
    }

    const { error, payload } = validateEmployeePayload({
        ...req.body,
        emp_id: employeeId,
    });

    if (error) {
        return res.status(400).json({ message: error });
    }

    const sql = `
        UPDATE employees
        SET emp_name = ?, division_id = ?, member_type = ?, position = ?
        WHERE emp_id = ?
    `;

    db.query(
        sql,
        [payload.emp_name, payload.division_id, payload.member_type, payload.position, employeeId],
        (err, result) => {
            if (err) {
                return sendDatabaseError(res, err);
            }

            if (!result.affectedRows) {
                return res.status(404).json({ message: "Employee record not found." });
            }

            fetchEmployeeById(employeeId, (fetchErr, rows) => {
                if (fetchErr) {
                    return sendDatabaseError(res, fetchErr);
                }

                return res.json({
                    message: "Employee updated successfully.",
                    employee: rows[0],
                });
            });
        },
    );
};

exports.deleteEmployee = (req, res) => {
    const employeeId = String(req.params.id || "").trim();

    if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is invalid." });
    }

    const sql = "DELETE FROM employees WHERE emp_id = ?";

    db.query(sql, [employeeId], (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Employee record not found." });
        }

        return res.json({ message: "Employee deleted successfully." });
    });
};
