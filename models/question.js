"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define(
    "Question",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      answer: { type: DataTypes.STRING, allowNull: true },
      explanation: { type: DataTypes.TEXT, allowNull: true }, // 예문 1
      example_1: { type: DataTypes.STRING, allowNull: true }, // 예문 2
      example_2: { type: DataTypes.STRING, allowNull: true }, // 예문 3
      example_3: { type: DataTypes.STRING, allowNull: true }, // 예문 3
      example_4: { type: DataTypes.STRING, allowNull: true }, // 예문 4
      type: { type: DataTypes.STRING, allowNull: true }, // 카테고리 구분
      level: { type: DataTypes.INTEGER, allowNull: true },
      imageUrl: { type: DataTypes.STRING, allowNull: true }, // 이미지 URL
    },
    {
      sequelize,
      modelName: "Question",
      timestamps: true, // createdAt과 updatedAt을 자동으로 생성
      paranoid: true, // soft delete 활성화
    }
  );
  return Question;
};
