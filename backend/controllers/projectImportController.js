const db = require("../config/db");
const XLSX = require("xlsx");
const { toDateInputValue } = require("../utils/dateFormat");

const allowedStatuses = new Set(["Ongoing", "Milestone Pending", "Completed"]);

const headerAliases = {
    projectNumber: ["projectnumber", "projectno", "projectid", "project_number", "project_no", "projectnumberid"],
    title: ["projecttitle", "title", "project_name", "projectname"],
    employeeId: ["employeeid", "empid", "employee_id", "emp_id"],
    sponsoredBy: ["sponsoredby", "sponsor", "sponsorname", "fundingagency", "agencyname", "agency"],
    startDate: ["startdate", "dateofstart", "projectstartdate", "start_date"],
    completionDate: ["completiondate", "dateofcompletion", "projectcompletiondate", "completion_date", "enddate"],
    projectCost: ["projectcost", "cost", "project_cost", "amount", "budget"],
    status: ["status", "projectstatus"],
};

const requiredTemplateHeaders = [
    { fieldName: "projectNumber", label: "Project Number" },
    { fieldName: "title", label: "Project Title" },
    { fieldName: "employeeId", label: "Employee ID" },
    { fieldName: "sponsoredBy", label: "Sponsored By" },
    { fieldName: "startDate", label: "Start Date" },
    { fieldName: "completionDate", label: "Completion Date" },
    { fieldName: "projectCost", label: "Project Cost" },
    { fieldName: "status", label: "Status" },
];

function sendDatabaseError(res, err, fallbackMessage = "Database operation failed.") {
    console.log(err);
    return res.status(500).json({ message: fallbackMessage, error: err.code || err.message });
}

function normalizeHeader(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function getCellValue(row, fieldName) {
    const aliases = headerAliases[fieldName];
    const entries = Object.entries(row);

    for (const [key, value] of entries) {
        if (aliases.includes(normalizeHeader(key))) {
            return value;
        }
    }

    return "";
}

function parseCost(value) {
    const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isNaN(parsed) ? NaN : parsed;
}

function parseDateValue(value) {
    if (!value && value !== 0) {
        return "";
    }

    if (value instanceof Date) {
        return toDateInputValue(value);
    }

    if (typeof value === "number") {
        const parsed = XLSX.SSF.parse_date_code(value);

        if (!parsed) {
            return "";
        }

        const month = String(parsed.m).padStart(2, "0");
        const day = String(parsed.d).padStart(2, "0");
        return `${parsed.y}-${month}-${day}`;
    }

    const input = String(value).trim();

    if (!input) {
        return "";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
    }

    const slashMatch = input.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

    if (slashMatch) {
        const [, first, second, year] = slashMatch;
        const day = String(first).padStart(2, "0");
        const month = String(second).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    const parsedDate = new Date(input);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    return toDateInputValue(parsedDate);
}

function extractWorkbookRows(file) {
    const workbook = XLSX.read(file.buffer, {
        type: "buffer",
        cellDates: true,
    });

    const worksheetName = workbook.SheetNames[0];

    if (!worksheetName) {
        return { rows: [], worksheetName: "" };
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[worksheetName], {
        defval: "",
        raw: false,
    });

    return { rows, worksheetName };
}

function fetchLookupMaps(employeeIds, sponsorNames, projectNumbers, callback) {
    const employeeIdList = [...employeeIds];
    const sponsorNameList = [...sponsorNames];
    const projectNumberList = [...projectNumbers];

    const employeeSql = employeeIdList.length
        ? `SELECT emp_id, division_id, emp_name FROM employees WHERE emp_id IN (${employeeIdList.map(() => "?").join(", ")})`
        : "SELECT emp_id, division_id, emp_name FROM employees WHERE 1 = 0";
    const sponsorSql = sponsorNameList.length
        ? `SELECT serial_no, agency_name FROM funding_agencies WHERE agency_name IN (${sponsorNameList.map(() => "?").join(", ")})`
        : "SELECT serial_no, agency_name FROM funding_agencies WHERE 1 = 0";
    const projectSql = projectNumberList.length
        ? `SELECT project_number FROM projects WHERE project_number IN (${projectNumberList.map(() => "?").join(", ")})`
        : "SELECT project_number FROM projects WHERE 1 = 0";

    db.query(employeeSql, employeeIdList, (employeeErr, employeeRows) => {
        if (employeeErr) {
            return callback(employeeErr);
        }

        db.query(sponsorSql, sponsorNameList, (sponsorErr, sponsorRows) => {
            if (sponsorErr) {
                return callback(sponsorErr);
            }

            db.query(projectSql, projectNumberList, (projectErr, projectRows) => {
                if (projectErr) {
                    return callback(projectErr);
                }

                const employeeMap = new Map(employeeRows.map((row) => [row.emp_id, row]));
                const sponsorMap = new Map(
                    sponsorRows.map((row) => [String(row.agency_name).trim().toLowerCase(), row]),
                );
                const existingProjects = new Set(projectRows.map((row) => row.project_number));

                return callback(null, {
                    employeeMap,
                    sponsorMap,
                    existingProjects,
                });
            });
        });
    });
}

function normalizeImportedRows(rawRows) {
    return rawRows.map((row, index) => {
        const projectNumber = String(getCellValue(row, "projectNumber") || "").trim();
        const title = String(getCellValue(row, "title") || "").trim();
        const employeeId = String(getCellValue(row, "employeeId") || "").trim().toUpperCase();
        const sponsoredBy = String(getCellValue(row, "sponsoredBy") || "").trim();
        const startDate = parseDateValue(getCellValue(row, "startDate"));
        const completionDate = parseDateValue(getCellValue(row, "completionDate"));
        const projectCost = parseCost(getCellValue(row, "projectCost"));
        const status = String(getCellValue(row, "status") || "").trim();

        return {
            rowNumber: index + 2,
            projectNumber,
            title,
            employeeId,
            sponsoredBy,
            startDate,
            completionDate,
            projectCost,
            status,
        };
    });
}

function validateImportedRows(rows, lookups) {
    const fileProjectNumbers = new Set();
    const previewRows = [];
    const preparedRows = [];

    rows.forEach((row) => {
        const errors = [];
        const employee = lookups.employeeMap.get(row.employeeId);
        const sponsor = lookups.sponsorMap.get(row.sponsoredBy.toLowerCase());

        if (!row.projectNumber) {
            errors.push("Project number is required.");
        } else if (fileProjectNumbers.has(row.projectNumber)) {
            errors.push("Project number is duplicated in the uploaded file.");
        } else {
            fileProjectNumbers.add(row.projectNumber);
        }

        if (lookups.existingProjects.has(row.projectNumber)) {
            errors.push("Project number already exists in the database.");
        }

        if (!row.title) {
            errors.push("Project title is required.");
        }

        if (!row.employeeId) {
            errors.push("Employee ID is required.");
        } else if (!employee) {
            errors.push("Employee ID does not exist in the employees table.");
        }

        if (!row.sponsoredBy) {
            errors.push("Sponsored By is required.");
        } else if (!sponsor) {
            errors.push("Funding agency name does not match an existing record.");
        }

        if (!row.startDate) {
            errors.push("Start date is missing or invalid.");
        }

        if (!row.completionDate) {
            errors.push("Completion date is missing or invalid.");
        }

        if (Number.isNaN(row.projectCost)) {
            errors.push("Project cost must be numeric.");
        }

        if (!allowedStatuses.has(row.status)) {
            errors.push("Status must be Ongoing, Milestone Pending, or Completed.");
        }

        const previewRow = {
            ...row,
            division: employee ? employee.division_id : "",
            validationStatus: errors.length ? "Blocked" : "Ready",
            remarks: errors.length ? errors.join(" ") : "Validated successfully.",
        };

        previewRows.push(previewRow);

        if (!errors.length) {
            preparedRows.push({
                project_number: row.projectNumber,
                title: row.title,
                employee_id: row.employeeId,
                division_id: employee.division_id,
                funding_agency_serial_no: sponsor.serial_no,
                start_date: row.startDate,
                completion_date: row.completionDate,
                project_cost: row.projectCost,
                status: row.status,
            });
        }
    });

    return {
        previewRows,
        preparedRows,
        summary: {
            totalRows: previewRows.length,
            readyRows: preparedRows.length,
            blockedRows: previewRows.length - preparedRows.length,
        },
    };
}

function validatePreparedRows(rows, callback) {
    if (!Array.isArray(rows) || !rows.length) {
        return callback({ statusCode: 400, message: "There are no validated rows ready to import." });
    }

    const seen = new Set();

    for (const row of rows) {
        if (
            !row.project_number ||
            !row.title ||
            !row.employee_id ||
            !row.division_id ||
            !row.funding_agency_serial_no ||
            !row.start_date ||
            !row.completion_date ||
            Number.isNaN(Number(row.project_cost)) ||
            !allowedStatuses.has(String(row.status || "").trim())
        ) {
            return callback({ statusCode: 400, message: "One or more prepared rows are invalid." });
        }

        if (seen.has(row.project_number)) {
            return callback({ statusCode: 400, message: "Prepared rows contain duplicate project numbers." });
        }

        seen.add(row.project_number);
    }

    const projectNumbers = rows.map((row) => row.project_number);
    const sql = `SELECT project_number FROM projects WHERE project_number IN (${projectNumbers.map(() => "?").join(", ")})`;

    db.query(sql, projectNumbers, (err, existingRows) => {
        if (err) {
            return callback(err);
        }

        if (existingRows.length) {
            return callback({
                statusCode: 409,
                message: "One or more project numbers already exist in the database.",
            });
        }

        return callback(null);
    });
}

function createImportHistoryEntry(payload, callback) {
    const sql = `
        INSERT INTO project_import_history (
            file_name,
            worksheet_name,
            uploaded_by_employee_id,
            uploaded_by_role,
            total_rows,
            ready_rows,
            blocked_rows,
            imported_rows,
            import_status,
            error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            payload.fileName,
            payload.worksheetName || null,
            payload.uploadedByEmployeeId || null,
            payload.uploadedByRole,
            payload.totalRows || 0,
            payload.readyRows || 0,
            payload.blockedRows || 0,
            payload.importedRows || 0,
            payload.status,
            payload.errorMessage || null,
        ],
        (err, result) => {
            if (err) {
                return callback(err);
            }

            return callback(null, result.insertId);
        },
    );
}

function updateImportHistoryEntry(historyId, payload, callback, connection = db) {
    const sql = `
        UPDATE project_import_history
        SET ready_rows = ?, blocked_rows = ?, imported_rows = ?, import_status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE import_id = ?
    `;

    connection.query(
        sql,
        [
            payload.readyRows || 0,
            payload.blockedRows || 0,
            payload.importedRows || 0,
            payload.status,
            payload.errorMessage || null,
            historyId,
        ],
        callback,
    );
}

function buildHistoryFilter(query) {
    const conditions = [];
    const params = [];

    if (query.status) {
        conditions.push("import_status = ?");
        params.push(query.status);
    }

    if (query.fileName) {
        conditions.push("file_name LIKE ?");
        params.push(`%${query.fileName}%`);
    }

    if (query.uploadedBy) {
        conditions.push("uploaded_by_employee_id = ?");
        params.push(query.uploadedBy);
    }

    if (query.dateFrom) {
        conditions.push("created_at >= ?");
        params.push(`${query.dateFrom} 00:00:00`);
    }

    if (query.dateTo) {
        conditions.push("created_at <= ?");
        params.push(`${query.dateTo} 23:59:59`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);

    return { whereClause, params, limit };
}

function mapHistoryRow(row) {
    return {
        importId: row.import_id,
        fileName: row.file_name,
        worksheetName: row.worksheet_name,
        uploadedByEmployeeId: row.uploaded_by_employee_id,
        uploadedByRole: row.uploaded_by_role,
        totalRows: row.total_rows,
        readyRows: row.ready_rows,
        blockedRows: row.blocked_rows,
        importedRows: row.imported_rows,
        status: row.import_status,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

exports.previewProjectImport = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Please select an Excel or CSV file to continue." });
    }

    const fileName = req.file.originalname;
    const uploadedByEmployeeId = req.user?.employeeId || null;
    const uploadedByRole = req.user?.role || "Unknown";

    let extracted;

    try {
        extracted = extractWorkbookRows(req.file);
    } catch (error) {
        return createImportHistoryEntry(
            {
                fileName,
                worksheetName: null,
                uploadedByEmployeeId,
                uploadedByRole,
                status: "Template Rejected",
                errorMessage: "The uploaded file could not be read. Please check the sheet format.",
            },
            () => res.status(400).json({ message: "The uploaded file could not be read. Please check the sheet format." }),
        );
    }

    const { rows: rawRows, worksheetName } = extracted;

    if (!rawRows.length) {
        return createImportHistoryEntry(
            {
                fileName,
                worksheetName,
                uploadedByEmployeeId,
                uploadedByRole,
                status: "Template Rejected",
                errorMessage: "The uploaded sheet does not contain any data rows.",
            },
            () => res.status(400).json({ message: "The uploaded sheet does not contain any data rows." }),
        );
    }

    const normalizedRows = normalizeImportedRows(rawRows);
    const employeeIds = new Set(normalizedRows.map((row) => row.employeeId).filter(Boolean));
    const sponsorNames = new Set(normalizedRows.map((row) => row.sponsoredBy).filter(Boolean));
    const projectNumbers = new Set(normalizedRows.map((row) => row.projectNumber).filter(Boolean));

    fetchLookupMaps(employeeIds, sponsorNames, projectNumbers, (err, lookups) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        const result = validateImportedRows(normalizedRows, lookups);

        createImportHistoryEntry(
            {
                fileName,
                worksheetName,
                uploadedByEmployeeId,
                uploadedByRole,
                totalRows: result.summary.totalRows,
                readyRows: result.summary.readyRows,
                blockedRows: result.summary.blockedRows,
                importedRows: 0,
                status: result.summary.blockedRows ? "Validation Issues" : "Validated",
                errorMessage: result.summary.blockedRows
                    ? `${result.summary.blockedRows} row(s) require correction before import.`
                    : null,
            },
            (historyErr, historyId) => {
                if (historyErr) {
                    return sendDatabaseError(res, historyErr);
                }

                return res.json({
                    message: result.summary.blockedRows
                        ? "Spreadsheet validated with issues. Review blocked rows before import."
                        : "Spreadsheet validated successfully.",
                    historyId,
                    fileName,
                    worksheetName,
                    expectedHeaders: requiredTemplateHeaders.map((item) => item.label),
                    ...result,
                });
            },
        );
    });
};

exports.commitProjectImport = (req, res) => {
    const preparedRows = Array.isArray(req.body.rows) ? req.body.rows : [];
    const historyId = Number(req.body.historyId);
    const readyRows = Number(req.body.readyRows || preparedRows.length || 0);
    const blockedRows = Number(req.body.blockedRows || 0);

    validatePreparedRows(preparedRows, (validationErr) => {
        if (validationErr) {
            if (!Number.isNaN(historyId)) {
                updateImportHistoryEntry(
                    historyId,
                    {
                        readyRows,
                        blockedRows,
                        importedRows: 0,
                        status: "Import Failed",
                        errorMessage: validationErr.message,
                    },
                    () => {},
                );
            }

            if (validationErr.statusCode) {
                return res.status(validationErr.statusCode).json({ message: validationErr.message });
            }

            return sendDatabaseError(res, validationErr);
        }

        const values = preparedRows.map((row) => [
            row.project_number,
            row.title,
            row.employee_id,
            row.division_id,
            row.funding_agency_serial_no,
            row.start_date,
            row.completion_date,
            Number(row.project_cost),
            row.status,
        ]);

        const projectInsertSql = `
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
            ) VALUES ?
        `;

        db.getConnection((connectionErr, connection) => {
            if (connectionErr) {
                return sendDatabaseError(
                    res,
                    connectionErr,
                    "Import transaction could not be started. No project rows were inserted.",
                );
            }

            connection.beginTransaction((transactionErr) => {
                if (transactionErr) {
                    connection.release();
                    return sendDatabaseError(
                        res,
                        transactionErr,
                        "Import transaction could not be started. No project rows were inserted.",
                    );
                }

                connection.query(projectInsertSql, [values], (insertErr, result) => {
                    if (insertErr) {
                        return connection.rollback(() => {
                            connection.release();

                            if (!Number.isNaN(historyId)) {
                                updateImportHistoryEntry(
                                    historyId,
                                    {
                                        readyRows,
                                        blockedRows,
                                        importedRows: 0,
                                        status: "Import Failed",
                                        errorMessage:
                                            "Import failed during database write. No project rows were inserted.",
                                    },
                                    () => {},
                                );
                            }

                            return sendDatabaseError(
                                res,
                                insertErr,
                                "Import failed during database write. No project rows were inserted; the transaction was rolled back.",
                            );
                        });
                    }

                    const finalizeCommit = (callback) => {
                        if (Number.isNaN(historyId)) {
                            return callback(null);
                        }

                        return updateImportHistoryEntry(
                            historyId,
                            {
                                readyRows,
                                blockedRows,
                                importedRows: result.affectedRows,
                                status: "Imported",
                                errorMessage: null,
                            },
                            callback,
                            connection,
                        );
                    };

                    finalizeCommit((historyErr) => {
                        if (historyErr) {
                            return connection.rollback(() => {
                                connection.release();
                                return sendDatabaseError(
                                    res,
                                    historyErr,
                                    "Import audit update failed. No project rows were inserted; the transaction was rolled back.",
                                );
                            });
                        }

                        return connection.commit((commitErr) => {
                            if (commitErr) {
                                return connection.rollback(() => {
                                    connection.release();

                                    if (!Number.isNaN(historyId)) {
                                        updateImportHistoryEntry(
                                            historyId,
                                            {
                                                readyRows,
                                                blockedRows,
                                                importedRows: 0,
                                                status: "Import Failed",
                                                errorMessage:
                                                    "Import commit failed. No project rows were inserted after rollback.",
                                            },
                                            () => {},
                                        );
                                    }

                                    return sendDatabaseError(
                                        res,
                                        commitErr,
                                        "Import commit failed. No project rows were inserted; the transaction was rolled back.",
                                    );
                                });
                            }

                            connection.release();

                            return res.status(201).json({
                                message: "Project records imported successfully.",
                                insertedRows: result.affectedRows,
                                rolledBack: false,
                            });
                        });
                    });
                });
            });
        });
    });
};

exports.getImportHistory = (req, res) => {
    const { whereClause, params, limit } = buildHistoryFilter(req.query);
    const sql = `
        SELECT *
        FROM project_import_history
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit}
    `;

    db.query(sql, params, (err, rows) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        return res.json({ history: rows.map(mapHistoryRow) });
    });
};

exports.exportImportHistory = (req, res) => {
    const { whereClause, params, limit } = buildHistoryFilter(req.query);
    const sql = `
        SELECT *
        FROM project_import_history
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit}
    `;

    db.query(sql, params, (err, rows) => {
        if (err) {
            return sendDatabaseError(res, err);
        }

        const escapeCsvValue = (value) => {
            const stringValue = value === null || value === undefined ? "" : String(value);
            return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        };

        const headerLine = [
            "Imported At",
            "File Name",
            "Sheet",
            "Uploaded By",
            "Role",
            "Total Rows",
            "Ready",
            "Blocked",
            "Imported",
            "Status",
            "Notes",
        ].join(",");

        const lines = rows.map((row) =>
            [
                row.created_at,
                row.file_name,
                row.worksheet_name || "",
                row.uploaded_by_employee_id || "",
                row.uploaded_by_role,
                row.total_rows,
                row.ready_rows,
                row.blocked_rows,
                row.imported_rows,
                row.import_status,
                row.error_message || "",
            ]
                .map(escapeCsvValue)
                .join(","),
        );

        const csvContent = [headerLine, ...lines].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="project-import-history.csv"');
        return res.send(csvContent);
    });
};

exports.downloadImportTemplate = (req, res) => {
    const headerRow = requiredTemplateHeaders.map((item) => item.label);
    const sampleRow = [
        "PRJ-001",
        "Sample Project Title",
        "EMP001",
        "Sample Funding Agency",
        "2026-01-01",
        "2026-12-31",
        "1000000",
        "Ongoing",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="csir-iip-project-import-template.xlsx"');
    return res.send(buffer);
};
