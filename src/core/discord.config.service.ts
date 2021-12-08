import { Injectable } from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DiscordModuleOption, TransformPipe, ValidationPipe} from 'discord-nestjs';
import {PREFIX} from './constants';

@Injectable()
export class DiscordConfigService {

  constructor(
      private configService: ConfigService
  ) {
  }

  createDiscordOptions(): DiscordModuleOption {
    return {
      token: this.configService.get<string>('TOKEN'),
      commandPrefix: PREFIX,
      allowGuilds: ['168316514074755072', '95448882745454592'],
      // allowCommands: [
      //   {
      //     name: 'neko',
      //   },
      // ],
      usePipes: [TransformPipe, ValidationPipe],
    };
  }
}
