import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { ILevelRepository } from '../../application/ports/i-level.repository';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import type { ICell } from '../../domain/entities/cell.entity';
import { CellFactory } from '../../domain/entities/cell.factory';
import { CellType } from '../../domain/value-objects/cell-type.vo';
import { Position } from '../../domain/value-objects/position.vo';
import { Direction } from '../../domain/value-objects/direction.vo';

interface RawCell {
  type: string;
  direction?: string;
  length?: number;
}

// Adapter: implementa ILevelRepository usando Prisma como ORM.
@Injectable()
export class PrismaLevelRepository implements ILevelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: LevelId): Promise<ICell[][] | null> {
    const record = await this.prisma.level.findUnique({ where: { id: id.value } });
    if (!record) return null;
    return this.deserialize(record.data as unknown as RawCell[][]);
  }

  private deserialize(data: RawCell[][]): ICell[][] {
    return data.map((row, r) =>
      row.map((raw, c) =>
        CellFactory.create(raw.type as CellType, new Position(r, c), {
          direction: raw.direction as Direction | undefined,
          length: raw.length,
        }),
      ),
    );
  }
}
