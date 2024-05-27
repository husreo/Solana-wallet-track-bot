# Sleepover

A Discord bot for managing ephemeral voice chats.

When a user joins "The Lobby" a new voice chat is created, the user is moved to the new channel, and finally the user is made an admin of their channel. When the user who created the channel leaves, the channel is deleted. The admin user can move users from their own channel into "The Dog House" if they are causing trouble. The admin user can also set their own permissions for that channel, rename it, set permissions for individual users/roles, and basically anything else an admin can usually take care of.

# Usage

1. Create a file called config.json in the root directory with the following contents:

```
{
    "token": "Your Bot's Token",
    "clientId": "Your Bot's Client Id"
}
```

2. Install packages with ```npm install```
3. Run the bot with ```node .\index.js```
4. In the guild you intend to start a sleepover by running the ```/start``` command
    * Optional Parameters:
        * announcements: The channel to send announcements
        * report: The chnanel to send reports
        * name: The category to create the sleepover under - defaults to "The Sleepover"
        * admins: If ```true```, The user gets admin permissions to the channel they create - defaults to ```true```
        * announcement: The message to send to the announcements channel when the sleepover starts
5. To end a sleepover and remove all sleepover channels use ```/end```
    * Required Paramters:
        * channel: The category channel to end the sleepover for
    * Optional Parameters:
        * timelimit: The number of minutes to allow current channels to continue discussion before removal - defaults to ```0```

# Troubleshooting

* The ```/clean``` command will clean up a channel category, removing it and it's children. Use with caution
* The ```/ping``` command will test the bot and respond with "Pong!"

# Don't want to run your own instance? Invite Sleepover to your server!

[Click here to invite to your server!](https://discord.com/api/oauth2/authorize?client_id=1046333570496598106&permissions=8&scope=bot%20applications.commands)