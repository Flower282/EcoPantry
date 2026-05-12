module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "RecipeIngredient",
    {
      recipe_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ingredient_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
    },
    {
      tableName: "recipe_ingredients",
      underscored: true,
      timestamps: true,
    },
  );
