const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const Discord = require('discord.js');

const wait = require('node:timers/promises').setTimeout;
const { getMultiplePairs, getTokenInfo } = require("../utiles/index");
const mint = "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Token Info!')
		.addStringOption(option => option.setName('mint').setDescription('Enter a token mint')),
	async execute(interaction) {
		await interaction.deferReply();
		const mint = interaction.options.getString('mint');
		let props = await getTokenInfo(mint);
		                
		let socials = '';
        let website = '';
		for (let I = 0; I < props.socials.length; I++) {
            if (props.socials.length === 0) {
                break;
            }
            const urls = props.socials[I];
            socials += '\n > **' + urls.type + '**: ' + urls.url;
        }

        for (let I = 0; I < props.websites.length; I++) {
            if (props.websites.length === 0) {
                break;
            }
            const urls = props.websites[I];
            website += '\n > **' + urls.type + '**: ' + urls.url;
        }
		let result = '\n > **Name **: '+ props.name
		+ '\n > **symbols**: ' + props.symbols
		+ '\n > **supply**: ' + Math.floor(Number(props.supply) / Math.pow(10, props.decimal))
		+ '\n > **decimal**: ' + props.decimal
		+ '\n > **exchange**: ' + props.exchange
		+ '\n > **Liquidity**: ' + props.liquidity
		+ '\n > **Token Price**: ' + props.tokenPrice
		+ '\n > **Pooled Sol**: ' + props.pooledSol
		+ '\n > **Market Cap**: ' + props.marketCap
		+ website
		+ socials
		await interaction.editReply(`> ### The result: ${result}`);
	},
};