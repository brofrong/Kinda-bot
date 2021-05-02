const Discord = require('discord.js');
const constants = require('../../constants.json');
const Neko = require('../api/neko');

async function messageResolve(message, client) {
    if(prefix(message)) return;

    const botChannel = await client.channels.fetch(constants.botChanel);
    
    if(message.channel != constants.botChanel){
     return;   
    }
    
    const content = message.content.substring(1);

    switch(content){
        case "ping": 
            pong(message);
        break;
        case "neko":
            botChannel.send({files: [await Neko.getNeko()]});
        break;
    }


}

function prefix(message) {
    return !message.content.startsWith(constants.prefix)
    
}

function pong(message) {
    message.reply("pong");
}

module.exports = messageResolve;