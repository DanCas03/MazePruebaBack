import { InvalidScoreEntryIdException } from '../exceptions/invalid-score-entry-id.exception';

// VO inmutable: identidad de un ScoreEntry. Sigue el mismo patrón que UserId
// y LevelId (string no vacío), manteniendo la identidad como concepto de dominio.
export class ScoreEntryId {
  constructor(readonly value: string) {
    if (!value || value.trim() === '') {
      throw new InvalidScoreEntryIdException('ScoreEntryId cannot be empty');
    }
  }

  equals(other: ScoreEntryId): boolean {
    return this.value === other.value;
  }
}
