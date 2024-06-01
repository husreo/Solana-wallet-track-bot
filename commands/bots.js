const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const Discord = require('discord.js');

const wait = require('node:timers/promises').setTimeout;
const { getMultiplePairs } = require("../utiles/index");
const mint = "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bots')
		.setDescription('!')
		.addStringOption(option => option.setName('mint').setDescription('Enter a token mint')),
	async execute(interaction) {
		await interaction.deferReply();
		const mint = interaction.options.getString('mint');
		let bots = await getMultiplePairs(mint);
		                
		let snipers = '';
		for (let index = 0; index < bots.length; index++) {
			snipers += '\n > - ' + bots[index];
		}
		await interaction.editReply(`> ### The result: ${snipers}`);
	},
};