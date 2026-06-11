require("dotenv").config();
const { FridgeItem, Group, GroupMember, User } = require("../models");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
// const OpenAI = require("openai");

// const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

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

function toDateString(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN");
}

function daysUntil(date) {
  if (!date) return 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(date);
  expiry.setHours(0, 0, 0, 0);

  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
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
    category: item.category || "Thực phẩm khô",
    quantity: item.quantity ?? 1,
    unit: item.unit || "",
    emoji: item.emoji || "🛒",
    storage: item.storage || "dry",
    daysLeft,
    expiryDate: toDateString(item.expiry_date),
    addedDate: toDateString(item.createdAt),
    status: statusFromDaysLeft(daysLeft),
    notes: item.notes || "",
  };
}

function toFridgeItem(ingredient, group_id, user_uuid) {
  const daysLeft = Number(ingredient.daysLeft ?? 30);

  return {
    group_id,
    user_uuid,
    item_name: ingredient.name,
    quantity: Number(ingredient.quantity) || 1,
    unit: ingredient.unit || "",
    expiry_date: new Date(Date.now() + daysLeft * 86400000),
    category: ingredient.category || "Thực phẩm khô",
    emoji: ingredient.emoji || "🛒",
    storage: ingredient.storage || "dry",
    notes: ingredient.notes || "",
  };
}

async function getGroupItem(req, id) {
  const group_id = await getOrCreateUserGroup(req.user.id);
  const item = await FridgeItem.findOne({ where: { id, group_id } });
  return { group_id, item };
}

const getIngredients = async (req, res) => {
  try {
    const group_id = await getOrCreateUserGroup(req.user.id);
    let items = await FridgeItem.findAll({
      where: { group_id },
      order: [["createdAt", "DESC"]],
    });

    if (items.length === 0) {
      const user = await User.findByPk(req.user.id);
      const legacyIngredients = Array.isArray(user?.ingredients) ? user.ingredients : [];
      if (legacyIngredients.length > 0) {
        items = await FridgeItem.bulkCreate(
          legacyIngredients.map((ingredient) => toFridgeItem(ingredient, group_id, req.user.id)),
          { returning: true },
        );
      }
    }

    res.status(200).json({ ingredients: items.map(toIngredient) });
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ error: error.message });
  }
};

const addIngredient = async (req, res) => {
  try {
    const user_uuid = req.user.id;
    const group_id = await getOrCreateUserGroup(user_uuid);
    const ingredient = req.body.ingredient || req.body;

    if (!ingredient.name || !String(ingredient.name).trim()) {
      return res.status(400).json({ error: "Ingredient name is required" });
    }

    const created = await FridgeItem.create(toFridgeItem(ingredient, group_id, user_uuid));
    res.status(201).json({ ingredient: toIngredient(created) });
  } catch (error) {
    console.error("Error adding ingredient:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateIngredient = async (req, res) => {
  try {
    const ingredient = req.body.ingredient || req.body;
    const { group_id, item } = await getGroupItem(req, req.params.id);

    if (!item) {
      return res.status(404).json({ error: "No such ingredient" });
    }

    if (!ingredient.name || !String(ingredient.name).trim()) {
      return res.status(400).json({ error: "Ingredient name is required" });
    }

    await item.update(toFridgeItem(ingredient, group_id, req.user.id));
    res.status(200).json({ ingredient: toIngredient(item) });
  } catch (error) {
    console.error("Error updating ingredient:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteIngredient = async (req, res) => {
  try {
    const { item } = await getGroupItem(req, req.params.id);

    if (!item) {
      return res.status(404).json({ error: "No such ingredient" });
    }

    await item.destroy();
    res.status(200).json({ id: String(req.params.id) });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateIngredients = async (req, res) => {
  try {
    const user_uuid = req.user.id;
    const { ingredients } = req.body;
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ error: "ingredients must be an array" });
    }

    const group_id = await getOrCreateUserGroup(user_uuid);
    await FridgeItem.destroy({ where: { group_id } });

    const created = await FridgeItem.bulkCreate(
      ingredients.map((ingredient) => toFridgeItem(ingredient, group_id, user_uuid)),
      { returning: true },
    );

    res.status(200).json({ ingredients: created.map(toIngredient) });
  } catch (error) {
    console.error("Error updating ingredients:", error);
    res.status(500).json({ error: error.message });
  }
};

function convertImageToBase64(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString("base64"));
      }
    });
  });
}

const generateIngredients = async (req, res) => {
  const file_info = req.files[0];

  try {
    const base64Image = await convertImageToBase64(file_info.path);
    // OpenAI ingredient generation has been disabled.
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4o",
    //   response_format: {
    //     type: "json_object",
    //   },
    //   messages: [
    //     {
    //       role: "user",
    //       content: [
    //         {
    //           type: "text",
    //           text: `This is an image of a fridge, cupboard, or pantry. Please list the ingredients you see...`,
    //         },
    //         {
    //           type: "image_url",
    //           image_url: {
    //             url: "data:" + file_info.mimetype + ";base64," + base64Image,
    //           },
    //         },
    //       ],
    //     },
    //   ],
    // });

    // const ingredients = JSON.parse(response.choices[0].message.content).items;
    // Persist generated items to fridge_items here if this route is re-enabled.
    // const user_updated = await User.findByPk(user_uuid);

    fs.unlink(req.files[0].path, (err) => {
      if (err) {
        console.error("Unable to delete temp file:", err);
        return;
      }
      console.log("temp file was deleted");
    });

    return res
      .status(501)
      .json({ error: "Ingredient generation via OpenAI is disabled." });
  } catch (error) {
    console.error("Error generating ingredients:", error);
    res.status(500).send("Error generating ingredients");
  }
};

module.exports = {
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  updateIngredients,
  generateIngredients,
};
