require("dotenv").config();
const { User } = require("../models");
const fs = require("fs");
// const OpenAI = require("openai");

// const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

const getIngredients = async (req, res) => {
  const user_uuid = req.user.id;
  const user = await User.findByPk(user_uuid);

  if (!user) {
    return res.status(404).json({ error: "User not Found" });
  }

  res.status(200).json({ ingredients: user.ingredients });
};

const updateIngredients = async (req, res) => {
  const user_uuid = req.user.id;
  const { ingredients } = req.body;

  const user = await User.findByPk(user_uuid);
  if (!user) {
    return res.status(404).json({ error: "User not Found" });
  }

  await user.update({ ingredients });
  res.status(200).json({ ingredients: user.ingredients });
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
  const user_uuid = req.user.id;
  const file_info = req.files[0];
  const user = await User.findByPk(user_uuid);

  if (!user) {
    return res.status(404).json({ error: "User not Found" });
  }

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
    // await user.update({ ingredients: ingredients.concat(user.ingredients) });
    // const user_updated = await User.findByPk(user_uuid);

    fs.unlink(req.files[0].path, (err) => {
      if (err) throw err;
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
  updateIngredients,
  generateIngredients,
};
