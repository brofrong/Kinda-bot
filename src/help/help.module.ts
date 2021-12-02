import {Module} from '@nestjs/common';
import {HelpDiscordController} from './help.discord.controller';
import {HelpService} from './help.service';

@Module({
    providers: [
        HelpDiscordController,
        HelpService,
    ]
})
export class HelpModule {
}
