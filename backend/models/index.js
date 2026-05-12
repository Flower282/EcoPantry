const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../utils/database");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./userModel")(sequelize, DataTypes);
db.Group = require("./groupModel")(sequelize, DataTypes);
db.GroupMember = require("./groupMemberModel")(sequelize, DataTypes);
db.FridgeItem = require("./fridgeItemModel")(sequelize, DataTypes);
db.MealPlan = require("./mealPlanModel")(sequelize, DataTypes);
db.ShoppingList = require("./shoppingListModel")(sequelize, DataTypes);
db.Recipe = require("./recipeModel")(sequelize, DataTypes);
db.RecipeIngredient = require("./recipeIngredientModel")(sequelize, DataTypes);

// Associations

db.User.belongsToMany(db.Group, {
  through: db.GroupMember,
  foreignKey: "user_id",
  otherKey: "group_id",
  as: "groups",
});
db.Group.belongsToMany(db.User, {
  through: db.GroupMember,
  foreignKey: "group_id",
  otherKey: "user_id",
  as: "members",
});
db.GroupMember.belongsTo(db.User, { foreignKey: "user_id" });
db.GroupMember.belongsTo(db.Group, { foreignKey: "group_id" });
db.User.hasMany(db.GroupMember, { foreignKey: "user_id" });
db.Group.hasMany(db.GroupMember, { foreignKey: "group_id" });

db.FridgeItem.belongsTo(db.Group, { foreignKey: "group_id" });
db.Group.hasMany(db.FridgeItem, { foreignKey: "group_id" });

db.MealPlan.belongsTo(db.Group, { foreignKey: "group_id" });
db.Group.hasMany(db.MealPlan, { foreignKey: "group_id" });
db.MealPlan.belongsTo(db.Recipe, { foreignKey: "recipe_id" });
db.Recipe.hasMany(db.MealPlan, { foreignKey: "recipe_id" });

db.ShoppingList.belongsTo(db.Group, { foreignKey: "group_id" });
db.Group.hasMany(db.ShoppingList, { foreignKey: "group_id" });
db.ShoppingList.belongsTo(db.User, { foreignKey: "updated_by", as: "updatedBy" });
db.User.hasMany(db.ShoppingList, { foreignKey: "updated_by", as: "updatedLists" });

db.Recipe.belongsTo(db.User, { foreignKey: "user_uuid", as: "creator" });
db.User.hasMany(db.Recipe, { foreignKey: "user_uuid", as: "recipes" });

db.RecipeIngredient.belongsTo(db.Recipe, { foreignKey: "recipe_id" });
db.Recipe.hasMany(db.RecipeIngredient, { foreignKey: "recipe_id" });

module.exports = db;
