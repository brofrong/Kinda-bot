const Discord = require('discord.js');
const constants = require('../constants.json');

const client = new Discord.Client();



client.on('ready', () => {
    console.log("Bot ready")
});

client.on('message', (msg) => {
    if(msg.channel == constants.botChanel){
        if(msg.content == "ping")
        msg.reply("pong");
    }
    console.log(msg);
})

client.login(constants.token);
