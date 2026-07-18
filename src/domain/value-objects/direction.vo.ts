// Valores en formato wire canónico (ADR-0007, CONTEXT-MAP.md): camelCase
// idéntico al nombre del literal. Las 4 ortogonales las publica RectSpace;
// las 4 diagonales las estrenará HexSpace (back#59) — hoy ningún espacio de
// producción las reconoce y RectSpace las rechaza (fail-fast). Cada espacio
// publica su subconjunto vía BoardSpace.directions (ADR-0005 D3).
export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  UP_LEFT = 'upLeft',
  UP_RIGHT = 'upRight',
  DOWN_LEFT = 'downLeft',
  DOWN_RIGHT = 'downRight',
}
