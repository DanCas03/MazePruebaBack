import type { IProgressRepository } from '../ports/i-progress.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';

// Datos crudos de un nivel a sincronizar; bestScore/bestStars son opcionales
// (un nivel puede marcarse completado sin haber enviado un ScoreEntry).
export interface ProgressEntryInput {
  levelId: string;
  completed: boolean;
  bestScore?: number;
  bestStars?: number;
}

export interface SyncProgressCommand {
  userId: string;
  levels: ProgressEntryInput[];
}

// Caso de uso: sincroniza el progreso enviado por el cliente (back#8,
// CONTEXT.md "Progress"). Framework-free; depende solo de puertos (DIP).
export class SyncProgressUseCase {
  constructor(
    private readonly progressRepo: IProgressRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(cmd: SyncProgressCommand): Promise<ProgressEntry[]> {
    const userId = new UserId(cmd.userId);
    const merged: ProgressEntry[] = [];

    for (const item of cmd.levels) {
      const levelId = new LevelId(item.levelId);
      const incoming = new ProgressEntry(
        userId,
        levelId,
        item.completed,
        item.bestScore !== undefined ? new Score(item.bestScore) : null,
        item.bestStars !== undefined ? new Stars(item.bestStars) : null,
      );
      const existing = await this.progressRepo.findOne(userId, levelId);
      const result = SyncProgressUseCase.merge(existing, incoming);

      await this.progressRepo.upsert(result);
      merged.push(result);
    }

    this.logger.log(
      `Progress synced for user '${userId.value}': ${merged.length} level(s)`,
      SyncProgressUseCase.name,
    );
    return merged;
  }

  // Sync nunca degrada progreso ya persistido: si el cliente envía un valor
  // peor o ausente (p.ej. tras reinstalar la app), se conserva lo mejor de
  // ambos lados en vez de sobreescribir.
  private static merge(
    existing: ProgressEntry | null,
    incoming: ProgressEntry,
  ): ProgressEntry {
    if (!existing) {
      return incoming;
    }
    return new ProgressEntry(
      incoming.userId,
      incoming.levelId,
      existing.completed || incoming.completed,
      SyncProgressUseCase.betterScore(existing.bestScore, incoming.bestScore),
      SyncProgressUseCase.betterStars(existing.bestStars, incoming.bestStars),
    );
  }

  private static betterScore(a: Score | null, b: Score | null): Score | null {
    if (!a) return b;
    if (!b) return a;
    return a.value >= b.value ? a : b;
  }

  private static betterStars(a: Stars | null, b: Stars | null): Stars | null {
    if (!a) return b;
    if (!b) return a;
    return a.value >= b.value ? a : b;
  }
}
