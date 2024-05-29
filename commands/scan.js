const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const Discord = require('discord.js');

const wait = require('node:timers/promises').setTimeout;
const { getMultiplePairs, ownersInfo } = require("../utiles/index");

// const channels = [
// 	'1244968006405066804',
// 	'1244991408805253120',
// 	'1244991485523529772',
// 	'1244991514594119721',
// 	'1244991543576887368',
// 	'1244991570374037556',
// 	'1244991605107195965',
// 	'1244991630025691187',
// 	'1244991668491386971',
// 	'1244991723223126099',
// 	'1244991756605587549'
// ]

const channels = [
	'1245149383192743986',
	'1245149414310547578',
	'1245149443850895382',
	'1245149509814718554',
	'1245149539682222091',
	'1245149567339593749',
	'1245149614038974615',
	'1245149641385705484',
	'1245149664890851338',
	'1245149695739822160',
	'1245149719643291769'
]

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scan')
		.setDescription('!')
		.addStringOption(option => option.setName('mint').setDescription('Enter a token mint')),
	async execute(interaction) {
		await interaction.deferReply();
		const mint = interaction.options.getString('mint');
		// const owners = await ownersInfo(mint);
		let bots = await getMultiplePairs(mint);
		if (bots === 'long') {
			interaction.followUp("Too big transactions!");
			return
		}

		for (let index = 0; index < bots.length; index++) {
			if (bots[index].length === 0) {
				continue;
			}
			const element = bots[index];
			let str = '';
			for (let i = 0; i < element.length; i++) {
				str += '\n' + element[i];
			}

			const moonEmbed1 = new EmbedBuilder()
                .setColor(16711680)
                .setTitle("Spy snipers")
                .setDescription(str)
			console.log("channnel id ====> ", channels[index]);
			await interaction.client.channels.cache.get(channels[index]).send({ embeds: [moonEmbed1] });
		}
		
		await interaction.followUp("Finished");

		console.log("done");
	},
};