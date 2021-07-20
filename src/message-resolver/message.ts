import {BOT_CHANEL, PREFIX} from '../constants'
import {getNeko} from '../api/neko';
import {cleaner} from './chanel/cleaner'

export async function messageResolve(message, client) {
    if(prefix(message)) return;

    const botChannel = await client.channels.fetch(BOT_CHANEL);
    
    if(message.channel != BOT_CHANEL){
     return;   
    }
    
    const content = message.content.substring(1);

    switch(content){
        case "ping": 
            pong(message);
        break;
        case "neko":
            botChannel.send({files: [await getNeko()]});
        break;
        case "clear":
            cleaner(client, botChannel, {prefix: true, bot: true});
        break;
    }


}

function prefix(message): boolean {
    return !message.content.startsWith(PREFIX)
}

function pong(message) {
    message.reply("pong ass");
}

