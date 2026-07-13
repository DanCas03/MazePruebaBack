// Read model (CQRS-lite): forma de lectura del ranking. A diferencia del
// agregado de escritura ScoreEntry, agrega el username resuelto contra User.
export interface LeaderboardRow {
  id: string;
  userId: string;
  username: string;
  levelId: string;
  score: number;
  stars: number;
  moves: number;
  timeSeconds: number;
  createdAt: Date;
}
