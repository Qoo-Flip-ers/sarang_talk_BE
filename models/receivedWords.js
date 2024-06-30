"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const ReceivedWords = sequelize.define(
    "ReceivedWords",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      receivedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ReceivedWords",
      timestamps: true, // createdAt과 updatedAt을 자동으로 생성
      paranoid: true, // soft delete 활성화
    }
  );

  ReceivedWords.associate = function (models) {
    ReceivedWords.belongsTo(models.User, { foreignKey: "userId" });
    ReceivedWords.belongsTo(models.Word, { foreignKey: "wordId" });
  };

  return ReceivedWords;
};
