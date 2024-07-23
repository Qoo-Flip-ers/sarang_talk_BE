"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: true },
      phoneNumber: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false, default: "active" },
      code: { type: DataTypes.STRING, allowNull: true },
      chatId: { type: DataTypes.STRING, allowNull: true },
      codeGeneratedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true, // createdAt과 updatedAt을 자동으로 생성
      paranoid: true, // soft delete 활성화
    }
  );

  User.associate = function (models) {
    User.hasMany(models.Subscription, {
      foreignKey: "userId",
      sourceKey: "id",
    });
  };

  return User;
};
