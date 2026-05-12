const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "ecopantry",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "123456",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 54321,
    dialect: "postgres",
    logging: false,
    dialectOptions:
      process.env.NODE_ENV === "production"
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
  },
);

const connectToDb = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to Database!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
};

const closeDb = async () => {
  await sequelize.close();
};

const getDb = () => {
  return sequelize;
};

module.exports = {
  sequelize,
  connectToDb,
  closeDb,
  getDb,
};
