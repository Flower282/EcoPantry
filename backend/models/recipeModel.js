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
    },
    {
      tableName: "recipes",
      underscored: true,
      timestamps: true,
    },
  );
