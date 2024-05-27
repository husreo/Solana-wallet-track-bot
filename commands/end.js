const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('end')
		.setDescription('Ends the sleepover(s)!')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel of the sleepover to end.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory)
        )
        .addIntegerOption(option =>
            option
                .setName('timelimit')
                .setDescription('The number of minutes to allow for current discussions to end before cleaning up.')
                .setRequired(false)
        ),
	async execute(interaction, sm) {
		await interaction.reply({ content: `${interaction.options.getChannel('channel').name} is ending!`, ephemeral: true });

        sm.removeSleepover(interaction);
	},
};
