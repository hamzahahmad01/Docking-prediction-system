const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/", requireRole(["Admin", "DEO", "Project Lead", "Viewer"]), projectController.getAllProjects);
router.get("/next-number", requireRole(["Admin"]), projectController.getNextProjectNumber);
router.get("/:projectNumber", requireRole(["Admin", "DEO", "Project Lead", "Viewer"]), projectController.getProjectByNumber);
router.post("/", requireRole(["Admin"]), projectController.createProject);
router.put("/:projectNumber", requireRole(["Admin"]), projectController.updateProject);

module.exports = router;
