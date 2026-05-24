module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "ShoppingList",
    {
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      item_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      is_purchased: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      emoji: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "🛒",
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "shopping_list",
      underscored: true,
      timestamps: true,
    },
  );
