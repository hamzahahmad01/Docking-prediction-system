const express = require("express");
const router = express.Router();
const fundingAgencyController = require("../controllers/fundingAgencyController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/", requireRole(["Admin"]), fundingAgencyController.getAllFundingAgencies);
router.get("/:serialNo", requireRole(["Admin"]), fundingAgencyController.getFundingAgencyById);
router.post("/", requireRole(["Admin"]), fundingAgencyController.createFundingAgency);
router.put("/:serialNo", requireRole(["Admin"]), fundingAgencyController.updateFundingAgency);
router.delete("/:serialNo", requireRole(["Admin"]), fundingAgencyController.deleteFundingAgency);

module.exports = router;
