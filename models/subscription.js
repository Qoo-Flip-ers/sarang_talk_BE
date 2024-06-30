"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "Subscription",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subscriptionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expirationDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      lastWordId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Subscription",
      timestamps: true,
      paranoid: true,
    }
  );

  Subscription.associate = function (models) {
    Subscription.belongsTo(models.User, { foreignKey: "userId" });
  };

  return Subscription;
};
