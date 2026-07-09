import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProgressEntryDto {
  @ApiProperty({ example: 'level-07', description: 'Id of the level' })
  @IsString()
  levelId!: string;

  @ApiProperty({ example: true, description: 'Whether the level was cleared' })
  @IsBoolean()
  completed!: boolean;

  @ApiPropertyOptional({
    example: 1200,
    description: 'Best score achieved on this level, if any',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  bestScore?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  bestStars?: number;
}

export class SyncProgressDto {
  @ApiProperty({ type: [ProgressEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressEntryDto)
  levels!: ProgressEntryDto[];
}
