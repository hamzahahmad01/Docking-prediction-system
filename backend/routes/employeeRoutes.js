const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/", requireRole(["Admin", "DEO"]), employeeController.getAllEmployees);
router.get("/:id", requireRole(["Admin", "DEO"]), employeeController.getEmployeeById);
router.post("/", requireRole(["Admin", "DEO"]), employeeController.createEmployee);
router.put("/:id", requireRole(["Admin", "DEO"]), employeeController.updateEmployee);
router.delete("/:id", requireRole(["Admin"]), employeeController.deleteEmployee);

module.exports = router;
