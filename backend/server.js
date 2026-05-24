// Dependencies
// ============================================================================
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectToDb } = require("./utils/database");
require("dotenv").config();

const authRouter = require("./routes/auth");
const recipesRouter = require("./routes/recipes");
const ingredientsRouter = require("./routes/ingredients");
const preferencesRouter = require("./routes/preferences");
const publicRouter = require("./routes/public");
const shoppingListRouter = require("./routes/shoppingList");
const mealPlansRouter = require("./routes/mealPlans");
const db = require("./models");

// Initialise Express
// ============================================================================
const app = express();

// Middleware
// ============================================================================
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// Routes
// ============================================================================
app.use("/api/auth", authRouter);
app.use("/api/ingredients", ingredientsRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/preferences", preferencesRouter);
app.use("/api/public", publicRouter);
app.use("/api/shopping", shoppingListRouter);
app.use("/api/meal-plans", mealPlansRouter);

// Database Connection and Server Start
// ============================================================================
const PORT = process.env.PORT || 6390;

const startServer = async () => {
  if (process.env.NODE_ENV !== "test") {
    try {
      await connectToDb();
      await db.sequelize.sync();
      app.listen(PORT, () => {
        console.log("Listening on Port:", PORT);
      });
    } catch (error) {
      console.error("Unable to start server:", error);
      process.exit(1);
    }
  }
};

startServer();

module.exports = app;
