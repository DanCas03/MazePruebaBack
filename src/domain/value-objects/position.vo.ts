import { InvalidPositionException } from '../exceptions/invalid-position.exception';

export class Position {
  constructor(readonly row: number, readonly col: number) {
    if (row < 0 || col < 0) {
      throw new InvalidPositionException(
        `Position(${row}, ${col}): row and col must be non-negative`,
      );
    }
  }

  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col;
  }
}
