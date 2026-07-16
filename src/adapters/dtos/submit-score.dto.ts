import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitScoreDto {
  @ApiProperty({
    example: 'level-07',
    description: 'Id of the level this score was achieved on',
  })
  @IsString()
  levelId!: string;

  @ApiProperty({
    example: 12,
    description: 'Number of moves used to clear the level',
  })
  @IsInt()
  @Min(0)
  moves!: number;

  @ApiProperty({ example: 45, description: 'Elapsed time in whole seconds' })
  @IsInt()
  @Min(0)
  timeSeconds!: number;

  @ApiProperty({
    example: 1,
    description: 'Collision (strike) count of the run',
  })
  @IsInt()
  @Min(0)
  collisions!: number;

  @ApiProperty({
    example: 5240,
    description:
      'Client-side preview score, contrast value only (ADR 0006): mismatches are logged, never rejected',
  })
  @IsInt()
  @Min(0)
  previewScore!: number;
}
