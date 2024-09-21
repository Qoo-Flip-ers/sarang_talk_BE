module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable("Words");
    if (tableDefinition.audioUrl.type !== "STRING(500)") {
      await queryInterface.changeColumn("Words", "audioUrl", {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable("Words");
    if (tableDefinition.audioUrl.type !== "STRING(255)") {
      await queryInterface.changeColumn("Words", "audioUrl", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  },
};
