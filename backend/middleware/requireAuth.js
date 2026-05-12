const jwt = require("jsonwebtoken");
const { User } = require("../models");

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorization Token Required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(id, { attributes: ["id"] });
    if (!user) {
      return res.status(401).json({ error: "Request is not Authorized" });
    }

    req.user = { id: user.id };
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Request is not Authorized" });
  }
};

module.exports = requireAuth;
