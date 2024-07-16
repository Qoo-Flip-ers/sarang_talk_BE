"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users 테이블에서 컬럼이 존재하는지 확인
    const tableDefinition = await queryInterface.describeTable("Users");

    if (!tableDefinition.deletedAt) {
      // deletedAt 컬럼이 존재하지 않는 경우에만 추가
      await queryInterface.addColumn("Users", "deletedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    const wordTableDefinition = await queryInterface.describeTable("Words");
    if (!wordTableDefinition.deletedAt) {
      await queryInterface.addColumn("Words", "deletedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Users", "deletedAt");
    await queryInterface.removeColumn("Words", "deletedAt");
  },
};
