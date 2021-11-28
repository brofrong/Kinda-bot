import {Injectable, Logger} from '@nestjs/common';
import {
    Client,
    ClientProvider,
    Content,
    Context,
    OnCommand,
    TransformPipe,
    UsePipes,
    ValidationPipe
} from 'discord-nestjs';
import {Message, StreamDispatcher, VoiceConnection} from 'discord.js';
import * as moment from 'moment';
import * as ytdl from 'ytdl-core';
import {DB} from '../core/constants';
import {DbService} from '../core/db/db.service';
import {HelperService} from '../core/helper.service';
import {PlayDto, VolumeDto} from './music.dto';

@Injectable()
export class MusicService {
    private readonly logger = new Logger(MusicService.name);
    private connection: VoiceConnection;
    private dispatcher: StreamDispatcher;

    private queue: string[] = [];

    private volume: number;

    constructor(
        private helperService: HelperService,
        private dbService: DbService,
    ) {
    }

    @Client()
    discordProvider: ClientProvider;

    @OnCommand({name: 'play'})
    @UsePipes(TransformPipe, ValidationPipe)
    async onPlay(
        @Content() content: PlayDto,
        @Context() [message]: [Message]
    ) {
        if (message.member.voice.channel) {
            this.connection = await message.member.voice.channel.join();
            if (!this.dispatcher) {
                await this.startPlay(content.url);

                this.dispatcher.on('finish', () => this.playNext());
                this.dispatcher.on('error', (e) => {
                    this.logger.error(e);
                    this.stopPlay();
                });
            } else {
                this.queue.push(content.url);
                const info = (await ytdl.getInfo(content.url)).videoDetails.title;
                await this.helperService.sendSuccess(message, `Добавлен в очередь : ${info}, сейчас в очереди ${this.queue.length}`);
            }
        } else {
            this.helperService.sendError(message, `Вы должны находиться в войсе!`);
        }
    }

    @OnCommand({name: 'stop'})
    async onStop(message: Message) {
        this.stopPlay();
    }

    @OnCommand({name: 'queue'})
    async onQueue(message: Message) {
        const text = await Promise.all(this.queue.map(async (url, index) => {
            const info = (await ytdl.getInfo(url)).videoDetails;
            return `${index + 1}: ${info.title}`;
        }));
        await this.helperService.sendSuccess(message, text.join('\n'));
    }

    @OnCommand({name: 'volume'})
    @UsePipes(TransformPipe, ValidationPipe)
    async onVolume(
        @Content() content: VolumeDto,
        @Context() [message]: [Message]
    ) {
        if (this.dispatcher) {
            this.dispatcher.setVolume(content.volume / 100);
            await this.dbService.write(DB.MUSIC_VOLUME, content.volume / 100);

            this.helperService.sendSuccess(message, `Громкость установлена на ${content.volume}%`);
        }
    }

    // @Once({event: 'ready'})
    // async onReady() {
    //     const connection = (await this.discordProvider.getClient().voice);
    //     if (connection) {
    //         await Promise.all(connection.connections.map((con) => con.disconnect()));
    //     }
    // }

    @OnCommand({name: 'next'})
    async onNext() {
        this.playNext();
    }

    private async startPlay(url: string) {
        this.dispatcher = this.connection.play(ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }));

        const volume = await this.dbService.read(DB.MUSIC_VOLUME);
        this.dispatcher.setVolume(volume);

        const info = await ytdl.getInfo(url)
        this.helperService.sendToBotChannel(`Сейчас играет ${info.videoDetails.title} - ${moment.duration(info.videoDetails.lengthSeconds, 'seconds').humanize()}`);

    }

    private playNext() {
        const next = this.queue.shift();
        if (!next) {
            this.stopPlay();
            return;
        }

        this.startPlay(next);
    }

    private stopPlay() {
        this.queue = [];
        if (this.dispatcher) {
            this.dispatcher.pause();
            this.dispatcher.destroy();
            this.dispatcher = null;
        }
        if (this.connection) {
            this.connection.disconnect();
        }
    }
}
