const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const Discord = require('discord.js');

const { runListener } = require("../utiles/getisniper");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ispy')
		.setDescription('Spy sniper!'),
	async execute(interaction) {
		await interaction.deferReply();
		await runListener(interaction);
		
		await interaction.editReply(`> \`Start\``);
	},
};