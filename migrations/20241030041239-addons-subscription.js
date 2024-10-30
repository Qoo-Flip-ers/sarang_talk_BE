'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.addColumn("Subscriptions", "addOn1-1:1", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      }),
      queryInterface.addColumn("Subscriptions", "addOn1-1:5", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      }),
      queryInterface.addColumn("Subscriptions", "addOn3-lecture", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      }),
      queryInterface.addColumn("Subscriptions", "addOn4-recap", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      })
    ]);
  },
  async down(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.removeColumn("Subscriptions", "addOn1-1:1"),
      queryInterface.removeColumn("Subscriptions", "addOn1-1:5"),
      queryInterface.removeColumn("Subscriptions", "addOn3-lecture"),
      queryInterface.removeColumn("Subscriptions", "addOn4-recap")
    ])
  }
};