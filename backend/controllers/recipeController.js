const { Op } = require("sequelize");
const { FridgeItem, GroupMember, Recipe, User } = require("../models");
// const OpenAI = require("openai");
require("dotenv").config();

// const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

async function getUserGroupId(user_id) {
  const membership = await GroupMember.findOne({ where: { user_id } });
  return membership?.group_id || null;
}

const getRecipes = async (req, res) => {
  const user_uuid = req.user.id;
  const recipes = await Recipe.findAll({
    where: {
      saved: {
        [Op.contains]: [user_uuid],
      },
    },
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json(recipes);
};

const getCommunityRecipes = async (req, res) => {
  const user_uuid = req.user.id;

  try {
    const recipes = await Recipe.findAll({
      order: [["createdAt", "DESC"]],
    });

    const communityRecipes = recipes.filter((recipe) => {
      const saved = Array.isArray(recipe.saved) ? recipe.saved : [];
      return !saved.includes(user_uuid);
    });

    res.status(200).json(communityRecipes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getRecipe = async (req, res) => {
  const recipe_id = req.params.id;
  const recipe = await Recipe.findByPk(recipe_id);

  if (!recipe) {
    return res.status(404).json({ error: "No such recipe" });
  }

  res.status(200).json(recipe);
};

const addRecipe = async (req, res) => {
  const { recipe } = req.body;
  const user_uuid = req.user.id;

  try {
    if (!recipe || !recipe.title) {
      return res.status(400).json({ error: "Recipe title is required" });
    }

    const user = await User.findByPk(user_uuid);
    await Recipe.create({
      ...recipe,
      title: recipe.title.trim(),
      instructions: recipe.instructions?.trim() || "Chưa có hướng dẫn",
      image_url: recipe.image_url || "",
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      servings: recipe.servings || "",
      time: recipe.time || "",
      difficulty: recipe.difficulty || "",
      calories: recipe.calories || "",
      tags: Array.isArray(recipe.tags) ? recipe.tags : [],
      user_uuid,
      created_by_name: recipe.created_by_name || user?.name || "",
      saved: Array.from(new Set([...(recipe.saved || []), user_uuid])),
    });
    const recipes = await Recipe.findAll({
      where: {
        saved: {
          [Op.contains]: [user_uuid],
        },
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(recipes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const saveRecipe = async (req, res) => {
  const { recipe_id } = req.body;
  const user_uuid = req.user.id;

  try {
    const recipe = await Recipe.findByPk(recipe_id);
    if (!recipe) {
      return res.status(404).json({ error: "No such recipe" });
    }

    if (recipe.saved.includes(user_uuid)) {
      return res.status(404).json({ error: "Recipe already Saved" });
    }

    const newSaved = [...recipe.saved, user_uuid];
    await recipe.update({ saved: newSaved });

    const recipes = await Recipe.findAll({
      where: {
        saved: {
          [Op.contains]: [user_uuid],
        },
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(recipes);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const checkSavedStatus = async (req, res) => {
  const { recipe_id } = req.body;
  const user_uuid = req.user.id;

  try {
    const recipe = await Recipe.findByPk(recipe_id);
    if (!recipe) {
      return res.status(404).json({ error: "No such recipe" });
    }

    const saved = recipe.saved.includes(user_uuid);
    res.status(200).json({ saved });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const generateRecipes = async (req, res) => {
  const user_uuid = req.user.id;
  const { prompt } = req.body;

  try {
    const user = await User.findByPk(user_uuid);
    if (!user) {
      return res.status(404).send("No user found");
    }

    const group_id = await getUserGroupId(user_uuid);
    let userIngredients = group_id ? await FridgeItem.findAll({ where: { group_id } }) : [];
    let userPreferences = user.dietary_preferences || "";

    if (!userIngredients.length) {
      return res.status(404).send("No ingredients found for this user");
    }

    let ingredientString = "Ingredients: ";
    ingredientString += userIngredients
      .map((ingredient) => {
        const unitPart = ingredient.unit
          ? `${ingredient.quantity} ${ingredient.unit} of `
          : `${ingredient.quantity} `;
        return `${unitPart}${ingredient.item_name} (Notes: ${ingredient.notes || ""})`;
      })
      .join(", ");

    console.log("Generating Recipes for User " + user_uuid);

    // OpenAI recipe generation has been disabled.
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
    //           text: `Here is a list of ingredients that I have available at home...`,
    //         },
    //       ],
    //     },
    //   ],
    // });

    return res
      .status(501)
      .json({ error: "Recipe generation via OpenAI is disabled." });
  } catch (error) {
    console.error("Error generating recipes:", error);
    res.status(500).send("Error generating recipes");
  }
};

const deleteRecipe = async (req, res) => {
  const user_uuid = req.user.id;
  const { id } = req.params;

  try {
    const recipe = await Recipe.findByPk(id);
    if (!recipe) {
      return res.status(404).json({ error: "No such recipe" });
    }

    const newSaved = recipe.saved.filter((value) => value !== user_uuid);
    if (newSaved.length === recipe.saved.length) {
      return res.status(404).json({ error: "No such saved recipe for user" });
    }

    await recipe.update({ saved: newSaved });

    const recipes = await Recipe.findAll({
      where: {
        saved: {
          [Op.contains]: [user_uuid],
        },
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(recipes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getRecipes,
  getCommunityRecipes,
  getRecipe,
  addRecipe,
  generateRecipes,
  deleteRecipe,
  saveRecipe,
  checkSavedStatus,
};
