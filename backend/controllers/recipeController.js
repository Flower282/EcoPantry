const { Op } = require("sequelize");
const { FridgeItem, GroupMember, Recipe, User } = require("../models");
// const OpenAI = require("openai");
require("dotenv").config();

// const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

async function getUserGroupId(user_id) {
  const membership = await GroupMember.findOne({ where: { user_id } });
  return membership?.group_id || null;
}

function normalizeRecipeInput(recipe = {}, user_uuid, user) {
  return {
    title: String(recipe.title || "").trim(),
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
  };
}

function getSavedRecipesForUser(user_uuid) {
  return Recipe.findAll({
    where: {
      saved: {
        [Op.contains]: [user_uuid],
      },
    },
    order: [["createdAt", "DESC"]],
  });
}

function normalizeIngredientName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getIngredientName(ingredient) {
  if (typeof ingredient === "string") return ingredient;
  if (!ingredient || typeof ingredient !== "object") return "";

  return (
    ingredient.name ||
    ingredient.item_name ||
    ingredient.ingredient_name ||
    ingredient.title ||
    ""
  );
}

function getIngredientQuantity(ingredient) {
  if (!ingredient || typeof ingredient !== "object") return null;

  if (ingredient.quantity && ingredient.unit) {
    return `${ingredient.quantity} ${ingredient.unit}`.trim();
  }

  return (
    ingredient.quantity ||
    ingredient.weight ||
    ingredient.amount ||
    ingredient.khoi_luong ||
    ingredient["khối lượng"] ||
    null
  );
}

function ingredientMatches(available, required) {
  if (!available || !required) return false;
  return available === required || available.includes(required) || required.includes(available);
}

function shouldUseFoodRecommendationApi() {
  return Boolean(process.env.FOOD_RECOMMENDATION_API_URL) && process.env.NODE_ENV !== "test";
}

function mapExternalDish(dish) {
  const ingredientMatches = Array.isArray(dish.ingredient_matches)
    ? dish.ingredient_matches
    : [];
  const matchedIngredients = ingredientMatches
    .filter((ingredient) => ingredient.stock_name)
    .map((ingredient) => ingredient.ingredient_name);
  const missingIngredients = ingredientMatches
    .filter((ingredient) => !ingredient.stock_name)
    .map((ingredient) => ingredient.ingredient_name);

  return {
    id: dish.dish_name,
    title: dish.dish_name,
    source: "food-recommendation-api",
    matchScore: Number(dish.score || 0),
    canCook: Number(dish.missing_required || 0) === 0,
    dishType: dish.dish_type || "",
    instructions: Array.isArray(dish.instructions)
      ? dish.instructions.join("\n")
      : String(dish.instructions || "").trim(),
    time: dish.time || "",
    servings: dish.servings || "",
    difficulty: dish.difficulty || "",
    matchedIngredients,
    missingIngredients,
    ingredientMatches,
  };
}

async function suggestRecipesFromFoodApi(rawIngredients, limit, filters = {}) {
  const baseUrl = process.env.FOOD_RECOMMENDATION_API_URL.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const ingredients = rawIngredients
    .map((ingredient) => {
      const name = getIngredientName(ingredient);
      if (!name) return null;
      return {
        name,
        quantity: getIngredientQuantity(ingredient),
      };
    })
    .filter(Boolean);

  try {
    console.log(
      `Calling food recommendation API: ${baseUrl}/recommend with ${ingredients.length} ingredients`,
    );

    const response = await fetch(`${baseUrl}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients,
        top_k: limit,
        max_dishes: Math.min(limit, 3),
        dish_type_filter: filters.dish_type_filter,
        required_types: filters.required_types,
        max_minutes: filters.max_minutes,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Food API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `Food recommendation API returned ${(data.top_dishes || []).length} top dishes`,
    );

    return {
      ingredients: ingredients.map((ingredient) => ingredient.name),
      dishes: (data.top_dishes || []).slice(0, limit).map(mapExternalDish),
      mealSet: (data.meal_set || []).map(mapExternalDish),
      source: "food-recommendation-api",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildRecipeSuggestion(recipe, availableIngredients) {
  const recipeJson = typeof recipe.toJSON === "function" ? recipe.toJSON() : recipe;
  const recipeIngredients = Array.isArray(recipeJson.ingredients) ? recipeJson.ingredients : [];
  const requiredIngredients = recipeIngredients
    .map((ingredient) => {
      const name = getIngredientName(ingredient);
      return {
        name,
        normalizedName: normalizeIngredientName(name),
      };
    })
    .filter((ingredient) => ingredient.normalizedName);

  if (!requiredIngredients.length) return null;

  const matchedIngredients = [];
  const missingIngredients = [];

  requiredIngredients.forEach((required) => {
    const matched = availableIngredients.some((available) =>
      ingredientMatches(available.normalizedName, required.normalizedName),
    );

    if (matched) {
      matchedIngredients.push(required.name);
    } else {
      missingIngredients.push(required.name);
    }
  });

  const matchCount = matchedIngredients.length;
  if (matchCount === 0) return null;

  const matchScore = Number((matchCount / requiredIngredients.length).toFixed(2));

  return {
    ...recipeJson,
    source: "ecopantry-db",
    matchScore,
    canCook: missingIngredients.length === 0,
    matchedIngredients,
    missingIngredients,
  };
}

const suggestRecipes = async (req, res) => {
  try {
    const rawIngredients = Array.isArray(req.body)
      ? req.body
      : req.body.ingredients || req.body.availableIngredients;

    if (!Array.isArray(rawIngredients)) {
      return res.status(400).json({
        error: "ingredients must be an array of names or ingredient objects",
      });
    }

    const availableIngredients = rawIngredients
      .map((ingredient) => {
        const name = getIngredientName(ingredient);
        return {
          name,
          normalizedName: normalizeIngredientName(name),
        };
      })
      .filter((ingredient) => ingredient.normalizedName);

    if (!availableIngredients.length) {
      return res.status(400).json({
        error: "ingredients must contain at least one valid ingredient name",
      });
    }

    const limit = Math.min(Math.max(Number(req.body.limit) || 10, 1), 50);
    const foodApiFilters = {
      dish_type_filter:
        typeof req.body.dish_type_filter === "string" && req.body.dish_type_filter.trim()
          ? req.body.dish_type_filter.trim()
          : undefined,
      required_types: Array.isArray(req.body.required_types)
        ? req.body.required_types
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        : undefined,
      max_minutes:
        Number.isFinite(Number(req.body.max_minutes)) && Number(req.body.max_minutes) > 0
          ? Number(req.body.max_minutes)
          : undefined,
    };
    console.log(`POST /recipes/suggest received ${availableIngredients.length} ingredients`);

    if (shouldUseFoodRecommendationApi()) {
      try {
        const externalSuggestions = await suggestRecipesFromFoodApi(
          rawIngredients,
          limit,
          foodApiFilters,
        );
        return res.status(200).json(externalSuggestions);
      } catch (externalError) {
        console.warn(
          "Food recommendation API unavailable, falling back to EcoPantry recipes:",
          externalError.message,
        );
      }
    }

    const recipes = await Recipe.findAll({ order: [["createdAt", "DESC"]] });
    const suggestions = recipes
      .map((recipe) => buildRecipeSuggestion(recipe, availableIngredients))
      .filter(Boolean)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if (b.matchedIngredients.length !== a.matchedIngredients.length) {
          return b.matchedIngredients.length - a.matchedIngredients.length;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);

    res.status(200).json({
      ingredients: availableIngredients.map((ingredient) => ingredient.name),
      dishes: suggestions,
      source: "ecopantry-db",
    });
  } catch (error) {
    console.error("Error suggesting recipes:", error);
    res.status(500).json({ error: error.message });
  }
};

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
  suggestRecipes,
  generateRecipes,
  deleteRecipe,
  saveRecipe,
  checkSavedStatus,
};
