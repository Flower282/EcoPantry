module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "FridgeItem",
    {
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_uuid: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      expiry_date: {
        type: DataTypes.DATE,
        allowNull: true,
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
      storage: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "dry",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
    },
    {
      tableName: "fridge_items",
      underscored: true,
      timestamps: true,
    },
  );
