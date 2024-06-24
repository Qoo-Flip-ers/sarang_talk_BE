"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Word extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Word.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      korean: { type: DataTypes.STRING, allowNull: true }, // 한국어
      description: { type: DataTypes.STRING, allowNull: true }, // 설명 (인도네시아어)
      pronunciation: { type: DataTypes.STRING, allowNull: true }, // 발음 (인도네시아어)
      example_1: { type: DataTypes.STRING, allowNull: true }, // 예문 1
      example_2: { type: DataTypes.STRING, allowNull: true }, // 예문 2
      example_3: { type: DataTypes.STRING, allowNull: true }, // 예문 3
      level: { type: DataTypes.INTEGER, allowNull: true },
      type: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: "Word",
      timestamps: true, // createdAt과 updatedAt을 자동으로 생성
    }
  );
  return Word;
};
