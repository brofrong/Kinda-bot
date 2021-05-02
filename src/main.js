const Discord = require('discord.js');
const constants = require('../constants.json');
const messageResolve = require('./message-resolver/message');

const client = new Discord.Client();



client.on('ready', () => {
    console.log("Bot ready")
});

client.on('message', (msg) => {
    messageResolve(msg, client);
});

client.on('messageReactionAdd', (reaction, user) => {
    console.log("try");
    console.log(reaction, user); 
});

client.login(constants.token);
