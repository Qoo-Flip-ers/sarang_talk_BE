"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("ReceivedWords");
    if (!tableDefinition.createdAt) {
      await queryInterface.addColumn("ReceivedWords", "createdAt", {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }
    if (!tableDefinition.updatedAt) {
      await queryInterface.addColumn("ReceivedWords", "updatedAt", {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }
    if (!tableDefinition.deletedAt) {
      await queryInterface.addColumn("ReceivedWords", "deletedAt", {
        type: Sequelize.DATE,
      });
    }
    // ------------------------------

    const tableDefinition2 = await queryInterface.describeTable(
      "ReceivedQuestions"
    );
    if (!tableDefinition2.createdAt) {
      await queryInterface.addColumn("ReceivedQuestions", "createdAt", {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }
    if (!tableDefinition2.updatedAt) {
      await queryInterface.addColumn("ReceivedQuestions", "updatedAt", {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }
    if (!tableDefinition2.deletedAt) {
      await queryInterface.addColumn("ReceivedQuestions", "deletedAt", {
        type: Sequelize.DATE,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ReceivedWords", "createdAt");
    await queryInterface.removeColumn("ReceivedWords", "updatedAt");
    await queryInterface.removeColumn("ReceivedWords", "deletedAt");

    await queryInterface.removeColumn("ReceivedQuestions", "createdAt");
    await queryInterface.removeColumn("ReceivedQuestions", "updatedAt");
    await queryInterface.removeColumn("ReceivedQuestions", "deletedAt");
  },
};
