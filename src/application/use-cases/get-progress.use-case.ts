import type { IProgressRepository } from '../ports/i-progress.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';

// Caso de uso: obtiene el progreso persistido de un usuario (back#8).
// Framework-free; depende solo de puertos (DIP).
export class GetProgressUseCase {
  constructor(
    private readonly progressRepo: IProgressRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(rawUserId: string): Promise<ProgressEntry[]> {
    const userId = new UserId(rawUserId);
    const entries = await this.progressRepo.findAllByUser(userId);

    this.logger.log(
      `Progress for user '${userId.value}' returned ${entries.length} entrie(s)`,
      GetProgressUseCase.name,
    );
    return entries;
  }
}
