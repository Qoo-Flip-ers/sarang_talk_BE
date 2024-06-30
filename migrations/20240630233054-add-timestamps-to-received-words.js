"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ReceivedWords", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("ReceivedWords", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("ReceivedWords", "deletedAt", {
      type: Sequelize.DATE,
    });
    // ------------------------------
    await queryInterface.addColumn("ReceivedQuestions", "createdAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("ReceivedQuestions", "updatedAt", {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("ReceivedQuestions", "deletedAt", {
      type: Sequelize.DATE,
    });
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
