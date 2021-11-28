import {Injectable, Logger} from '@nestjs/common';
import {Client, ClientProvider} from 'discord-nestjs';
import {Guild, Message, MessageEmbed, TextChannel} from 'discord.js';
import {BOT_CHANNEL, KINDA_GUILD} from './constants';

@Injectable()
export class HelperService {
    private readonly logger = new Logger(HelperService.name);

    @Client()
    discordProvider: ClientProvider;

    public async sendSuccess(message: Message, text: string) {
        const embed = new MessageEmbed().setColor('#50f150').setTitle(text);
        message.reply(embed);
    }

    public async sendError(message: Message, text: string) {
        const embed = new MessageEmbed().setColor('#ff0000').setTitle(text);
        await message.reply(embed);
    }

    public async sendLog(text: string) {
        const botChannel = (await this.getGuild()).channels.cache.get(BOT_CHANNEL) as TextChannel;
        const embed = new MessageEmbed().setColor('#f5ee1d').setTitle(text);
        return botChannel.send(embed);
    }

    public async getGuild(): Promise<Guild> {
        return this.discordProvider.getClient().guilds.fetch(KINDA_GUILD);
    }

}
