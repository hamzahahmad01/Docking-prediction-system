const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Database connection
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const divisionRoutes = require("./routes/divisionRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const fundingAgencyRoutes = require("./routes/fundingAgencyRoutes");
const milestoneRoutes = require("./routes/milestoneRoutes");
const projectClosureRoutes = require("./routes/projectClosureRoutes");
const projectImportRoutes = require("./routes/projectImportRoutes");
const projectRoutes = require("./routes/projectRoutes");
const { ensureImportHistoryTable } = require("./utils/ensureImportHistoryTable");
const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
}));
app.use(express.json());

ensureImportHistoryTable();

// Test Route
app.get("/", (req, res) => {
    res.send("Server Running Successfully");
});

app.use("/auth", authRoutes);
app.use("/division", divisionRoutes);
app.use("/employee", employeeRoutes);
app.use("/funding-agency", fundingAgencyRoutes);
app.use("/milestone", milestoneRoutes);
app.use("/project-closure", projectClosureRoutes);
app.use("/project-import", projectImportRoutes);
app.use("/project", projectRoutes);

app.use((err, req, res, next) => {
    if (!err) {
        return next();
    }

    if (err.message === "Only .xlsx, .xls, and .csv files are allowed.") {
        return res.status(400).json({ message: err.message });
    }

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ message: "This origin is not permitted to access the API." });
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Uploaded file is too large. Please keep it under 5 MB." });
    }

    console.log(err);
    return res.status(500).json({ message: "Unexpected server error.", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
