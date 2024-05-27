const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('clean')
		.setDescription('Cleans up after the sleepover(s)!')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel of the sleepover to clean up.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory)
        ),
	async execute(interaction, sm) {
		await interaction.reply({ content: `${interaction.options.getChannel('channel').name} is being cleaned!`, ephemeral: true });

        sm.clean(interaction);
	},
};
