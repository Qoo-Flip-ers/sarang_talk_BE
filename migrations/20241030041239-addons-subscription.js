'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("Subscription");
    await Promise.all([
      queryInterface.addColumn("Subscription", "addOn1-1:1", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      }),
      queryInterface.addColumn("Subscription", "addOn1-1:5", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      })
    ]);
  },
  async down(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.removeColumn("Subscription", "addOn1-1:1"),
      queryInterface.removeColumn("Subscription", "addOn1-1:5")
    ])
  }
};