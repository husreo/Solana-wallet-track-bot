const fs = require('node:fs');
const path = require('node:path');
const Discord = require('discord.js');

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection, REST, Routes, AuditLogEvent, OverwriteType } = require('discord.js');
const { Connection } = require('@solana/web3.js');
const dotenv = require("dotenv");

dotenv.config();
// const clientID = '1243626374246305823';
const clientID = process.env.APP_ID || "";
// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {

	const command = require(`./commands/${file}`);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		// console.log(command.data.name, command);
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}

	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.BOTTOKEN || "");
(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationCommands(clientID),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

// Log in to Discord with your client's token
client.login(process.env.BOTTOKEN || "");

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);
	// interaction.guild.members 
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

const { struct, u64, u8 } = require("@project-serum/borsh");
const base58 = require('bs58');

const AccountLayout = struct([
	u8('discriminator'),
	u64('amountIn'),
	u64('minAmountOut')
]);

const getInfo = async (signature) => {
	const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=39d83ffa-585c-4f90-8636-2f6795db4cb3")
	const history = await connection.getParsedTransaction(
		signature, { maxSupportedTransactionVersion: 0 }
	);

	const ins = history?.meta?.innerInstructions.filter(ins => {
		return ins?.instructions[0]?.accounts?.length == 18
	})[0]
	const data = ins.instructions[0].data
	const tokenData = AccountLayout.decode(Buffer.from(base58.decode(data)))
	const sol = Number(tokenData.amountIn.toString()) / 10 ** 9
	console.log("🚀 sol:", sol)
}


