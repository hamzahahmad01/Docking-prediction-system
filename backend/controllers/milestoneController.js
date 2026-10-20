const db = require("../config/db");
const { toDateInputValue } = require("../utils/dateFormat");

function sendDatabaseError(res, err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ message: "Selected project number does not exist." });
    }

    console.log(err);
    return res.status(500).json({ message: "Database operation failed.", error: err.code || err.message });
}

function mapMilestoneRow(row) {
    return {
        id: row.serial_no,
        serialNo: row.serial_no,
        description: row.description,
        projectNumber: row.project_number,
        milestoneCompletionDateAgreement: toDateInputValue(row.milestone_completion_date_agreement),
        pi: row.pi,
        title: row.title,
        projectCost: Number(row.project_cost || 0),
        startDate: toDateInputValue(row.start_date),
        completionDate: toDateInputValue(row.completion_date),
        status: row.status,
        employeeName: row.emp_name,
        division: row.div_name,
    };
}

function fetchAllMilestones(callback) {
    const sql = `
        SELECT
            m.serial_no,
            m.description,
            m.project_number,
            m.milestone_completion_date_agreement,
            m.pi,
            p.title,
            p.project_cost,
            p.start_date,
            p.completion_date,
            p.status,
            e.emp_name,
            d.div_name
        FROM milestones m
        LEFT JOIN projects p ON p.project_number = m.project_number
        LEFT JOIN employees e ON e.emp_id = p.employee_id
        LEFT JOIN divisions d ON d.division_id = p.division_id
        ORDER BY m.serial_no ASC
    `;

    db.query(sql, callback);
}

function fetchMilestoneBySerial(serialNo, callback) {
    const sql = `
        SELECT
            m.serial_no,
            m.description,
            m.project_number,
            m.milestone_completion_date_agreement,
            m.pi,
            p.title,
            p.project_cost,
            p.start_date,
            p.completion_date,
            p.status,
            e.emp_name,
            d.div_name
        FROM milestones m
        LEFT JOIN projects p ON p.project_number = m.project_number
        LEFT JOIN employees e ON e.emp_id = p.employee_id
        LEFT JOIN divisions d ON d.division_id = p.division_id
        WHERE m.serial_no = ?
    `;

    db.query(sql, [serialNo], callback);
}

function validateMilestonePayload(body) {
    const projectNumber = String(body.project_number || body.projectNumber || "").trim();
    const description = String(body.description || "").trim();
    const milestoneCompletionDateAgreement = String(
        body.milestone_completion_date_agreement || body.milestoneCompletionDateAgreement || "",
    ).trim();
    const pi = String(body.pi || "").trim();

    if (!projectNumber) {
        return { error: "Project number is required." };
    }

    if (!description) {
        return { error: "Milestone description is required." };
    }

    if (!milestoneCompletionDateAgreement) {
        return { error: "Milestone completion date is required." };
    }

    if (!pi) {
        return { error: "PI is required." };
    }

    return {
        error: null,
        payload: {
            project_number: projectNumber,
            description,
            milestone_completion_date_agreement: milestoneCompletionDateAgreement,
            pi,
        },
    };
}

exports.getAllMilestones = (req, res) => {
    fetchAllMilestones((err, rows) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        return res.json(rows.map(mapMilestoneRow));
    });
};

exports.getMilestoneBySerial = (req, res) => {
    const serialNo = Number(req.params.serialNo);

    if (Number.isNaN(serialNo)) {
        return res.status(400).json({ message: "Milestone serial number is invalid." });
    }

    fetchMilestoneBySerial(serialNo, (err, rows) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!rows.length) {
            return res.status(404).json({ message: "Milestone record not found." });
        }

        return res.json(mapMilestoneRow(rows[0]));
    });
};

exports.createMilestone = (req, res) => {
    const { error, payload } = validateMilestonePayload(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const sql = `
        INSERT INTO milestones (description, project_number, milestone_completion_date_agreement, pi)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [payload.description, payload.project_number, payload.milestone_completion_date_agreement, payload.pi],
        (err, result) => {
            if (err) {
                return sendDatabaseError(res, err);
            }

            fetchMilestoneBySerial(result.insertId, (fetchErr, rows) => {
                if (fetchErr) {
                    return sendDatabaseError(res, fetchErr);
                }

                return res.status(201).json({
                    message: "Milestone record created successfully.",
                    milestone: mapMilestoneRow(rows[0]),
                });
            });
        },
    );
};

exports.updateMilestone = (req, res) => {
    const serialNo = Number(req.params.serialNo);

    if (Number.isNaN(serialNo)) {
        return res.status(400).json({ message: "Milestone serial number is invalid." });
    }

    const { error, payload } = validateMilestonePayload(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const sql = `
        UPDATE milestones
        SET description = ?, project_number = ?, milestone_completion_date_agreement = ?, pi = ?
        WHERE serial_no = ?
    `;

    db.query(
        sql,
        [
            payload.description,
            payload.project_number,
            payload.milestone_completion_date_agreement,
            payload.pi,
            serialNo,
        ],
        (err, result) => {
            if (err) {
                return sendDatabaseError(res, err);
            }

            if (!result.affectedRows) {
                return res.status(404).json({ message: "Milestone record not found." });
            }

            fetchMilestoneBySerial(serialNo, (fetchErr, rows) => {
                if (fetchErr) {
                    return sendDatabaseError(res, fetchErr);
                }

                return res.json({
                    message: "Milestone record updated successfully.",
                    milestone: mapMilestoneRow(rows[0]),
                });
            });
        },
    );
};

exports.deleteMilestone = (req, res) => {
    const serialNo = Number(req.params.serialNo);

    if (Number.isNaN(serialNo)) {
        return res.status(400).json({ message: "Milestone serial number is invalid." });
    }

    db.query("DELETE FROM milestones WHERE serial_no = ?", [serialNo], (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Milestone record not found." });
        }

        return res.json({ message: "Milestone record deleted successfully." });
    });
};
