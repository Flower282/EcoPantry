const express = require("express");
const { getMealPlans, addMealPlan, deleteMealPlan } = require("../controllers/mealPlanController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

router.get("/", getMealPlans);
router.post("/", addMealPlan);
router.delete("/:id", deleteMealPlan);

module.exports = router;
