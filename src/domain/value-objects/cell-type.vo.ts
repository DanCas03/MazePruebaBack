import { UnknownCellTypeException } from '../exceptions/unknown-cell-type.exception';

export enum CellTypeValue {
  ARROW = 'ARROW',
  WALL = 'WALL',
  EMPTY = 'EMPTY',
  EXIT = 'EXIT',
}

/**
 * Value Object para el tipo de una celda.
 *
 * DDD: reemplaza el `string` literal usado antes en `ICell.cellType`. El parseo
 * y la validación de tipos externos viven aquí, no esparcidos por el código.
 */
export class CellType {
  private constructor(public readonly value: CellTypeValue) {}

  static of(raw: string): CellType {
    const upper = (raw ?? '').toUpperCase();
    if (!Object.values(CellTypeValue).includes(upper as CellTypeValue)) {
      throw new UnknownCellTypeException(raw);
    }
    return new CellType(upper as CellTypeValue);
  }

  equals(other: CellType): boolean {
    return this.value === other.value;
  }
}
