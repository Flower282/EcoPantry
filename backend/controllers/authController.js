const { User } = require("../models");
const jwt = require("jsonwebtoken");

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user.id);
    res.status(200).json({ email, token, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const signupUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.signup(email, password);
    const token = createToken(user.id);
    res.status(200).json({ email, token, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { signupUser, loginUser };
