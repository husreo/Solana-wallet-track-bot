const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Discord = require('discord.js');

const { closeTrack } = require("../utiles/index");
const mint = "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('close-track')
		.setDescription('Close track'),
	async execute(interaction) {
		await interaction.deferReply();
		const alertEmbed = new EmbedBuilder()
			.setColor(0x6058f3)
			.setTitle("closed")
		const errorAlert = new EmbedBuilder()
			.setColor(0xff0000)
			.setTitle("Something went wrong")
		try{
			await closeTrack();
			await interaction.editReply({ embeds: [alertEmbed] });
		}
		catch(err) {
			console.log(err);
			await interaction.editReply({ embeds: [errorAlert] });
		}		
	},
};