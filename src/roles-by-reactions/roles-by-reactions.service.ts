import {Injectable, Logger} from '@nestjs/common';
import {
    Client,
    ClientProvider,
    Content,
    Context,
    On,
    Once,
    OnCommand,
    TransformPipe,
    UseGuards,
    UsePipes,
    ValidationPipe
} from 'discord-nestjs';
import {Message, MessageReaction, PartialUser, TextChannel, User} from 'discord.js';
import {DB, TRAVELER_ROLE, WELCOME_CHANNEL, WELCOME_MSG} from '../core/constants';
import {DbService} from '../core/db/db.service';
import {ElderGuard} from '../core/guard/elder.guard';
import {HelperService} from '../core/helper.service';
import {AddRoleReactionDto, SetRoleMsgDto} from './roles-by-reactions.dto';

@Injectable()
export class RolesByReactionsService {
    private readonly logger = new Logger(RolesByReactionsService.name);

    constructor(
        private dbService: DbService,
        private helperService: HelperService,
    ) {
    }

    @Client()
    discordProvider: ClientProvider;

    @On({event: 'messageReactionAdd'})
    async onReaction(reaction: MessageReaction, user: (User | PartialUser)) {
        if(((reaction.message.id === WELCOME_MSG) && (reaction.emoji.name === '👍'))) {
            await this.setTraveler(user);
            const guild = await this.helperService.getGuild();
            const roleName = guild.roles.cache.get(TRAVELER_ROLE).name;
            await this.helperService.sendLog(`:white_check_mark: выдана роль ${roleName}, пользователю ${user.username}`);
            return;
        }

        if (!(await this.isReactionRoleMsg(reaction.message.id))) {
            return;
        }

        const role = await this.getRoleFromConfig(reaction.emoji.id || reaction.emoji.name);
        if (!role) {
            return;
        }

        const guild = await this.helperService.getGuild();
        await guild.member(user.id).roles.add(role);
        const roleName = guild.roles.cache.get(role).name;
        await this.helperService.sendLog(`:white_check_mark: выдана роль ${roleName}, пользователю ${user.username}`);
    }

    @On({event: 'messageReactionRemove'})
    async onReactionRemove(reaction: MessageReaction, user: (User | PartialUser)) {
        if (!await this.isReactionRoleMsg(reaction.message.id)) {
            return;
        }

        const role = await this.getRoleFromConfig(reaction.emoji.id || reaction.emoji.name);
        if (!role) {
            return;
        }

        const guild = await this.helperService.getGuild();
        await guild.member(user.id).roles.remove(role);
        const roleName = guild.roles.cache.get(role).name;
        await this.helperService.sendLog(`:negative_squared_cross_mark: Забрана роль ${roleName}, у пользователя ${user.username}`);
    }

    @Once({event: 'ready'})
    async onReady() {
        const reactionMsgId = await this.dbService.read(DB.REACTION_MSG);
        const reactionChannelId = await this.dbService.read(DB.REACTION_CHANNEL);
        try {
            const channel = (await this.discordProvider.getClient().channels.fetch(reactionChannelId)) as TextChannel;
            await channel.messages.fetch(reactionMsgId);

            const welcomeChannel = (await this.discordProvider.getClient().channels.fetch(WELCOME_CHANNEL)) as TextChannel;
            await welcomeChannel.messages.fetch(WELCOME_MSG);
        } catch (e) {
            this.logger.error(e);
        }
    }

    @OnCommand({name: 'setRoleMsg'})
    @UseGuards(ElderGuard)
    @UsePipes(TransformPipe, ValidationPipe)
    async onSetRoleMsg(
        @Content() content: SetRoleMsgDto,
        @Context() [context]: [Message]
    ) {
        try {
            const channel = (await this.discordProvider.getClient().channels.fetch(content.channelId)) as TextChannel;
            await channel.messages.fetch(content.msgId);
            await this.helperService.sendSuccess(context, `Новое сообщение для ролей успешно поставлено на ${content.msgId} в канале ${channel.name}`);

            await this.dbService.write(DB.REACTION_MSG, content.msgId);
            await this.dbService.write(DB.REACTION_CHANNEL, content.channelId);
        } catch (e) {
            await this.helperService.sendError(context, e);
        }
        this.logger.log(`new msg is ${content.msgId}`);
    }

    @OnCommand({name: 'addRoleReaction'})
    @UseGuards(ElderGuard)
    @UsePipes(TransformPipe, ValidationPipe)
    async onAddRoleReaction(
        @Content() content: AddRoleReactionDto,
        @Context() [context]: [Message]
    ) {
        try {
            const guild = await this.helperService.getGuild();
            const role = await guild.roles.fetch(content.roleId);
            const emijiID = content.emoteName.split(/:(.*?):/)[1] || content.emoteName;
            const emoji = guild.emojis.cache.get(emijiID)?.name || content.emoteName;

            await this.helperService.sendSuccess(context, `Успешно добавлено роль: ${role.name} на эмоцию ${emoji}`)

            await this.saveRoleReaction(emoji, content.roleId);
        } catch (e) {
            await this.helperService.sendError(context, e);
        }
    }

    @OnCommand({name: 'roleList'})
    @UseGuards(ElderGuard)
    async onRoleList(msg: Message) {
        const guild = await this.helperService.getGuild();
        const Roles = await this.dbService.read(DB.ROLE_CONFIG);
        const text = (await Promise.all(Object.keys(Roles).map( async (key) => {
            const emoji = guild.emojis.cache.get(key)?.name || key;
            const role = await guild.roles.fetch(Roles[key])
            return `:${emoji}: - ${role.name}`
        }))).join('\n');
        await this.helperService.sendSuccess(msg, text);
    }

    private async isReactionRoleMsg(messageId: string): Promise<boolean> {
        const reactionMsgId = await this.dbService.read(DB.REACTION_MSG);
        return messageId === reactionMsgId;
    }

    private async getRoleFromConfig(emojiId: string) {
        const roleConfig = await this.dbService.read(DB.ROLE_CONFIG) || {};
        return roleConfig[emojiId];
    }

    private async saveRoleReaction(emojiId: string, roleId: string) {
        let roleConfig = await this.dbService.read(DB.ROLE_CONFIG) || {};
        roleConfig = Object.assign(roleConfig, {[emojiId]: roleId});
        await this.dbService.write(DB.ROLE_CONFIG, roleConfig);
    }

    private async setTraveler(user: User | PartialUser) {
        const guild = await this.helperService.getGuild();
        await guild.member(user.id).roles.add(TRAVELER_ROLE);
    }

}
