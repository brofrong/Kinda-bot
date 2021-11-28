import {Expose, Type} from 'class-transformer';
import {IsNotEmpty, IsNumber, Min, Max} from 'class-validator';
import {ArgNum} from 'discord-nestjs';

export class PlayDto {
    @ArgNum(() => ({position: 1}))
    @Expose()
    @IsNotEmpty()
    url: string;
}

export class VolumeDto {
    @ArgNum(() => ({position: 1}))
    @Expose()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Max(200)
    @Min(0)
    volume: number;
}
