// Read model (CQRS-lite): forma de lectura del ranking global de jugadores
// (ADR 0006). A diferencia de LeaderboardRow (por nivel), agrega totales
// campaña (mejor score / mejores estrellas por nivel) y un rank global.
export interface GlobalLeaderboardRow {
  userId: string;
  username: string;
  totalScore: number;
  totalStars: number;
  rank: number;
}

export interface GlobalLeaderboard {
  top: GlobalLeaderboardRow[];
  me: GlobalLeaderboardRow | null;
}
