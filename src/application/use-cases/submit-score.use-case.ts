import { randomUUID } from 'crypto';
import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { ScoreEntryId } from '../../domain/value-objects/score-entry-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { MoveCount } from '../../domain/value-objects/move-count.vo';
import { ElapsedTime } from '../../domain/value-objects/elapsed-time.vo';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';

// Datos crudos de entrada (aún primitivos): los VOs validan cada campo al
// construir la entidad, así que cualquier valor inválido lanza DomainException
// antes de tocar el repositorio. `previewScore` es el valor optimista
// calculado en el cliente; nunca se persiste, solo se contrasta (ADR 0006).
export interface SubmitScoreCommand {
  userId: string;
  levelId: string;
  moves: number;
  timeSeconds: number;
  collisions: number;
  previewScore: number;
}

// Command pattern: encapsula la operación "registrar un puntaje". Depende solo
// de puertos (DIP); es framework-free (se instancia con `new`, no con DI de Nest).
export class SubmitScoreUseCase {
  constructor(
    private readonly scoreRepo: IScoreRepository,
    private readonly levelRepo: ILevelRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(cmd: SubmitScoreCommand): Promise<ScoreEntry> {
    const levelId = new LevelId(cmd.levelId);
    const level = await this.levelRepo.findById(levelId);
    if (!level) {
      throw new LevelNotFoundException(`Level '${cmd.levelId}' not found`);
    }

    // ADR 0006: el back es la autoridad del score — deriva de las métricas de
    // la partida, nunca acepta el número calculado por el cliente.
    const score = Score.fromRun({
      moves: cmd.moves,
      optimalMoves: level.arrows.length,
      collisions: cmd.collisions,
      timeSeconds: cmd.timeSeconds,
      timeLimitSec: level.timeLimitSec,
    });
    const stars = Stars.rate({
      moves: cmd.moves,
      optimalMoves: level.arrows.length,
      collisions: cmd.collisions,
    });

    // previewScore es un valor de contraste: divergencia = señal de fórmulas
    // desincronizadas (app vieja tras tunear constantes) o manipulación.
    // Política ADR 0006: solo se loguea, nunca se rechaza.
    if (cmd.previewScore !== score.value) {
      this.logger.warn(
        `Preview score mismatch for level '${cmd.levelId}' by user '${cmd.userId}': preview=${cmd.previewScore} canonical=${score.value}`,
        SubmitScoreUseCase.name,
      );
    }

    const entry = new ScoreEntry(
      new ScoreEntryId(randomUUID()),
      new UserId(cmd.userId),
      levelId,
      score,
      stars,
      new MoveCount(cmd.moves),
      new ElapsedTime(cmd.timeSeconds),
      new Date(),
    );

    await this.scoreRepo.save(entry);
    this.logger.log(
      `Score ${entry.score.value} derived for level '${entry.levelId.value}' by user '${cmd.userId}'`,
      SubmitScoreUseCase.name,
    );

    return entry;
  }
}
