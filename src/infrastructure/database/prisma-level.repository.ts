import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { ILevelRepository } from '../../application/ports/i-level.repository';
import { Level } from '../../domain/entities/level.entity';
import { LevelBuilder } from '../../domain/entities/level.builder';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import type { ArrowPrimitives } from '../../domain/entities/arrow.factory';

// Forma del record de persistencia (columnas de la tabla Level). Se declara
// localmente para no filtrar tipos generados de Prisma hacia el dominio.
interface LevelRecord {
  id: string;
  data: unknown;
  order: number;
}

// Forma cruda del JSON arrow-path guardado en Level.data (CONTEXT-MAP.md).
interface LevelDataPrimitives {
  cols: number;
  rows: number;
  timeLimitSec?: number;
  arrows: ArrowPrimitives[];
}

// Adapter: implementa ILevelRepository con Prisma. Reconstruye Level desde
// Level.data vía LevelBuilder (Builder), que a su vez delega el parseo de
// cada flecha en ArrowFactory (Factory Method).
@Injectable()
export class PrismaLevelRepository implements ILevelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: LevelId): Promise<Level | null> {
    const record = await this.prisma.level.findUnique({
      where: { id: id.value },
    });
    return record ? PrismaLevelRepository.toDomain(record) : null;
  }

  async findAllOrdered(): Promise<Level[]> {
    const records = await this.prisma.level.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map((record) => PrismaLevelRepository.toDomain(record));
  }

  private static toDomain(record: LevelRecord): Level {
    const data = record.data as LevelDataPrimitives;
    const builder = new LevelBuilder(new LevelId(record.id))
      .withDimensions(data.cols, data.rows)
      .withTimeLimit(data.timeLimitSec);
    data.arrows.forEach((raw) => builder.addArrow(raw));
    return builder.build();
  }
}
