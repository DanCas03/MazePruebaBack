import { LevelId } from '../../domain/value-objects/level-id.vo';

/** Celda en formato de transferencia (datos planos, sin entidades de dominio). */
export interface LevelCellDto {
  x: number;
  y: number;
  type: string;
  direction?: string;
}

/** Representación plana de un nivel que cruza el límite de la infraestructura. */
export interface LevelDto {
  id: number;
  width: number;
  height: number;
  playerStart: { x: number; y: number };
  cells: LevelCellDto[];
}

/**
 * Puerto de acceso a niveles (DIP).
 *
 * La capa de aplicación/adaptadores depende de esta interfaz; la implementación
 * concreta (Prisma, memoria, API…) vive en infraestructura. Recibe un Value
 * Object [LevelId] en lugar de un `number` suelto.
 */
export interface ILevelRepository {
  findById(id: LevelId): Promise<LevelDto | null>;
}

/** Token de inyección del repositorio de niveles. */
export const LEVEL_REPOSITORY = Symbol('ILevelRepository');
