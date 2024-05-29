const fs = require('node:fs');
const path = require('node:path');
const Discord = require('discord.js');

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection, REST, Routes, AuditLogEvent, OverwriteType } = require('discord.js');

const clientID = '1243626374246305823';
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

const rest = new REST({ version: '9' }).setToken("MTI0MzYyNjM3NDI0NjMwNTgyMw.Gr1RkI.o6sXbKbIKmOx_Y_bUD2VVRloQ7k6XSqh1eIGeQ");
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
client.login("MTI0MzYyNjM3NDI0NjMwNTgyMw.Gr1RkI.o6sXbKbIKmOx_Y_bUD2VVRloQ7k6XSqh1eIGeQ");

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);
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
