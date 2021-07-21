import * as Discord from 'discord.js';
import {TOKEN} from './constants';
import {messageResolve} from './message-resolver/message';

const client = new Discord.Client();

client.on('ready', async () => {
    console.log('Bot ready');
    // channel = await client.channels.fetch("837007949556744232");
    // channel.messages.fetch("123"); // добоалене в кеш сообщения
});

client.on('message', (msg) => {
    messageResolve(msg, client);
});

client.on('messageReactionAdd', (reaction, user) => {
    console.log('try');
    console.log(reaction, user);
});

client.on('error', (error) => {
    console.error(error);
});

process.on('uncaughtException', (error) => console.error('error', error));

client.login(TOKEN);
