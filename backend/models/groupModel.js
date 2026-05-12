module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Group",
    {
      group_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      invite_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "groups",
      underscored: true,
      timestamps: true,
    },
  );
