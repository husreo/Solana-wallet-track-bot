const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const Discord = require('discord.js');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const wait = require('node:timers/promises').setTimeout;
const { getMultiplePairs, ownersInfo, getMarketSniper } = require("../utiles/index");

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
const solanaConnection = new Connection('https://aged-maximum-pallet.solana-mainnet.quiknode.pro/5d2476aba2f79657eee64c4c71173eb549693756/');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('scan')
		.setDescription('!')
		.addStringOption(option => option.setName('mint').setDescription('Enter a token mint')),
	async execute(interaction) {
		await interaction.deferReply();
		const mint = interaction.options.getString('mint');
		const data = await getMarketSniper(mint);
		if (!data) {
			await interaction.followUp("Market not created!");
			return
		}
		const moonEmbed1 = new EmbedBuilder()
			.setColor(0x6058f3)
			.setTitle("Spy snipers")
			.addFields({name: `Contract`, value: `\`${data.contract}\``})
			.addFields({name: `Market ID`, value: `\`${data.market_key.toBase58()}\``})
		const snipers = data.sniper;
		let sniperList = '';
		let fieldCount = 0;
		for (let index = 0; index < snipers.length; index++) {
			const balance = await solanaConnection.getBalance(new PublicKey(snipers[index]));
			const sniper = `- ${snipers[index]} | ${balance/LAMPORTS_PER_SOL}\n`;
			if (sniperList.length + sniper.length > 1024) {
				moonEmbed1.addFields({ name: `Snipers ${fieldCount + 1}`, value: sniperList });
				sniperList = '';
				fieldCount++;
			}
			sniperList += sniper;
		}

		if (sniperList.length > 0) {
		moonEmbed1.addFields({ name: `Snipers ${fieldCount + 1}`, value: sniperList });
		}

			// .setDescription(`Contract \n \`${data.contract}\` \n \n Market ID \n \`${data.market_key.toBase58()}\` \n \n \n ${sniperList}`)
		await interaction.followUp({ embeds: [moonEmbed1] });

		console.log("done");
	},
};