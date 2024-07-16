"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const tableDefinition = await queryInterface.describeTable("Subscriptions");
    if (!tableDefinition.plan) {
      await queryInterface.addColumn("Subscriptions", "plan", {
        type: Sequelize.STRING,
        defaultValue: "whatsapp_1",
      });
    }

    if (!tableDefinition.quiz) {
      await queryInterface.addColumn("Subscriptions", "quiz", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDefinition.zoom) {
      await queryInterface.addColumn("Subscriptions", "zoom", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn("Subscriptions", "plan");
    await queryInterface.removeColumn("Subscriptions", "quiz");
    await queryInterface.removeColumn("Subscriptions", "zoom");
  },
};
