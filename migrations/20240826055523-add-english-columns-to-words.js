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
    const tableDefinition = await queryInterface.describeTable("Words");
    if (!tableDefinition.en_description) {
      await queryInterface.addColumn("Words", "en_description", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      await queryInterface.addColumn("Words", "en_pronunciation", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      await queryInterface.addColumn("Words", "en_example_1", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      await queryInterface.addColumn("Words", "en_example_2", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      await queryInterface.addColumn("Words", "en_example_3", {
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
    const tableDefinition = await queryInterface.describeTable("Words");
    if (tableDefinition.en_description) {
      await queryInterface.removeColumn("Words", "en_description");
      await queryInterface.removeColumn("Words", "en_pronunciation");
      await queryInterface.removeColumn("Words", "en_example_1");
      await queryInterface.removeColumn("Words", "en_example_2");
      await queryInterface.removeColumn("Words", "en_example_3");
    }
  },
};
