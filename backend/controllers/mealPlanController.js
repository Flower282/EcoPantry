const { MealPlan, Recipe, Group, GroupMember } = require("../models");

// Helper: get or create a default group for a user
async function getOrCreateUserGroup(user_id) {
  const { v4: uuidv4 } = require("uuid");
  const membership = await GroupMember.findOne({ where: { user_id } });
  if (membership) return membership.group_id;

  const group = await Group.create({
    group_name: "Gia đình của tôi",
    invite_code: uuidv4().slice(0, 8).toUpperCase(),
    user_uuid: user_id,
  });
  await GroupMember.create({ user_id, group_id: group.id });
  return group.id;
}

// GET /api/meal-plans
const getMealPlans = async (req, res) => {
  try {
    const group_id = await getOrCreateUserGroup(req.user.id);
    const plans = await MealPlan.findAll({
      where: { group_id },
      include: [{ model: Recipe }],
      order: [["plan_date", "ASC"]],
    });
    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/meal-plans
const addMealPlan = async (req, res) => {
  try {
    const { recipe_id, plan_date, meal_type } = req.body;
    if (!recipe_id || !plan_date || !meal_type) {
      return res.status(400).json({ error: "recipe_id, plan_date, meal_type are required" });
    }
    const group_id = await getOrCreateUserGroup(req.user.id);
    const plan = await MealPlan.create({
      group_id,
      user_uuid: req.user.id,
      recipe_id,
      plan_date,
      meal_type,
    });
    const planWithRecipe = await MealPlan.findByPk(plan.id, {
      include: [{ model: Recipe }],
    });
    res.status(201).json(planWithRecipe);
  } catch (error) {
    console.error("Error adding meal plan:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/meal-plans/:id
const deleteMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await MealPlan.findByPk(id);
    if (!plan) return res.status(404).json({ error: "Meal plan not found" });
    await plan.destroy();
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getMealPlans, addMealPlan, deleteMealPlan };
