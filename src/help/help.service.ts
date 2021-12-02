import {Injectable, Logger} from '@nestjs/common';
import {Message} from 'discord.js';
import {PREFIX} from '../core/constants';
import {helpText} from './help.text';

@Injectable()
export class HelpService {
    private readonly logger = new Logger(HelpService.name);

    constructor() {}

    public getGeneralHelp(message: Message) {
        const text = '```' + helpText.map((help) => `\n${help.title}:\n${help.commands.map((command) => `\t${PREFIX + command.title} - ${command.short}`).join('\n')}`).join('\n') + '```';
        message.author.send(text)
    }
}
