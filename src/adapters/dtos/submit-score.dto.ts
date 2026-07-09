import { IsInt, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitScoreDto {
  @ApiProperty({
    example: 'level-07',
    description: 'Id of the level this score was achieved on',
  })
  @IsString()
  levelId!: string;

  @ApiProperty({ example: 1200, description: 'Score computed by the client' })
  @IsInt()
  @Min(0)
  score!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  stars!: number;

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
}
