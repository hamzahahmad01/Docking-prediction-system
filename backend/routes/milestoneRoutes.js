const express = require("express");
const router = express.Router();
const milestoneController = require("../controllers/milestoneController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/", requireRole(["Admin", "DEO"]), milestoneController.getAllMilestones);
router.get("/:serialNo", requireRole(["Admin", "DEO"]), milestoneController.getMilestoneBySerial);
router.post("/", requireRole(["Admin", "DEO"]), milestoneController.createMilestone);
router.put("/:serialNo", requireRole(["Admin", "DEO"]), milestoneController.updateMilestone);
router.delete("/:serialNo", requireRole(["Admin"]), milestoneController.deleteMilestone);

module.exports = router;
