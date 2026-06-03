const { FridgeItem, GroupMember, MealPlan, Recipe, ShoppingList, User } = require("../models");

async function getUserGroupId(user_id) {
  const membership = await GroupMember.findOne({ where: { user_id } });
  return membership?.group_id || null;
}

const getSummary = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not Found" });

    const group_id = await getUserGroupId(req.user.id);
    const ingredients = group_id ? await FridgeItem.findAll({ where: { group_id } }) : [];
    const shoppingItems = group_id ? await ShoppingList.findAll({ where: { group_id } }) : [];
    const mealPlans = group_id ? await MealPlan.findAll({ where: { group_id } }) : [];
    const savedRecipes = await Recipe.count();

    const categoryCounts = ingredients.reduce((acc, item) => {
      const category = item.category || "Khác";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const storageCounts = ingredients.reduce((acc, item) => {
      const storage = item.storage || "dry";
      acc[storage] = (acc[storage] || 0) + 1;
      return acc;
    }, {});

    const daysUntil = (date) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    const expiringSoon = ingredients.filter((item) => {
      const daysLeft = daysUntil(item.expiry_date);
      return daysLeft >= 0 && daysLeft <= 3;
    });
    const expired = ingredients.filter((item) => daysUntil(item.expiry_date) < 0);

    res.status(200).json({
      inventory: {
        total: ingredients.length,
        expiringSoon: expiringSoon.length,
        expired: expired.length,
        categoryCounts,
        storageCounts,
      },
      shopping: {
        total: shoppingItems.length,
        purchased: shoppingItems.filter((item) => item.is_purchased).length,
        pending: shoppingItems.filter((item) => !item.is_purchased).length,
        categoryCounts: shoppingItems.reduce((acc, item) => {
          const category = item.category || "Khác";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
      },
      meals: {
        planned: mealPlans.length,
        savedRecipes,
      },
      waste: {
        expiredItems: expired.length,
      },
    });
  } catch (error) {
    console.error("Error building report summary:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSummary,
};
