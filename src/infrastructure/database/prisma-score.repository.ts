import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { IScoreRepository } from '../../application/ports/i-score.repository';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { ScoreEntryId } from '../../domain/value-objects/score-entry-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { MoveCount } from '../../domain/value-objects/move-count.vo';
import { ElapsedTime } from '../../domain/value-objects/elapsed-time.vo';

// Forma del record de persistencia (columnas de la tabla ScoreEntry). Se declara
// localmente para no filtrar tipos generados de Prisma hacia el dominio.
interface ScoreEntryRecord {
  id: string;
  userId: string;
  levelId: string;
  score: number;
  stars: number;
  moves: number;
  timeSeconds: number;
  createdAt: Date;
}

// Adapter: implementa IScoreRepository con Prisma. Mapea entre el record de
// persistencia y la entidad de dominio ScoreEntry (reconstruyendo sus VOs).
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

  async findTopByLevel(levelId: LevelId, limit: number): Promise<ScoreEntry[]> {
    // Ranking: mayor score primero; empate resuelto por el más antiguo (quien lo
    // logró antes queda arriba). El índice (levelId, score) soporta esta consulta.
    const records = await this.prisma.scoreEntry.findMany({
      where: { levelId: levelId.value },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });
    return records.map((record) => PrismaScoreRepository.toDomain(record));
  }

  private static toDomain(record: ScoreEntryRecord): ScoreEntry {
    return new ScoreEntry(
      new ScoreEntryId(record.id),
      new UserId(record.userId),
      new LevelId(record.levelId),
      new Score(record.score),
      new Stars(record.stars),
      new MoveCount(record.moves),
      new ElapsedTime(record.timeSeconds),
      record.createdAt,
    );
  }
}
