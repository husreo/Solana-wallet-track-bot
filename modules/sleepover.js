const { ChannelType } = require("discord.js");
const fs = require('fs');
const path = require('path');

module.exports = class Sleepover {
    constructor(interactionOrSleepover, client) {
        if (client) {
            //We're loading from a sleepover json file
            this.guild = client.guilds.cache.filter(g => g.id === interactionOrSleepover.guild.id).first();
            this.announcementsChannel = this.guild.channels.cache.filter(c => c.id === interactionOrSleepover.announcementsChannel?.id).first();
            this.sleepoverCategory = this.guild.channels.cache.filter(c => c.id === interactionOrSleepover.sleepoverCategory?.id).first();
            this.lobbyChannel = this.guild.channels.cache.filter(c => c.id === interactionOrSleepover.lobbyChannel?.id).first();
            this.doghouseChannel = this.guild.channels.cache.filter(c => c.id === interactionOrSleepover.doghouseChannel?.id).first();
            this.overridePermissions = interactionOrSleepover.overridePermissions;
            this.name = interactionOrSleepover.name;
            this.announcement = interactionOrSleepover.announcement;
            this.reportChannel  = interactionOrSleepover.reportChannel ? this.guild.channels.cache.filter(c => c.id === interactionOrSleepover.reportChannel?.id).first() : false;
            this.closed = interactionOrSleepover.closed;

            if (this.closed) {
                this.sleepoverCategory.children.cache.forEach(async c => {
                    await c.delete(`${this.name} has ended!`)
                });

                this.guild.channels.delete(this.sleepoverCategory, `${this.name} has ended!`);

                fs.unlinkSync(path.join(__dirname, '..', 'sleepovers', this.guild.id + this.sleepoverCategory.id + '.sleepover'));
            } else {
                let so = this;

                this.lobbyChannel.members.map(m => {
                    so.createRoom(m);
                })
            }
        } else {
            //We're creating a new sleepover
            this.guild = interactionOrSleepover.guild;
            this.announcementsChannel = interactionOrSleepover.options.getChannel('announcements');
            this.sleepoverCategory = null;
            this.lobbyChannel = null;
            this.doghouseChannel = null;
            this.overridePermissions = interactionOrSleepover.options.getBoolean('admins') ?? true;
            this.name = interactionOrSleepover.options.getString('name') ?? 'The Sleepover';
            this.announcement = interactionOrSleepover.options.getString('announcement') ?? `${this.name} has started!`;
            this.reportChannel = interactionOrSleepover.options.getChannel('report') ?? false;
            this.closed = false;

            this.startSleepover(interactionOrSleepover);
        }
    }

    getGuild() {
        return this.guild;
    }

    startSleepover(interaction) {
        let so = this;

        this.guild.channels.create({
            name: this.name,
            reason: `${this.name} has started`,
            type: ChannelType.GuildCategory
        }).then(soc => {
            so.sleepoverCategory = soc;

            so.sleepoverCategory.children.create({
                name: 'The Lobby',
                reason: `${this.name} has started!`,
                type: ChannelType.GuildVoice
            }).then(sol => {
                so.lobbyChannel = sol;

                so.sleepoverCategory.children.create({
                    name: 'The Dog House',
                    reason: `${this.name} has started!`,
                    type: ChannelType.GuildVoice
                }).then(async sod => {
                    so.doghouseChannel = sod;

                    so.doghouseChannel.permissionOverwrites.create(so.guild.roles.everyone, { 'Speak': false, 'Connect': false });

                    so.announcementsChannel?.send(so.announcement);

                    fs.writeFileSync(
                        path.join(__dirname, '..', 'sleepovers', so.guild.id + so.sleepoverCategory.id + '.sleepover'),
                        JSON.stringify(this)
                    );

                    await interaction.editReply(`${this.name} has started!`);
                })
            });
        }).catch(async () => {
            await interaction.editReply(`${this.name} failed to start!`);
        });

        return this;
    }

    async endSleepover(interaction) {
        let so = this;

        so.closed = true;

        fs.writeFileSync(
            path.join(__dirname, '..', 'sleepovers', so.guild.id + so.sleepoverCategory.id + '.sleepover'),
            JSON.stringify(this)
        );

        let timelimit = interaction.options.getInteger('timelimit') ?? 0;

        await so.guild.channels.delete(so.lobbyChannel, `${so.name} has ended!`);

        setTimeout(async () => {
            so.sleepoverCategory.children.cache.forEach(async c => {
                await c.delete(`${so.name} has ended!`)
            });

            await so.guild.channels.delete(so.sleepoverCategory, `${so.name} has ended!`);

            fs.unlinkSync(path.join(__dirname, '..', 'sleepovers', so.guild.id + so.sleepoverCategory.id + '.sleepover'));
        }, timelimit * 60 * 1000);
    }

    getLobbyChannel() {
        return this.lobbyChannel;
    }

    getDoghouseChannel() {
        return this.doghouseChannel;
    }

    getName() {
        return this.name;
    }

    getCategory() {
        return this.sleepoverCategory;
    }

    createRoom(member) {
        let so = this;

        this.sleepoverCategory.children.create({
            name: (member.nickname ?? member.user.username) + `'s Room`,
            reason: `${member.nickname ?? member.user.username} has started a private room!`,
            type: ChannelType.GuildVoice
        }).then(c => {
            member.voice.setChannel(c);

            c.permissionOverwrites.create(member, so.overridePermissions ? {'ManageChannels': true, 'MoveMembers': true, 'ManageRoles': true} : {});

            this.doghouseChannel.permissionOverwrites.create(member, so.overridePermissions ? {'MoveMembers': true} : {});
        });
    }

    report(executor, member, sourceChannel) {
        if (this.reportChannel) {
            this.reportChannel.send(executor.toString() + ' moved ' + member.toString() + ' from ' + sourceChannel.name)
        }
    }
}