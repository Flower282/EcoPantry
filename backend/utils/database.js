const { Sequelize } = require("sequelize");
require("dotenv").config();

const isProduction = ["production", "prod"].includes(process.env.NODE_ENV);

const getDbCaFromEnv = () => {
  const base64 = process.env.DB_CA_BASE64;
  if (!base64) return null;

  const normalized = base64.replace(/\s+/g, "");
  const decoded = Buffer.from(normalized, "base64").toString("ascii");

  if (!decoded.includes("BEGIN CERTIFICATE")) {
    throw new Error(
      "DB_CA_BASE64 decoded value does not look like a PEM certificate",
    );
  }

  return decoded;
};

const dbCa = getDbCaFromEnv();

const parseDbUrl = (dbUrl) => {
  const url = new URL(dbUrl);

  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    database: url.pathname.replace(/^\//, ""),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
};

const shouldUseSsl = isProduction || Boolean(dbCa);

const commonOptions = {
  dialect: "postgres",
  logging: false,
  pool: {
    max: Number(process.env.DB_POOL_MAX || 2),
    min: Number(process.env.DB_POOL_MIN || 0),
    acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
    idle: Number(process.env.DB_POOL_IDLE || 10000),
  },
  dialectOptions: shouldUseSsl
    ? {
        ssl: dbCa
          ? {
              rejectUnauthorized: true,
              ca: dbCa,
            }
          : { rejectUnauthorized: false },
      }
    : {},
};

const sequelize = process.env.DB_URL
  ? (() => {
      const parsed = parseDbUrl(process.env.DB_URL);
      return new Sequelize(parsed.database, parsed.user, parsed.password, {
        ...commonOptions,
        host: parsed.host,
        port: parsed.port,
      });
    })()
  : new Sequelize(
      process.env.DB_NAME || "ecopantry",
      process.env.DB_USER || "postgres",
      process.env.DB_PASSWORD || "123456",
      {
        ...commonOptions,
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT) || 54321,
      },
    );

const ensureFridgeItemColumns = async () => {
  await sequelize.query(`
    ALTER TABLE IF EXISTS fridge_items
      ADD COLUMN IF NOT EXISTS category VARCHAR(255) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS emoji VARCHAR(255) NOT NULL DEFAULT '🛒',
      ADD COLUMN IF NOT EXISTS storage VARCHAR(255) NOT NULL DEFAULT 'dry',
      ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
  `);
};

const connectToDb = async () => {
  try {
    await sequelize.authenticate();
    await ensureFridgeItemColumns();
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
