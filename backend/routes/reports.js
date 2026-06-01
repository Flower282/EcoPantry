const express = require("express");
const { getSummary } = require("../controllers/reportController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

router.get("/summary", getSummary);

module.exports = router;
