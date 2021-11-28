import {Module} from '@nestjs/common';
import {DiscordModule} from 'discord-nestjs';
import {DiscordConfigService} from './bot/discord.config.service';
import {BotGateway} from './bot/gateway';
import {DbService} from './core/db/db.service';
import {HelperService} from './core/helper.service';
import {MusicService} from './music/music.service';
import {NekoService} from './neko/neko.service';
import {RolesByReactionsService} from './roles-by-reactions/roles-by-reactions.service';
import {UsefullService} from './usefull/usefull.service';

@Module({
    imports: [
        DiscordModule.forRootAsync({
            useClass: DiscordConfigService,
        }),
    ],
    providers: [
        BotGateway,
        NekoService,
        UsefullService,
        RolesByReactionsService,
        DbService,
        HelperService,
        MusicService,
    ]
})
export class AppModule {
}
