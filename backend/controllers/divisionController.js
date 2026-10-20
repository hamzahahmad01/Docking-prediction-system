const db = require("../config/db");

function sendDatabaseError(res, err) {
    if (err.code = "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Division ID already exists." });
    }

    console.log(err);
    return res.status(500).json({ message: "Database operation failed.", error: err.code || err.message });
}

function validateDivisionPayload(body) {
    const divName = String(body.div_name || "").trim();
    const employeeName = String(body.employee_name || "").trim();
    const divisionId = body.div_id === undefined || body.div_id === null || body.div_id === ""
        ? null
        : Number(body.div_id);

    if (!divName) {
        return { error: "Division name is required." };
    }

    if (!employeeName) {
        return { error: "Employee name is required." };
    }

    if (divisionId !== null && Number.isNaN(divisionId)) {
        return { error: "Division ID must be numeric." };
    }

    return {
        error: null,
        payload: {
            div_id: divisionId,
            div_name: divName,
            employee_name: employeeName,
        },
    };
}

exports.getAllDivisions = (req, res) => {
    const sql = "SELECT division_id AS div_id, div_name, employee_name FROM divisions ORDER BY division_id ASC";

    db.query(sql, (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        return res.json(result);
    });
};

exports.getDivisionById = (req, res) => {
    const divisionId = Number(req.params.id);

    if (Number.isNaN(divisionId)) {
        return res.status(400).json({ message: "Division ID is invalid." });
    }

    const sql = "SELECT division_id AS div_id, div_name, employee_name FROM divisions WHERE division_id = ?";

    db.query(sql, [divisionId], (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!result.length) {
            return res.status(404).json({ message: "Division not found." });
        }

        return res.json(result[0]);
    });
};

exports.createDivision = (req, res) => {
    const { error, payload } = validateDivisionPayload(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const sql = payload.div_id === null
        ? "INSERT INTO divisions (div_name, employee_name) VALUES (?, ?)"
        : "INSERT INTO divisions (division_id, div_name, employee_name) VALUES (?, ?, ?)";
    const values = payload.div_id === null
        ? [payload.div_name, payload.employee_name]
        : [payload.div_id, payload.div_name, payload.employee_name];

    db.query(sql, values, (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        const createdId = payload.div_id === null ? result.insertId : payload.div_id;

        db.query(
            "SELECT division_id AS div_id, div_name, employee_name FROM divisions WHERE division_id = ?",
            [createdId],
            (fetchErr, rows) => {
                if (fetchErr) {
                    return sendDatabaseError(res, fetchErr);
                }

                return res.status(201).json({
                    message: "Division created successfully.",
                    division: rows[0],
                });
            },
        );
    });
};

exports.updateDivision = (req, res) => {
    const divisionId = Number(req.params.id);

    if (Number.isNaN(divisionId)) {
        return res.status(400).json({ message: "Division ID is invalid." });
    }

    const { error, payload } = validateDivisionPayload(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const sql = "UPDATE divisions SET div_name = ?, employee_name = ? WHERE division_id = ?";

    db.query(sql, [payload.div_name, payload.employee_name, divisionId], (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Division not found." });
        }

        db.query(
            "SELECT division_id AS div_id, div_name, employee_name FROM divisions WHERE division_id = ?",
            [divisionId],
            (fetchErr, rows) => {
                if (fetchErr) {
                    return sendDatabaseError(res, fetchErr);
                }

                return res.json({
                    message: "Division updated successfully.",
                    division: rows[0],
                });
            },
        );
    });
};

exports.deleteDivision = (req, res) => {
    const divisionId = Number(req.params.id);

    if (Number.isNaN(divisionId)) {
        return res.status(400).json({ message: "Division ID is invalid." });
    }

    const sql = "DELETE FROM divisions WHERE division_id = ?";

    db.query(sql, [divisionId], (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Division not found." });
        }

        return res.json({ message: "Division deleted successfully." });
    });
};
