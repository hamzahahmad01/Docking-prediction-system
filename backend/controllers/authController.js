const db = require("../config/db");
const { createSession, destroySession } = require("../auth/sessionStore");

function normalizeRole(roleName) {
    if (roleName === "Project Leader") {
        return "Project Lead";
    }

    return roleName;
}

function mapUserProfile(row) {
    return {
        userId: row.user_id,
        employeeId: row.emp_id || row.employee_id || row.user_id,
        name: row.emp_name || row.user_id,
        division: row.div_name || "Unassigned",
        designation: row.position || row.member_type || "User",
        role: normalizeRole(row.role_name),
        landingPage: row.landing_page || "/dashboard",
    };
}

exports.login = (req, res) => {
    const employeeId = String(req.body.employeeId || req.body.employee_id || "").trim();
    const password = String(req.body.password || "").trim();

    if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required." });
    }

    if (!password) {
        return res.status(400).json({ message: "Password is required." });
    }

    const sql = `
        SELECT
            user_id,
            role_name,
            landing_page,
            emp_id,
            emp_name,
            div_name,
            position,
            member_type
        FROM vw_user_login_profile
        WHERE (emp_id = ? OR user_id = ?)
          AND password_hash = SHA2(?, 256)
          AND is_active = 1
        LIMIT 1
    `;

    db.query(sql, [employeeId, employeeId, password], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Authentication failed due to a database error." });
        }

        if (!rows.length) {
            return res.status(401).json({ message: "Invalid employee ID or password." });
        }

        const profile = mapUserProfile(rows[0]);

        db.query(
            "UPDATE users SET last_login_at = NOW() WHERE user_id = ?",
            [profile.userId],
            (updateErr) => {
                if (updateErr) {
                    console.log(updateErr);
                }

                const token = createSession(profile);

                return res.json({
                    message: "Login successful.",
                    employee: profile,
                    token,
                });
            },
        );
    });
};

exports.logout = (req, res) => {
    if (req.authToken) {
        destroySession(req.authToken);
    }

    return res.json({ message: "Logged out successfully." });
};
