const express = require("express");
const {
  getCurrentGroup,
  createGroup,
  updateCurrentGroup,
  joinGroup,
} = require("../controllers/groupController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

router.get("/current", getCurrentGroup);
router.patch("/current", updateCurrentGroup);
router.post("/current", updateCurrentGroup);
router.post("/", createGroup);
router.post("/join", joinGroup);

module.exports = router;
