const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const Discord = require('discord.js');

const wait = require('node:timers/promises').setTimeout;
const { getMultiplePairs } = require("../utiles/index");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scan')
		.setDescription('!')
		.addStringOption(option => option.setName('mint').setDescription('Enter a token mint')),
	async execute(interaction) {
		await interaction.deferReply();
		const mint = interaction.options.getString('mint');
		let bots = await getMultiplePairs(mint);
		if (bots == 'long') {
			await interaction.followUp(`### Too long transaction`);
		} else {
			console.log("bots lenght========>", bots.length);
			let snipers = "### The result: ";
			// let snipersokay = "okay";
			for (let index = 0; index < bots.length; index++) {
				snipers += '\n > - ' + bots[index];
				if (((snipers + '\n > - ' + bots[index + 1])?.length) > 2000) {
				  await interaction.followUp(`${snipers}`);
				  snipers = "";
				}
			}
		  
			if (snipers.length > 0) {
			await interaction.followUp(`${snipers}`);
			}

			console.log("done");
		}
	},
};