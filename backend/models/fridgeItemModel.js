module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "FridgeItem",
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
      expiry_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "fridge_items",
      underscored: true,
      timestamps: true,
    },
  );
