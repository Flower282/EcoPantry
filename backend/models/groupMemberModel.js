module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "GroupMember",
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("Admin", "Member"),
        allowNull: false,
        defaultValue: "Member",
      },
    },
    {
      tableName: "group_members",
      underscored: true,
      timestamps: true,
    },
  );
