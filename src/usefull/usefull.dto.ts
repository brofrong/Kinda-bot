import {Expose, Type} from 'class-transformer';
import {IsNumber, IsOptional, Max} from 'class-validator';
import {ArgNum} from 'discord-nestjs';

export class CleanDto {
    @ArgNum(() => ({position: 1}))
    @Expose()
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Max(100)
    limit: number;
}
