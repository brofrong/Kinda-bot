import {Injectable, Logger} from '@nestjs/common';
import {Client, ClientProvider, OnCommand} from 'discord-nestjs';
import {Message} from 'discord.js';
import {HelpService} from './help.service';

@Injectable()
export class HelpDiscordController {
    private readonly logger = new Logger(HelpDiscordController.name);

    constructor(
        private helpService: HelpService,
    ) {
    }

    @Client()
    discordProvider: ClientProvider;

    @OnCommand({name: 'help'})
    async onPlay(message: Message) {
        this.helpService.getGeneralHelp(message);
    }
}
