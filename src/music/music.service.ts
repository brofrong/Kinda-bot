import {Injectable, Logger} from '@nestjs/common';
import {
    Client,
    ClientProvider,
    Content,
    Context, Once,
    OnCommand,
    TransformPipe,
    UsePipes,
    ValidationPipe
} from 'discord-nestjs';
import {Message, StreamDispatcher, TextChannel, VoiceConnection} from 'discord.js';
import * as moment from 'moment';
import * as ytdl from 'ytdl-core';
import {DB, MUSIC_CHANNEL, WELCOME_CHANNEL} from '../core/constants';
import {DbService} from '../core/db/db.service';
import {HelperService} from '../core/helper.service';
import {PlayDto, VolumeDto} from './music.dto';
import {sample} from 'lodash';

type cashedMusic = {id: string, time: number, url: string, authorID: string};

@Injectable()
export class MusicService {
    private readonly logger = new Logger(MusicService.name);
    private connection: VoiceConnection;
    private dispatcher: StreamDispatcher;

    private queue: string[] = [];

    private volume: number;

    private userTag = /<@(.*?)>/;

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
        if (!message.member.voice.channel) {
            await this.helperService.sendError(message, `Вы должны находиться в войсе!`);
            return;
        }
        if (ytdl.validateURL(content.url)) {
            await this.addToQueue(message, content.url);
            return;
        }

        if (this.userTag.test(content.url)) {
            const userId = content.url.split(this.userTag)[1].replace('!', '');

            const chasedMusic: cashedMusic[] = await this.dbService.read(DB.CHASED_MUSIC);

            const userMusic = chasedMusic.filter((chased) => chased.authorID === userId);

            if(userMusic.length === 0) {
                await this.helperService.sendError(message, `У пользователя ${content.url} нет музыки`);
                return;
            }

            const toPlay: cashedMusic = sample(userMusic);

            await this.addToQueue(message, toPlay.url);
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

    @Once({event: 'ready'})
    async onReady() {
        this.loadSongFromMusicChannel();
    }

    @OnCommand({name: 'next'})
    async onNext() {
        this.playNext();
    }

    @OnCommand({name: 'test'})
    async onTest(message: Message) {
        this.logger.log(message.content);
    }

    private async addToQueue(message: Message, url: string) {
        this.connection = await message.member.voice.channel.join();
        if (!this.dispatcher) {
            await this.startPlay(url);

            this.dispatcher.on('finish', () => this.playNext());
            this.dispatcher.on('error', (e) => {
                this.logger.error(e);
                this.stopPlay();
            });
        } else {
            this.queue.push(url);
            const info = (await ytdl.getInfo(url)).videoDetails.title;
            await this.helperService.sendSuccess(message, `Добавлен в очередь : ${info}, сейчас в очереди ${this.queue.length}`);
        }
    }

    private async startPlay(url: string) {
        this.dispatcher = this.connection.play(ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }));

        const volume = await this.dbService.read(DB.MUSIC_VOLUME);
        this.dispatcher.setVolume(volume);

        const info = await ytdl.getInfo(url);
        await this.helperService.sendToBotChannel(`Сейчас играет ${info.videoDetails.title} - ${moment.utc(moment.duration(info.videoDetails.lengthSeconds, 'seconds').asMilliseconds()).format('HH:mm:ss')}`);
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

    private async loadSongFromMusicChannel() {
        const cashedMusic: cashedMusic[] = await this.dbService.read(DB.CHASED_MUSIC) || [];
        let after = null;
        let before = null;
        if (cashedMusic.length !== 0) {
            after = cashedMusic[0].id;
            before = cashedMusic[cashedMusic.length - 1].id;
        }
        let afterMusic = [];
        if(cashedMusic.length !== 0) {
            afterMusic = await this.getNewMusic(after, null);
        }
        const beforeMusic = await this.getNewMusic(null, before);
        const toLoad = [...afterMusic, ...beforeMusic, ...cashedMusic].sort((a ,b) => b.time - a.time);

        await this.dbService.write(DB.CHASED_MUSIC, toLoad);
    }

    private async getNewMusic(after: string, before: string): Promise<cashedMusic[]> {
        const musicChannel = await (await this.discordProvider.getClient().channels.fetch(MUSIC_CHANNEL)) as TextChannel;
        const messages = await musicChannel.messages.fetch({after, before});
        let newMusic: cashedMusic[] = messages.filter((msg) => !!msg.embeds[0]?.url).map((msg) =>{return {id: msg.id, time: msg.createdTimestamp, url: msg.embeds[0].url, authorID: msg.author.id}});
        return newMusic.filter((music) => ytdl.validateURL(music.url));
    }
}
