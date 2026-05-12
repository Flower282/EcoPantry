require("dotenv").config();
const { User } = require("../models");

const getPreferences = async (req, res) => {
  const user_uuid = req.user.id;
  const user = await User.findByPk(user_uuid);

  if (!user) {
    return res.status(404).json({ error: "User not Found" });
  }

  res.status(200).json({ preferences: user.dietary_preferences });
};

const setPreferences = async (req, res) => {
  const user_uuid = req.user.id;
  const { preferences } = req.body;
  const user = await User.findByPk(user_uuid);

  if (!user) {
    return res.status(404).json({ error: "User not Found" });
  }

  await user.update({ dietary_preferences: preferences });
  res.status(200).json({ preferences: user.dietary_preferences });
};

const getName = async (req, res) => {
  const user_uuid = req.user.id;
  const user = await User.findByPk(user_uuid);

  if (!user) {
    return res.status(404).json({ error: "User not Found" });
  }

  res.status(200).json({ name: user.name });
};

const setName = async (req, res) => {
  const user_uuid = req.user.id;
  const { name } = req.body;
  const user = await User.findByPk(user_uuid);

  if (!user) {
    return res.status(404).json({ error: "User not Found" });
  }

  await user.update({ name });
  res.status(200).json({ name: user.name });
};

module.exports = {
  getPreferences,
  setPreferences,
  setName,
  getName,
};
