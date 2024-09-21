"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("Users");
    if (!tableDefinition.language) {
      await queryInterface.addColumn("Users", "language", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "ID",
      });
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "language");
  },
};
