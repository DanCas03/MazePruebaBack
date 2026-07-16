import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { IScoreRepository } from '../../application/ports/i-score.repository';
import type { LeaderboardRow } from '../../application/read-models/leaderboard-row';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { LevelId } from '../../domain/value-objects/level-id.vo';

// Adapter: implementa IScoreRepository con Prisma.
@Injectable()
export class PrismaScoreRepository implements IScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(entry: ScoreEntry): Promise<void> {
    await this.prisma.scoreEntry.create({
      data: {
        id: entry.id.value,
        userId: entry.userId.value,
        levelId: entry.levelId.value,
        score: entry.score.value,
        stars: entry.stars.value,
        moves: entry.moves.value,
        timeSeconds: entry.time.seconds,
        createdAt: entry.createdAt,
      },
    });
  }

  // Lectura del ranking: (1) top-N por nivel (score desc, createdAt asc como
  // desempate — el índice (levelId, score) soporta la consulta); (2) resuelve
  // los userId distintos contra User para adjuntar el username; (3) arma las
  // filas de lectura. Fallback defensivo si un score apunta a un usuario que ya
  // no existe.
  async findLeaderboard(
    levelId: LevelId,
    limit: number,
  ): Promise<LeaderboardRow[]> {
    const scores = await this.prisma.scoreEntry.findMany({
      where: { levelId: levelId.value },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });

    const userIds = [...new Set(scores.map((s) => s.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });
    const usernameById = new Map(users.map((u) => [u.id, u.username]));

    return scores.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: usernameById.get(s.userId) ?? `player_${s.userId.slice(0, 8)}`,
      levelId: s.levelId,
      score: s.score,
      stars: s.stars,
      moves: s.moves,
      timeSeconds: s.timeSeconds,
      createdAt: s.createdAt,
    }));
  }

  // Mejor score y mejores estrellas por (usuario, nivel): _max por separado —
  // las estrellas top pueden venir de otra run que el score top (misma
  // semántica "best-of" que ProgressTotals del cliente). Agregado por usuario
  // en memoria: 15–50 niveles y cientos de usuarios es trivial; si algún día
  // duele, se baja a SQL crudo.
  async findGlobalTotals(
    campaignLevelIds: LevelId[],
  ): Promise<
    Array<{
      userId: string;
      username: string;
      totalScore: number;
      totalStars: number;
    }>
  > {
    const best = await this.prisma.scoreEntry.groupBy({
      by: ['userId', 'levelId'],
      where: { levelId: { in: campaignLevelIds.map((id) => id.value) } },
      _max: { score: true, stars: true },
    });

    const totals = new Map<
      string,
      { totalScore: number; totalStars: number }
    >();
    for (const row of best) {
      const t = totals.get(row.userId) ?? { totalScore: 0, totalStars: 0 };
      t.totalScore += row._max.score ?? 0;
      t.totalStars += row._max.stars ?? 0;
      totals.set(row.userId, t);
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: [...totals.keys()] } },
      select: { id: true, username: true },
    });
    const usernameById = new Map(users.map((u) => [u.id, u.username]));

    return [...totals].map(([userId, t]) => ({
      userId,
      username: usernameById.get(userId) ?? `player_${userId.slice(0, 8)}`,
      ...t,
    }));
  }
}
