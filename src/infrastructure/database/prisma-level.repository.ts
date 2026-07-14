import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { ILevelRepository } from '../../application/ports/i-level.repository';
import { Level } from '../../domain/entities/level.entity';
import { LevelBuilder } from '../../domain/entities/level.builder';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import type { ArrowPrimitives } from '../../domain/entities/arrow.factory';

// Forma del record de persistencia (columnas de la tabla Level). Se declara
// localmente para no filtrar tipos generados de Prisma hacia el dominio.
// order/section desde back#31 (ADR 0004): la campaña ordena por `order`,
// los temáticos van sin orden. `section` opcional en el tipo: los records
// pre-back#31 no la traen y deben comportarse como campaña (retro-compat).
interface LevelRecord {
  id: string;
  data: unknown;
  order: number | null;
  section?: string;
}

// Flecha tal como se persiste en Level.data: la forma wire más el rol de
// pintado opcional de los niveles temáticos (dato opaco, ADR 0004).
type StoredArrowPrimitives = ArrowPrimitives & { paintRole?: string };

// Forma cruda del JSON arrow-path guardado en Level.data (CONTEXT-MAP.md).
// `palette` solo aparece en niveles temáticos con Instrucciones de pintado.
interface LevelDataPrimitives {
  cols: number;
  rows: number;
  timeLimitSec?: number;
  palette?: Record<string, string>;
  arrows: StoredArrowPrimitives[];
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
    // Catálogo (ADR 0004): campaña primero por su orden de juego, luego los
    // temáticos (order = null va al final) ordenados por levelId.
    const records = await this.prisma.level.findMany({
      orderBy: [{ order: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
    });
    return records.map((record) => PrismaLevelRepository.toDomain(record));
  }

  private static toDomain(record: LevelRecord): Level {
    const data = record.data as LevelDataPrimitives;
    const builder = new LevelBuilder(new LevelId(record.id))
      .withDimensions(data.cols, data.rows)
      .withTimeLimit(data.timeLimitSec)
      .withSection(record.section)
      .withPaint(PrismaLevelRepository.toPaint(data));
    data.arrows.forEach((raw) => builder.addArrow(raw));
    return builder.build();
  }

  // Instrucciones de pintado como datos opacos: si el JSON trae `palette`,
  // se iza junto con los paintRole por flecha al portador LevelPaint del
  // dominio. Sin palette no hay paint (los paintRole huérfanos los rechaza
  // el seed antes de llegar aquí).
  private static toPaint(data: LevelDataPrimitives) {
    if (data.palette === undefined) {
      return undefined;
    }
    const roles: Record<string, string> = {};
    for (const arrow of data.arrows) {
      if (arrow.paintRole !== undefined) {
        roles[arrow.id] = arrow.paintRole;
      }
    }
    return { palette: data.palette, roles };
  }
}
