const express = require("express");
const router = express.Router();
const projectClosureController = require("../controllers/projectClosureController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/:projectNumber", requireRole(["Admin", "Project Lead"]), projectClosureController.getClosureByProjectNumber);
router.put("/:projectNumber", requireRole(["Admin", "Project Lead"]), projectClosureController.upsertClosureByProjectNumber);

module.exports = router;
