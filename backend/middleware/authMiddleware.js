const { getSession, createSession } = require("../auth/sessionStore");

const REFRESH_THRESHOLD_MS = 1000 * 60 * 60; // reissue once under 1 hour of validity remains

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const token = match[1];
    const session = getSession(token);

    if (!session) {
        return res.status(401).json({ message: "Session is invalid or expired." });
    }

    if (session.expiresAt - Date.now() < REFRESH_THRESHOLD_MS) {
        const refreshedToken = createSession(session.profile);
        res.setHeader("X-Refreshed-Token", refreshedToken);
        res.setHeader("Access-Control-Expose-Headers", "X-Refreshed-Token");
    }

    req.authToken = token;
    req.user = session.profile;
    return next();
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to perform this action." });
        }

        return next();
    };
}

module.exports = {
    requireAuth,
    requireRole,
};
