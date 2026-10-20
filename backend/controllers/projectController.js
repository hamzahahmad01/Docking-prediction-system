const db = require("../config/db");
const { toDateInputValue } = require("../utils/dateFormat");

const allowedStatuses = new Set(["Ongoing", "Milestone Pending", "Completed"]);

function sendDatabaseError(res, err) {
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Project number already exists." });
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ message: "Employee, division, or funding agency reference is invalid." });
    }

    console.log(err);
    return res.status(500).json({ message: "Database operation failed.", error: err.code || err.message });
}

function mapProjectRow(row) {
    return {
        id: row.project_number,
        projectNumber: row.project_number,
        title: row.title,
        employeeId: row.employee_id,
        employeeName: row.emp_name,
        divisionId: row.division_id,
        division: row.div_name,
        sponsoredBy: row.agency_name,
        fundingAgencySerialNo: row.funding_agency_serial_no,
        startDate: toDateInputValue(row.start_date),
        completionDate: toDateInputValue(row.completion_date),
        projectCost: Number(row.project_cost),
        status: row.status,
        milestoneMaturityDate: "",
        milestoneStatus: "Pending",
        probableMilestoneDate: "",
        probableCompletionDate: toDateInputValue(row.current_probable_completion_date),
        previousProbableCompletionDate: toDateInputValue(row.previous_probable_completion_date),
        actualCompletionDate: toDateInputValue(row.actual_completion_date),
        remarks: row.closure_remarks || "",
    };
}

function fetchAllProjects(callback) {
    const sql = `
        SELECT
            p.project_number,
            p.title,
            p.employee_id,
            e.emp_name,
            p.division_id,
            d.div_name,
            p.funding_agency_serial_no,
            fa.agency_name,
            p.start_date,
            p.completion_date,
            p.project_cost,
            p.status,
            pcr.previous_probable_completion_date,
            pcr.current_probable_completion_date,
            pcr.actual_completion_date,
            pcr.remarks AS closure_remarks,
            p.created_at
        FROM projects p
        LEFT JOIN employees e ON e.emp_id = p.employee_id
        LEFT JOIN divisions d ON d.division_id = p.division_id
        LEFT JOIN funding_agencies fa ON fa.serial_no = p.funding_agency_serial_no
        LEFT JOIN project_closure_review pcr ON pcr.project_number = p.project_number
        ORDER BY p.project_number ASC
    `;

    db.query(sql, callback);
}

function fetchProjectByNumber(projectNumber, callback) {
    const sql = `
        SELECT
            p.project_number,
            p.title,
            p.employee_id,
            e.emp_name,
            p.division_id,
            d.div_name,
            p.funding_agency_serial_no,
            fa.agency_name,
            p.start_date,
            p.completion_date,
            p.project_cost,
            p.status,
            pcr.previous_probable_completion_date,
            pcr.current_probable_completion_date,
            pcr.actual_completion_date,
            pcr.remarks AS closure_remarks,
            p.created_at
        FROM projects p
        LEFT JOIN employees e ON e.emp_id = p.employee_id
        LEFT JOIN divisions d ON d.division_id = p.division_id
        LEFT JOIN funding_agencies fa ON fa.serial_no = p.funding_agency_serial_no
        LEFT JOIN project_closure_review pcr ON pcr.project_number = p.project_number
        WHERE p.project_number = ?
    `;

    db.query(sql, [projectNumber], callback);
}

function getNextProjectNumber(callback) {
    const sql = `
        SELECT project_number
        FROM projects
        WHERE project_number REGEXP '^PRJ-[0-9]{3,}$'
        ORDER BY CAST(SUBSTRING(project_number, 5) AS UNSIGNED) DESC
        LIMIT 1
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            return callback(err);
        }

        const lastProjectNumber = rows[0]?.project_number || "";
        const lastNumericPart = Number.parseInt(lastProjectNumber.replace(/^PRJ-/, ""), 10);
        const nextNumber = Number.isNaN(lastNumericPart) ? 1 : lastNumericPart + 1;
        const nextProjectNumber = `PRJ-${String(nextNumber).padStart(3, "0")}`;

        return callback(null, nextProjectNumber);
    });
}

function validateProjectPayload(body) {
    const projectNumber = String(body.project_number || body.projectNumber || "").trim();
    const title = String(body.title || "").trim();
    const employeeId = String(body.employee_id || body.employeeId || "").trim();
    const startDate = String(body.start_date || body.startDate || "").trim();
    const completionDate = String(body.completion_date || body.completionDate || "").trim();
    const status = String(body.status || "").trim();
    const sponsoredBy = String(body.sponsoredBy || "").trim();
    const projectCost = Number(body.project_cost ?? body.projectCost);

    if (!title) {
        return { error: "Project title is required." };
    }

    if (!employeeId) {
        return { error: "Employee ID is required." };
    }

    if (!sponsoredBy) {
        return { error: "Sponsored By is required." };
    }

    if (!startDate) {
        return { error: "Start date is required." };
    }

    if (!completionDate) {
        return { error: "Completion date is required." };
    }

    if (Number.isNaN(projectCost)) {
        return { error: "Project cost must be numeric." };
    }

    if (!allowedStatuses.has(status)) {
        return { error: "Project status is invalid." };
    }

    return {
        error: null,
        payload: {
            project_number: projectNumber,
            title,
            employee_id: employeeId,
            sponsoredBy,
            start_date: startDate,
            completion_date: completionDate,
            project_cost: projectCost,
            status,
        },
    };
}

function resolveProjectReferences(payload, callback) {
    const employeeSql = `
        SELECT emp_id, division_id
        FROM employees
        WHERE emp_id = ?
    `;
    const agencySql = `
        SELECT serial_no, agency_name
        FROM funding_agencies
        WHERE agency_name = ?
        LIMIT 1
    `;

    db.query(employeeSql, [payload.employee_id], (employeeErr, employeeRows) => {
        if (employeeErr) {
            return callback(employeeErr);
        }

        if (!employeeRows.length) {
            return callback({ statusCode: 400, message: "Selected employee does not exist." });
        }

        db.query(agencySql, [payload.sponsoredBy], (agencyErr, agencyRows) => {
            if (agencyErr) {
                return callback(agencyErr);
            }

            if (!agencyRows.length) {
                return callback({
                    statusCode: 400,
                    message: "Sponsored By must match an existing funding agency name in the database.",
                });
            }

            return callback(null, {
                employee_id: payload.employee_id,
                division_id: employeeRows[0].division_id,
                funding_agency_serial_no: agencyRows[0].serial_no,
            });
        });
    });
}

exports.getAllProjects = (req, res) => {
    fetchAllProjects((err, rows) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        return res.json(rows.map(mapProjectRow));
    });
};

exports.getProjectByNumber = (req, res) => {
    const projectNumber = String(req.params.projectNumber || "").trim();

    if (!projectNumber) {
        return res.status(400).json({ message: "Project number is invalid." });
    }

    fetchProjectByNumber(projectNumber, (err, rows) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!rows.length) {
            return res.status(404).json({ message: "Project not found." });
        }

        return res.json(mapProjectRow(rows[0]));
    });
};

exports.getNextProjectNumber = (req, res) => {
    getNextProjectNumber((err, projectNumber) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        return res.json({ projectNumber });
    });
};

exports.createProject = (req, res) => {
    const { error, payload } = validateProjectPayload(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    getNextProjectNumber((nextNumberErr, nextProjectNumber) => {
        if (nextNumberErr) {
            return sendDatabaseError(res, nextNumberErr);
        }

        const createPayload = {
            ...payload,
            project_number: nextProjectNumber,
        };

        resolveProjectReferences(createPayload, (referenceErr, references) => {
        if (referenceErr) {
            if (referenceErr.statusCode) {
                return res.status(referenceErr.statusCode).json({ message: referenceErr.message });
            }
            return sendDatabaseError(res, referenceErr);
        }

        const sql = `
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            createPayload.project_number,
            createPayload.title,
            references.employee_id,
            references.division_id,
            references.funding_agency_serial_no,
            createPayload.start_date,
            createPayload.completion_date,
            createPayload.project_cost,
            createPayload.status,
        ];

        db.query(sql, values, (err) => {
            if (err) {
                return sendDatabaseError(res, err);
            }

            fetchProjectByNumber(createPayload.project_number, (fetchErr, rows) => {
                if (fetchErr) {
                    return sendDatabaseError(res, fetchErr);
                }

                return res.status(201).json({
                    message: "Project registered successfully.",
                    project: mapProjectRow(rows[0]),
                });
            });
        });
    });
    });
};

exports.updateProject = (req, res) => {
    const routeProjectNumber = String(req.params.projectNumber || "").trim();

    if (!routeProjectNumber) {
        return res.status(400).json({ message: "Project number is invalid." });
    }

    const { error, payload } = validateProjectPayload({
        ...req.body,
        project_number: routeProjectNumber,
    });

    if (error) {
        return res.status(400).json({ message: error });
    }

    resolveProjectReferences(payload, (referenceErr, references) => {
        if (referenceErr) {
            if (referenceErr.statusCode) {
                return res.status(referenceErr.statusCode).json({ message: referenceErr.message });
            }
            return sendDatabaseError(res, referenceErr);
        }

        const sql = `
            UPDATE projects
            SET title = ?, employee_id = ?, division_id = ?, funding_agency_serial_no = ?, start_date = ?,
                completion_date = ?, project_cost = ?, status = ?
            WHERE project_number = ?
        `;

        const values = [
            payload.title,
            references.employee_id,
            references.division_id,
            references.funding_agency_serial_no,
            payload.start_date,
            payload.completion_date,
            payload.project_cost,
            payload.status,
            routeProjectNumber,
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                return sendDatabaseError(res, err);
            }

            if (!result.affectedRows) {
                return res.status(404).json({ message: "Project not found." });
            }

            fetchProjectByNumber(routeProjectNumber, (fetchErr, rows) => {
                if (fetchErr) {
                    return sendDatabaseError(res, fetchErr);
                }

                return res.json({
                    message: "Project updated successfully.",
                    project: mapProjectRow(rows[0]),
                });
            });
        });
    });
};
