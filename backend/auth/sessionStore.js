const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "8h";

if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set. Add it to backend/.env before starting the server.");
}

const revokedTokens = new Map();

function pruneRevokedTokens() {
    const now = Date.now();

    for (const [token, expiresAt] of revokedTokens) {
        if (expiresAt < now) {
            revokedTokens.delete(token);
        }
    }
}

function createSession(profile) {
    return jwt.sign({ profile }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function getSession(token) {
    if (revokedTokens.has(token)) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        return { profile: decoded.profile, expiresAt: decoded.exp * 1000 };
    } catch (error) {
        return null;
    }
}

function destroySession(token) {
    try {
        const decoded = jwt.decode(token);
        const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now();
        revokedTokens.set(token, expiresAt);
        pruneRevokedTokens();
    } catch (error) {
        // Token was already unusable; nothing further to revoke.
    }
}

module.exports = {
    createSession,
    getSession,
    destroySession,
};
