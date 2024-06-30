"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ReceivedWords 테이블 생성
    await queryInterface.createTable("ReceivedWords", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      wordId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      receivedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
    // ReceivedQuestions 테이블 생성
    await queryInterface.createTable("ReceivedQuestions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      receivedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Subscription 테이블에 새로운 컬럼 추가
    await queryInterface.addColumn("Subscriptions", "lastWordId", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn("Subscriptions", "preferredCategory", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 마이그레이션 롤백
    await queryInterface.removeColumn("Subscriptions", "lastWordId");
    await queryInterface.removeColumn("Subscriptions", "preferredCategory");
    await queryInterface.dropTable("ReceivedWords");
    await queryInterface.dropTable("ReceivedQuestions");
  },
};
