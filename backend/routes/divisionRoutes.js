const express = require("express");
const router = express.Router();
const divisionController = require("../controllers/divisionController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/", requireRole(["Admin"]), divisionController.getAllDivisions);
router.get("/:id", requireRole(["Admin"]), divisionController.getDivisionById);
router.post("/", requireRole(["Admin"]), divisionController.createDivision);
router.post("/add", requireRole(["Admin"]), divisionController.createDivision);
router.put("/:id", requireRole(["Admin"]), divisionController.updateDivision);
router.delete("/:id", requireRole(["Admin"]), divisionController.deleteDivision);

module.exports = router;
