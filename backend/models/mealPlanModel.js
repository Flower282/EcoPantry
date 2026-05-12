module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "MealPlan",
    {
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      recipe_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      plan_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      meal_type: {
        type: DataTypes.ENUM("Breakfast", "Lunch", "Dinner", "Snack"),
        allowNull: false,
        defaultValue: "Lunch",
      },
    },
    {
      tableName: "meal_plans",
      underscored: true,
      timestamps: true,
    },
  );
