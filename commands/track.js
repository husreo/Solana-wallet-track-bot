const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Discord = require('discord.js');

const wait = require('node:timers/promises').setTimeout;
const { getNotification } = require("../utiles/index");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('track')
		.setDescription('Sniper Wallet!')
		.addStringOption(option => option.setName('address').setDescription('Enter a sniper wallet')),
	async execute(interaction) {
		const addr = interaction.options.getString("address");

		const alertEmbed = new EmbedBuilder()
		.setColor(0x6058f3)
		.setTitle("Tracking now....")
		await interaction.deferReply();
		try {
			await getNotification(addr, interaction);
			
		} catch (error) {
			console.error('Error sending direct message:', error);
			await interaction.editReply('Failed to send direct message.');
		}

		await interaction.editReply({ embeds: [alertEmbed] });
	},
};