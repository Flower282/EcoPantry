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
      user_uuid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "groups",
      underscored: true,
      timestamps: true,
    },
  );
