const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const Discord = require('discord.js');

const { removeisniper } = require("../utiles/getisniper");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removeispy')
		.setDescription('Remove pool recenter!'),
	async execute(interaction) {
		await interaction.deferReply();
		await removeisniper(interaction);
		
		await interaction.editReply(`> \`Start\``);
	},
};