import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  ILevelRepository,
  LevelCellDto,
  LevelDto,
} from '../../application/ports/i-level.repository';
import { LevelId } from '../../domain/value-objects/level-id.vo';

/** Estructura del JSON persistido en la columna `cellsJson`. */
interface CellsPayload {
  playerStart: { x: number; y: number };
  cells: LevelCellDto[];
}

/**
 * Implementación del puerto [ILevelRepository] usando Prisma/PostgreSQL.
 *
 * DIP: la aplicación depende de la interfaz; aquí vive TODO el detalle de
 * persistencia (Prisma, parseo del JSON). El puerto nunca expone tipos del ORM
 * hacia las capas internas.
 */
@Injectable()
export class PrismaLevelRepository implements ILevelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: LevelId): Promise<LevelDto | null> {
    const row = await this.prisma.level.findUnique({ where: { id: id.value } });
    if (!row) {
      return null;
    }

    const payload = JSON.parse(row.cellsJson) as CellsPayload;
    return {
      id: row.id,
      width: row.width,
      height: row.height,
      playerStart: payload.playerStart,
      cells: payload.cells,
    };
  }
}
