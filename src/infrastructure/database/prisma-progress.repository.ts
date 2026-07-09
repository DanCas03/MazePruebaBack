import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { IProgressRepository } from '../../application/ports/i-progress.repository';
import { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';

// Forma del record de persistencia (columnas de la tabla Progress). Se declara
// localmente para no filtrar tipos generados de Prisma hacia el dominio.
interface ProgressRecord {
  userId: string;
  levelId: string;
  completed: boolean;
  bestScore: number | null;
  bestStars: number | null;
}

// Adapter: implementa IProgressRepository con Prisma. Mapea entre el record de
// persistencia y la entidad de dominio ProgressEntry (reconstruyendo sus VOs).
@Injectable()
export class PrismaProgressRepository implements IProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: UserId): Promise<ProgressEntry[]> {
    const records = await this.prisma.progress.findMany({
      where: { userId: userId.value },
    });
    return records.map((record) => PrismaProgressRepository.toDomain(record));
  }

  async findOne(
    userId: UserId,
    levelId: LevelId,
  ): Promise<ProgressEntry | null> {
    const record = await this.prisma.progress.findUnique({
      where: {
        userId_levelId: { userId: userId.value, levelId: levelId.value },
      },
    });
    return record ? PrismaProgressRepository.toDomain(record) : null;
  }

  async upsert(entry: ProgressEntry): Promise<void> {
    const data = {
      completed: entry.completed,
      bestScore: entry.bestScore?.value ?? null,
      bestStars: entry.bestStars?.value ?? null,
    };
    await this.prisma.progress.upsert({
      where: {
        userId_levelId: {
          userId: entry.userId.value,
          levelId: entry.levelId.value,
        },
      },
      create: {
        userId: entry.userId.value,
        levelId: entry.levelId.value,
        ...data,
      },
      update: data,
    });
  }

  private static toDomain(record: ProgressRecord): ProgressEntry {
    return new ProgressEntry(
      new UserId(record.userId),
      new LevelId(record.levelId),
      record.completed,
      record.bestScore !== null ? new Score(record.bestScore) : null,
      record.bestStars !== null ? new Stars(record.bestStars) : null,
    );
  }
}
