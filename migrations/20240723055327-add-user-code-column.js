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
    const tableDefinition = await queryInterface.describeTable("Users");
    if (!tableDefinition.code) {
      await queryInterface.addColumn("Users", "chatId", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      await queryInterface.addColumn("Users", "code", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      await queryInterface.addColumn("Users", "codeGeneratedAt", {
        type: Sequelize.DATE,
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
    await queryInterface.removeColumn("Users", "chatId");
    await queryInterface.removeColumn("Users", "code");
    await queryInterface.removeColumn("Users", "codeGeneratedAt");
  },
};
