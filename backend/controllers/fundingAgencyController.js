const db = require("../config/db");

const allowedAgencyTypes = new Set(["Govt", "PSU", "Pvt", "Foreign"]);

function sendDatabaseError(res, err) {
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Funding agency record already exists." });
    }

    if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            message: "Funding agency is linked to an existing project and cannot be deleted yet.",
        });
    }

    console.log(err);
    return res.status(500).json({ message: "Database operation failed.", error: err.code || err.message });
}

function validateFundingAgencyPayload(body) {
    const agencyName = String(body.agency_name || body.agencyName || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();
    const agencyType = String(body.agency_type || body.agencyType || "").trim();

    if (!agencyName) {
        return { error: "Agency name is required." };
    }

    if (!email) {
        return { error: "Email is required." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: "Email format is invalid." };
    }

    if (!address) {
        return { error: "Address is required." };
    }

    if (!allowedAgencyTypes.has(agencyType)) {
        return { error: "Agency type is invalid." };
    }

    return {
        error: null,
        payload: {
            agency_name: agencyName,
            email,
            address,
            agency_type: agencyType,
        },
    };
}

function fetchAllFundingAgencies(callback) {
    const sql = `
        SELECT serial_no, agency_name, email, address, agency_type, created_at
        FROM funding_agencies
        ORDER BY serial_no ASC
    `;

    db.query(sql, callback);
}

function fetchFundingAgencyById(serialNo, callback) {
    const sql = `
        SELECT serial_no, agency_name, email, address, agency_type, created_at
        FROM funding_agencies
        WHERE serial_no = ?
    `;

    db.query(sql, [serialNo], callback);
}

exports.getAllFundingAgencies = (req, res) => {
    fetchAllFundingAgencies((err, rows) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        return res.json(rows);
    });
};

exports.getFundingAgencyById = (req, res) => {
    const serialNo = Number(req.params.serialNo);

    if (Number.isNaN(serialNo)) {
        return res.status(400).json({ message: "Funding agency serial number is invalid." });
    }

    fetchFundingAgencyById(serialNo, (err, rows) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!rows.length) {
            return res.status(404).json({ message: "Funding agency record not found." });
        }

        return res.json(rows[0]);
    });
};

exports.createFundingAgency = (req, res) => {
    const { error, payload } = validateFundingAgencyPayload(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const sql = `
        INSERT INTO funding_agencies (agency_name, email, address, agency_type)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [payload.agency_name, payload.email, payload.address, payload.agency_type], (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        fetchFundingAgencyById(result.insertId, (fetchErr, rows) => {
            if (fetchErr) {
                return sendDatabaseError(res, fetchErr);
            }

            return res.status(201).json({
                message: "Funding agency created successfully.",
                fundingAgency: rows[0],
            });
        });
    });
};

exports.updateFundingAgency = (req, res) => {
    const serialNo = Number(req.params.serialNo);

    if (Number.isNaN(serialNo)) {
        return res.status(400).json({ message: "Funding agency serial number is invalid." });
    }

    const { error, payload } = validateFundingAgencyPayload(req.body);

    if (error) {
        return res.status(400).json({ message: error });
    }

    const sql = `
        UPDATE funding_agencies
        SET agency_name = ?, email = ?, address = ?, agency_type = ?
        WHERE serial_no = ?
    `;

    db.query(sql, [payload.agency_name, payload.email, payload.address, payload.agency_type, serialNo], (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Funding agency record not found." });
        }

        fetchFundingAgencyById(serialNo, (fetchErr, rows) => {
            if (fetchErr) {
                return sendDatabaseError(res, fetchErr);
            }

            return res.json({
                message: "Funding agency updated successfully.",
                fundingAgency: rows[0],
            });
        });
    });
};

exports.deleteFundingAgency = (req, res) => {
    const serialNo = Number(req.params.serialNo);

    if (Number.isNaN(serialNo)) {
        return res.status(400).json({ message: "Funding agency serial number is invalid." });
    }

    db.query("DELETE FROM funding_agencies WHERE serial_no = ?", [serialNo], (err, result) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Funding agency record not found." });
        }

        return res.json({ message: "Funding agency deleted successfully." });
    });
};
