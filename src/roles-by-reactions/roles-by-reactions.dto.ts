import {Expose} from 'class-transformer';
import {IsNotEmpty} from 'class-validator';
import {ArgNum} from 'discord-nestjs';

export class SetRoleMsgDto {
    @ArgNum(() => ({position: 1}))
    @Expose()
    @IsNotEmpty()
    channelId: string;

    @ArgNum(() => ({position: 2}))
    @Expose()
    @IsNotEmpty()
    msgId: string;
}

export class AddRoleReactionDto {
    @ArgNum(() => ({position: 1}))
    @Expose()
    @IsNotEmpty()
    emoteName: string;

    @ArgNum(() => ({position: 2}))
    @Expose()
    @IsNotEmpty()
    roleId: string;
}
