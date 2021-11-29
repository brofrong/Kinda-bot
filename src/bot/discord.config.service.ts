import { Injectable } from '@nestjs/common';
import {DiscordModuleOption, TransformPipe, ValidationPipe} from 'discord-nestjs';
import {PREFIX} from '../core/constants';
import {TOKEN} from '../core/token';

@Injectable()
export class DiscordConfigService {
  createDiscordOptions(): DiscordModuleOption {
    return {
      token: TOKEN,
      commandPrefix: PREFIX,
      allowGuilds: ['168316514074755072', '95448882745454592'],
      // denyGuilds: ['520622812742811698'],
      allowCommands: [
        {
          name: 'neko',
          // channels: ['837007949556744232'],
          // users: ['261863053329563648'],
          // channelType: ['dm'],
        },
      ],
      // webhook: {
      //   webhookId: 'your_webhook_id',
      //   webhookToken: 'your_webhook_token',
      // },
      usePipes: [TransformPipe, ValidationPipe],
      // and other discord options
    };
  }
}
