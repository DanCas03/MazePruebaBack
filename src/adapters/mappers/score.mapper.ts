import { ApiProperty } from '@nestjs/swagger';
import type { ScoreEntry } from '../../domain/entities/score-entry.entity';
import type { LeaderboardRow } from '../../application/read-models/leaderboard-row';
import type {
  GlobalLeaderboard,
  GlobalLeaderboardRow,
} from '../../application/read-models/global-leaderboard';

export class ScoreEntryResponseDto {
  @ApiProperty({ example: 'clx1a2b3c4d5' })
  id!: string;

  @ApiProperty({ example: 'clx9z8y7x6w5' })
  userId!: string;

  @ApiProperty({ example: 'level-07' })
  levelId!: string;

  @ApiProperty({ example: 5240 })
  score!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 3 })
  stars!: number;

  @ApiProperty({ example: 12 })
  moves!: number;

  @ApiProperty({ example: 45 })
  timeSeconds!: number;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt!: string;
}

// Shape de lectura del ranking: score DTO + username (ISP — separado del DTO de
// escritura que devuelve POST /scores, que no tiene username).
export class LeaderboardEntryResponseDto extends ScoreEntryResponseDto {
  @ApiProperty({ example: 'player_01' })
  username!: string;
}

// Respuesta canónica de POST /scores: solo score/stars derivados server-side
// (ADR 0006) — el resto de campos del ScoreEntry se exponen vía leaderboard.
export class SubmitScoreResponseDto {
  @ApiProperty({ example: 5240 })
  score!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 3 })
  stars!: number;
}

// Fila del ranking global (ADR 0006): totales de campaña por jugador.
export class GlobalLeaderboardRowResponseDto {
  @ApiProperty({ example: 'clx9z8y7x6w5' })
  userId!: string;

  @ApiProperty({ example: 'player_01' })
  username!: string;

  @ApiProperty({ example: 48200, description: 'Sum of best score per level' })
  totalScore!: number;

  @ApiProperty({ example: 42, description: 'Sum of best stars per level' })
  totalStars!: number;

  @ApiProperty({ example: 1, description: '1-based global rank' })
  rank!: number;
}

// Respuesta de GET /leaderboard (ADR 0006): top global + fila del solicitante.
export class GlobalLeaderboardResponseDto {
  @ApiProperty({ type: [GlobalLeaderboardRowResponseDto] })
  top!: GlobalLeaderboardRowResponseDto[];

  @ApiProperty({
    type: GlobalLeaderboardRowResponseDto,
    nullable: true,
    description:
      'Requesting user row, or null when they have no scored levels yet',
  })
  me!: GlobalLeaderboardRowResponseDto | null;
}

export class ScoreMapper {
  static toSubmitResponse(entry: ScoreEntry): SubmitScoreResponseDto {
    return { score: entry.score.value, stars: entry.stars.value };
  }

  static leaderboardRowToDto(row: LeaderboardRow): LeaderboardEntryResponseDto {
    return {
      id: row.id,
      userId: row.userId,
      username: row.username,
      levelId: row.levelId,
      score: row.score,
      stars: row.stars,
      moves: row.moves,
      timeSeconds: row.timeSeconds,
      createdAt: row.createdAt.toISOString(),
    };
  }

  static globalRowToDto(
    row: GlobalLeaderboardRow,
  ): GlobalLeaderboardRowResponseDto {
    return { ...row };
  }

  static toGlobalLeaderboardDto(
    board: GlobalLeaderboard,
  ): GlobalLeaderboardResponseDto {
    return {
      top: board.top.map((row) => this.globalRowToDto(row)),
      me: board.me === null ? null : this.globalRowToDto(board.me),
    };
  }
}
