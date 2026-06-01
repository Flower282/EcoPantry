const { ShoppingList, Group, GroupMember, User } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Helper: get or create a default group for a user
async function getOrCreateUserGroup(user_id) {
  // Find existing group membership
  const membership = await GroupMember.findOne({ where: { user_id } });
  if (membership) return membership.group_id;

  // Create a default personal group
  const group = await Group.create({
    group_name: "Gia đình của tôi",
    invite_code: uuidv4().slice(0, 8).toUpperCase(),
    user_uuid: user_id,
  });

  await GroupMember.create({ user_id, group_id: group.id });
  return group.id;
}

// GET /api/shopping
const getShoppingList = async (req, res) => {
  try {
    const group_id = await getOrCreateUserGroup(req.user.id);
    const items = await ShoppingList.findAll({
      where: { group_id },
      include: [{ model: User, as: "updatedBy", attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching shopping list:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/shopping
const addShoppingItem = async (req, res) => {
  try {
    const { item_name, quantity, unit, category, emoji } = req.body;
    if (!item_name) return res.status(400).json({ error: "item_name is required" });

    const group_id = await getOrCreateUserGroup(req.user.id);
    const item = await ShoppingList.create({
      group_id,
      user_uuid: req.user.id,
      item_name,
      quantity: quantity || 1,
      unit: unit || "",
      category: category || "",
      emoji: emoji || "🛒",
      is_purchased: false,
      updated_by: req.user.id,
    });
    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding shopping item:", error);
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/shopping/:id/toggle
const toggleShoppingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ShoppingList.findByPk(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    await item.update({
      is_purchased: !item.is_purchased,
      updated_by: req.user.id,
    });
    res.status(200).json(item);
  } catch (error) {
    console.error("Error toggling shopping item:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/shopping/:id
const deleteShoppingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ShoppingList.findByPk(id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    await item.destroy();
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting shopping item:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/shopping/clear-purchased
const clearPurchasedItems = async (req, res) => {
  try {
    const group_id = await getOrCreateUserGroup(req.user.id);
    const purchasedItems = await ShoppingList.findAll({
      where: { group_id, is_purchased: true },
      order: [["updatedAt", "DESC"]],
    });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not Found" });

    const existingIngredients = Array.isArray(user.ingredients) ? user.ingredients : [];
    const newIngredients = purchasedItems.map((item) => ({
      id: `shopping_${item.id}_${Date.now()}`,
      name: item.item_name,
      category: item.category || "Thực phẩm khô",
      quantity: String(item.quantity || 1),
      unit: item.unit || "",
      emoji: item.emoji || "🛒",
      storage: item.category === "Thịt cá" || item.category === "Rau củ" ? "cold" : "dry",
      daysLeft: item.category === "Thịt cá" ? 3 : item.category === "Rau củ" ? 7 : 30,
      expiryDate: new Date(
        Date.now() + (item.category === "Thịt cá" ? 3 : item.category === "Rau củ" ? 7 : 30) * 86400000,
      ).toLocaleDateString("vi-VN"),
      addedDate: new Date().toLocaleDateString("vi-VN"),
      status: "fresh",
      notes: "Tự động thêm từ danh sách đi chợ",
    }));

    await user.update({ ingredients: [...newIngredients, ...existingIngredients] });
    await ShoppingList.destroy({ where: { group_id, is_purchased: true } });
    res.status(200).json({
      message: "Cleared purchased items",
      transferred: newIngredients.length,
      ingredients: user.ingredients,
    });
  } catch (error) {
    console.error("Error clearing purchased items:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getShoppingList,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  clearPurchasedItems,
};
