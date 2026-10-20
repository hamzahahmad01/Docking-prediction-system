const express = require("express");
const multer = require("multer");
const projectImportController = require("../controllers/projectImportController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        const isAllowed =
            /\.xlsx$/i.test(file.originalname) ||
            /\.xls$/i.test(file.originalname) ||
            /\.csv$/i.test(file.originalname);

        if (!isAllowed) {
            return callback(new Error("Only .xlsx, .xls, and .csv files are allowed."));
        }

        return callback(null, true);
    },
});

router.use(requireAuth);
router.use(requireRole(["Admin", "DEO"]));

router.get("/template", projectImportController.downloadImportTemplate);
router.get("/history/export", projectImportController.exportImportHistory);
router.get("/history", projectImportController.getImportHistory);
router.post("/preview", upload.single("file"), projectImportController.previewProjectImport);
router.post("/commit", projectImportController.commitProjectImport);

module.exports = router;
