import { randomUUID } from 'crypto';
import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { ScoreEntryId } from '../../domain/value-objects/score-entry-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { MoveCount } from '../../domain/value-objects/move-count.vo';
import { ElapsedTime } from '../../domain/value-objects/elapsed-time.vo';

// Datos crudos de entrada (aún primitivos): los VOs validan cada campo al
// construir la entidad, así que cualquier valor inválido lanza DomainException
// antes de tocar el repositorio.
export interface SubmitScoreCommand {
  userId: string;
  levelId: string;
  score: number;
  stars: number;
  moves: number;
  timeSeconds: number;
}

// Command pattern: encapsula la operación "registrar un puntaje". Depende solo
// de puertos (DIP); es framework-free (se instancia con `new`, no con DI de Nest).
export class SubmitScoreUseCase {
  constructor(
    private readonly scoreRepo: IScoreRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(cmd: SubmitScoreCommand): Promise<ScoreEntry> {
    const entry = new ScoreEntry(
      new ScoreEntryId(randomUUID()),
      new UserId(cmd.userId),
      new LevelId(cmd.levelId),
      new Score(cmd.score),
      new Stars(cmd.stars),
      new MoveCount(cmd.moves),
      new ElapsedTime(cmd.timeSeconds),
      new Date(),
    );

    await this.scoreRepo.save(entry);
    this.logger.log(
      `Score ${entry.score.value} submitted for level '${entry.levelId.value}' by user '${entry.userId.value}'`,
      SubmitScoreUseCase.name,
    );

    return entry;
  }
}
