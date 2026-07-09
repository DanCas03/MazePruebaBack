import { UserId } from '../value-objects/user-id.vo';
import { LevelId } from '../value-objects/level-id.vo';
import { Score } from '../value-objects/score.vo';
import { Stars } from '../value-objects/stars.vo';

// Entidad de dominio: el progreso de un usuario en un nivel (completado +
// mejor score/estrellas), unidad que el cliente sincroniza con el servidor
// (back#8, CONTEXT.md "Progress"). bestScore/bestStars son null hasta el
// primer envío con puntaje (un nivel puede completarse sin ScoreEntry).
export class ProgressEntry {
  constructor(
    readonly userId: UserId,
    readonly levelId: LevelId,
    readonly completed: boolean,
    readonly bestScore: Score | null,
    readonly bestStars: Stars | null,
  ) {}
}
