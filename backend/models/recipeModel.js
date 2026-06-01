module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Recipe",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      instructions: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      ingredients: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      saved: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: [],
      },
      user_uuid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      created_by_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      servings: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      time: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      difficulty: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      calories: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      tags: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      tableName: "recipes",
      underscored: true,
      timestamps: true,
    },
  );
