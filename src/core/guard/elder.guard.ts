import {DiscordGuard} from 'discord-nestjs';
import {ClientEvents, Message, MessageEmbed, TextChannel} from 'discord.js';
import {KINDA_ROLES} from '../constants';

export class ElderGuard implements DiscordGuard {
    async canActive(
        event: keyof ClientEvents,
        [context]: [Message],
    ): Promise<boolean> {
        const channel = context.channel as TextChannel;
        if (!channel.permissionOverwrites.some((permission) => [KINDA_ROLES.ANCIENT, KINDA_ROLES.ELDER].includes(permission.id))) {
            const embed = new MessageEmbed().setColor('#ff0000').setTitle('У вас нет привелегий');
            await context.reply(embed);
            return false;
        }
        return true;
    }
}
