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
    const tableDefinition = await queryInterface.describeTable("Questions");
    if (!tableDefinition.example_4) {
      await queryInterface.addColumn("Questions", "example_4", {
        allowNull: true,
        type: Sequelize.STRING,
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

    await queryInterface.removeColumn("Questions", "example_4");
  },
};
