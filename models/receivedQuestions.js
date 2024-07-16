"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const ReceivedQuestions = sequelize.define(
    "ReceivedQuestions",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      questionId: {
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
      modelName: "ReceivedQuestions",
      timestamps: true, // createdAt과 updatedAt을 자동으로 생성
      paranoid: true, // soft delete 활성화
    }
  );

  ReceivedQuestions.associate = function (models) {
    ReceivedQuestions.belongsTo(models.User, { foreignKey: "userId" });
    ReceivedQuestions.belongsTo(models.Question, { foreignKey: "questionId" });
  };

  return ReceivedQuestions;
};
