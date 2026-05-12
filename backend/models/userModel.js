const bcrypt = require("bcryptjs");
const validator = require("validator");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dietary_preferences: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      ingredients: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true,
    },
  );

  User.signup = async function (email, password, name = "") {
    if (!email || !password) {
      throw Error("Email and password are required");
    }

    if (!validator.isEmail(email)) {
      throw Error("Invalid email address");
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      throw Error("Email already in use");
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    return User.create({
      name: name || email.split("@")[0],
      email,
      password_hash,
    });
  };

  User.login = async function (email, password) {
    if (!email || !password) {
      throw Error("Email and password are required");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw Error("Incorrect email or password");
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw Error("Incorrect email or password");
    }

    return user;
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  return User;
};
