import {Injectable, Logger} from '@nestjs/common';
import {
    Client,
    ClientProvider,
    Content,
    Context,
    OnCommand,
    TransformPipe,
    UseGuards,
    UsePipes,
    ValidationPipe
} from 'discord-nestjs';
import {Message} from 'discord.js';
import {PREFIX} from '../core/constants';
import {ElderGuard} from '../core/guard/elder.guard';
import {CleanDto} from './usefull.dto';

@Injectable()
export class UsefullService {
    private readonly logger = new Logger(UsefullService.name);

    @Client()
    discordProvider: ClientProvider;

    @OnCommand({name: 'clean'})
    @UseGuards(ElderGuard)
    @UsePipes(TransformPipe, ValidationPipe)
    async onCommand(
        @Content() content: CleanDto,
        @Context() [context]: [Message]
    ) {
        context.channel.startTyping();
        const limit = content.limit || 100;
        const messages = await context.channel.messages.fetch({limit}, false, true);
        const clientId = context.client.user.id;
        for (const msg of messages.array()) {
            if (
                (msg.author.id === clientId ||
                msg.content.startsWith(PREFIX)) &&
                msg.deletable
            ) {
                msg.delete();
            }
        }
        context.channel.stopTyping();
    }
}
