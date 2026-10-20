const db = require("../config/db");
const { toDateInputValue } = require("../utils/dateFormat");

function sendDatabaseError(res, err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ message: "Referenced project or employee record does not exist." });
    }

    console.log(err);
    return res.status(500).json({ message: "Database operation failed.", error: err.code || err.message });
}

function mapClosureRow(row) {
    return {
        closureId: row.closure_id,
        projectNumber: row.project_number,
        previousProbableCompletionDate: toDateInputValue(row.previous_probable_completion_date),
        probableCompletionDate: toDateInputValue(row.current_probable_completion_date),
        actualCompletionDate: toDateInputValue(row.actual_completion_date),
        remarks: row.remarks || "",
        updatedByEmployeeId: row.updated_by_employee_id || "",
        updatedRole: row.updated_role || "",
    };
}

function fetchClosureByProjectNumber(projectNumber, callback) {
    const sql = `
        SELECT
            closure_id,
            project_number,
            previous_probable_completion_date,
            current_probable_completion_date,
            actual_completion_date,
            remarks,
            updated_by_employee_id,
            updated_role
        FROM project_closure_review
        WHERE project_number = ?
    `;

    db.query(sql, [projectNumber], callback);
}

function fetchProjectAssignment(projectNumber, callback) {
    db.query(
        "SELECT project_number, employee_id, status FROM projects WHERE project_number = ?",
        [projectNumber],
        callback,
    );
}

exports.getClosureByProjectNumber = (req, res) => {
    const projectNumber = String(req.params.projectNumber || "").trim();
    const requesterRole = req.user?.role;
    const requesterEmployeeId = req.user?.employeeId;

    if (!projectNumber) {
        return res.status(400).json({ message: "Project number is invalid." });
    }

    fetchProjectAssignment(projectNumber, (projectErr, projectRows) => {
        if (projectErr) {
            return sendDatabaseError(res, projectErr);
        }

        if (!projectRows.length) {
            return res.status(404).json({ message: "Project record not found." });
        }

        const project = projectRows[0];

        if (requesterRole === "Project Lead" && project.employee_id !== requesterEmployeeId) {
            return res.status(403).json({ message: "Project leaders can view only their assigned project." });
        }

        fetchClosureByProjectNumber(projectNumber, (err, rows) => {
            if (err) {
                return sendDatabaseError(res, err);
            }

            return res.json({
                closure: rows.length ? mapClosureRow(rows[0]) : null,
            });
        });
    });
};

exports.upsertClosureByProjectNumber = (req, res) => {
    const projectNumber = String(req.params.projectNumber || "").trim();
    const employeeId = String(req.user?.employeeId || "").trim();
    const userRole = String(req.user?.role || "").trim();
    const remarks = String(req.body.remarks || "").trim();
    const probableCompletionDate = String(req.body.probableCompletionDate || "").trim();
    const actualCompletionDate = String(req.body.actualCompletionDate || "").trim();

    if (!projectNumber) {
        return res.status(400).json({ message: "Project number is invalid." });
    }

    if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required." });
    }

    if (!userRole) {
        return res.status(400).json({ message: "User role is required." });
    }

    if (userRole !== "Admin" && userRole !== "Project Lead") {
        return res.status(403).json({ message: "You do not have permission to update closure details." });
    }

    fetchProjectAssignment(projectNumber, (projectErr, projectRows) => {
        if (projectErr) {
            return sendDatabaseError(res, projectErr);
        }

        if (!projectRows.length) {
            return res.status(404).json({ message: "Project record not found." });
        }

        const project = projectRows[0];

        if (userRole === "Project Lead" && project.employee_id !== employeeId) {
            return res.status(403).json({ message: "Project leaders can update only their assigned project." });
        }

        fetchClosureByProjectNumber(projectNumber, (closureErr, closureRows) => {
            if (closureErr) {
                return sendDatabaseError(res, closureErr);
            }

            const existingClosure = closureRows[0] || null;
            const currentProbable = toDateInputValue(existingClosure?.current_probable_completion_date);
            const previousProbable = toDateInputValue(existingClosure?.previous_probable_completion_date);
            const existingActual = toDateInputValue(existingClosure?.actual_completion_date);
            const existingRemarks = existingClosure?.remarks || "";

            const nextClosure = {
                previousProbableCompletionDate: previousProbable,
                probableCompletionDate: currentProbable,
                actualCompletionDate: existingActual,
                remarks: existingRemarks,
            };

            if (userRole === "Project Lead") {
                if (!probableCompletionDate) {
                    return res.status(400).json({ message: "Current probable date of completion is required." });
                }

                nextClosure.previousProbableCompletionDate =
                    currentProbable && currentProbable !== probableCompletionDate
                        ? currentProbable
                        : previousProbable;
                nextClosure.probableCompletionDate = probableCompletionDate;
                nextClosure.remarks = remarks;
            }

            if (userRole === "Admin") {
                if (probableCompletionDate) {
                    nextClosure.previousProbableCompletionDate =
                        currentProbable && currentProbable !== probableCompletionDate
                            ? currentProbable
                            : previousProbable;
                    nextClosure.probableCompletionDate = probableCompletionDate;
                }

                nextClosure.actualCompletionDate = actualCompletionDate;
                nextClosure.remarks = remarks || nextClosure.remarks;
            }

            const persist = () => {
                const values = [
                    projectNumber,
                    nextClosure.previousProbableCompletionDate || null,
                    nextClosure.probableCompletionDate || null,
                    nextClosure.actualCompletionDate || null,
                    nextClosure.remarks || null,
                    employeeId,
                    userRole,
                ];

                const insertSql = `
                    INSERT INTO project_closure_review (
                        project_number,
                        previous_probable_completion_date,
                        current_probable_completion_date,
                        actual_completion_date,
                        remarks,
                        updated_by_employee_id,
                        updated_role
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        previous_probable_completion_date = VALUES(previous_probable_completion_date),
                        current_probable_completion_date = VALUES(current_probable_completion_date),
                        actual_completion_date = VALUES(actual_completion_date),
                        remarks = VALUES(remarks),
                        updated_by_employee_id = VALUES(updated_by_employee_id),
                        updated_role = VALUES(updated_role)
                `;

                db.query(insertSql, values, (saveErr) => {
                    if (saveErr) {
                        return sendDatabaseError(res, saveErr);
                    }

                    const statusSql = nextClosure.actualCompletionDate
                        ? "UPDATE projects SET status = 'Completed' WHERE project_number = ?"
                        : "UPDATE projects SET status = status WHERE project_number = ?";

                    db.query(statusSql, [projectNumber], (statusErr) => {
                        if (statusErr) {
                            return sendDatabaseError(res, statusErr);
                        }

                        fetchClosureByProjectNumber(projectNumber, (fetchErr, rows) => {
                            if (fetchErr) {
                                return sendDatabaseError(res, fetchErr);
                            }

                            return res.json({
                                message:
                                    userRole === "Project Lead"
                                        ? "Probable completion details updated successfully."
                                        : "Project closure details updated successfully.",
                                closure: mapClosureRow(rows[0]),
                                projectStatus: nextClosure.actualCompletionDate ? "Completed" : project.status,
                            });
                        });
                    });
                });
            };

            return persist();
        });
    });
};
