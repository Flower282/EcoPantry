const { FridgeItem, ShoppingList, Group, GroupMember, User } = require("../models");
const { v4: uuidv4 } = require("uuid");

const shoppingCategories = ["Rau củ", "Thịt cá", "Thực phẩm khô", "Gia vị"];

function normalizeShoppingCategory(category) {
  return shoppingCategories.includes(category) ? category : "Thực phẩm khô";
}

async function getOrCreateUserGroup(user_id) {
  const membership = await GroupMember.findOne({ where: { user_id } });
  if (membership) return membership.group_id;

  const group = await Group.create({
    group_name: "Gia đình của tôi",
    invite_code: uuidv4().slice(0, 8).toUpperCase(),
    user_uuid: user_id,
  });

  await GroupMember.create({ user_id, group_id: group.id, role: "Admin" });
  return group.id;
}

function daysUntil(date) {
  if (!date) return 30;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function statusFromDaysLeft(daysLeft) {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 3) return "expiring";
  return "fresh";
}

function toIngredient(item) {
  const daysLeft = daysUntil(item.expiry_date);

  return {
    id: String(item.id),
    name: item.item_name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    emoji: item.emoji,
    storage: item.storage,
    daysLeft,
    expiryDate: new Date(item.expiry_date).toLocaleDateString("vi-VN"),
    addedDate: new Date(item.createdAt).toLocaleDateString("vi-VN"),
    status: statusFromDaysLeft(daysLeft),
    notes: item.notes,
  };
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
      category: normalizeShoppingCategory(category),
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

    const newIngredients = purchasedItems.map((item) => {
      const category = normalizeShoppingCategory(item.category);
      const storage = category === "Thịt cá" || category === "Rau củ" ? "cold" : "dry";
      const daysLeft = category === "Thịt cá" ? 3 : category === "Rau củ" ? 7 : 30;

      return {
        group_id,
        user_uuid: req.user.id,
        item_name: item.item_name,
        quantity: item.quantity || 1,
        unit: item.unit || "",
        expiry_date: new Date(Date.now() + daysLeft * 86400000),
        category,
        emoji: item.emoji || "🛒",
        storage,
        notes: "Tự động thêm từ danh sách đi chợ",
      };
    });

    const createdIngredients = await FridgeItem.bulkCreate(newIngredients, { returning: true });
    await ShoppingList.destroy({ where: { group_id, is_purchased: true } });

    res.status(200).json({
      message: "Cleared purchased items",
      transferred: createdIngredients.length,
      ingredients: createdIngredients.map(toIngredient),
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
