import {Injectable, Logger} from '@nestjs/common';
import {Client, ClientProvider, OnCommand} from 'discord-nestjs';
import {Message, MessageAttachment} from 'discord.js';
import * as fetch from 'node-fetch';

@Injectable()
export class NekoService {
    @Client()
    discordProvider: ClientProvider;

    @OnCommand({name: 'neko'})
    async onCommand(message: Message) {
        message.channel.startTyping();
        const nekoImg = await this.getNeko();
        message.reply(new MessageAttachment(nekoImg));
        message.channel.stopTyping();
    }


    private async getNeko(): Promise<string>{
        const res = await fetch("https://neko-love.xyz/api/v1/neko");
        const mat = await res.json();

        if (mat.code !== 200) {
            return 'error';
        }
        return mat.url;
    }
}
