import { ScoreEntryId } from '../value-objects/score-entry-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { LevelId } from '../value-objects/level-id.vo';
import { Score } from '../value-objects/score.vo';
import { Stars } from '../value-objects/stars.vo';
import { MoveCount } from '../value-objects/move-count.vo';
import { ElapsedTime } from '../value-objects/elapsed-time.vo';

// Entidad de dominio: el resultado que un usuario obtuvo al resolver un nivel.
// Es la unidad que alimenta el Leaderboard (ADR 0001, decisión 7). Todos sus
// campos son VOs que garantizan sus invariantes; la entidad solo los compone.
export class ScoreEntry {
  constructor(
    readonly id: ScoreEntryId,
    readonly userId: UserId,
    readonly levelId: LevelId,
    readonly score: Score,
    readonly stars: Stars,
    readonly moves: MoveCount,
    readonly time: ElapsedTime,
    readonly createdAt: Date,
  ) {}
}
