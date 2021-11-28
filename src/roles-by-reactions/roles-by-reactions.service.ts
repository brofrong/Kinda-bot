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
import {DB} from '../core/constants';
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
        if (!await this.isReactionRoleMsg(reaction.message.id)) {
            return;
        }

        const role = await this.getRoleFromConfig(reaction.emoji.id);
        if (!role) {
            return;
        }

        const guild = await this.helperService.getGuild();
        await guild.member(user.id).roles.add(role);
        const test = guild.roles.cache.get(role);
        await this.helperService.sendLog(`:white_check_mark: выдана роль ${test.name}, пользователю ${user.username}`);
    }

    @On({event: 'messageReactionRemove'})
    async onReactionRemove(reaction: MessageReaction, user: (User | PartialUser)) {
        if (!await this.isReactionRoleMsg(reaction.message.id)) {
            return;
        }

        const role = await this.getRoleFromConfig(reaction.emoji.id);
        if (!role) {
            return;
        }

        const guild = await this.helperService.getGuild();
        await guild.member(user.id).roles.remove(role);
        const test = guild.roles.cache.get(role);
        await this.helperService.sendLog(`:negative_squared_cross_mark: Забрана роль ${test.name}, у пользователя ${user.username}`);
    }

    @Once({event: 'ready'})
    async onReady() {
        const reactionMsgId = await this.dbService.read(DB.REACTION_MSG);
        const reactionChannelId = await this.dbService.read(DB.REACTION_CHANNEL);
        try {
            const channel = (await this.discordProvider.getClient().channels.fetch(reactionChannelId)) as TextChannel;
            await channel.messages.fetch(reactionMsgId);
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
            const emijiID = content.emoteName.split(':')[2].replace('>', '');
            const emoji = guild.emojis.cache.get(emijiID);

            await this.helperService.sendSuccess(context, `Успешно добавлено роль: ${role.name} на эмоцию ${emoji.name}`)

            await this.saveRoleReaction(emoji.id, content.roleId);
        } catch (e) {
            await this.helperService.sendError(context, e);
        }
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

}
