import { LevelDto } from '../../application/ports/i-level.repository';

/** Contrato HTTP de respuesta para un nivel. */
export interface LevelResponseDto {
  id: number;
  width: number;
  height: number;
  playerStart: { x: number; y: number };
  cells: Array<{ x: number; y: number; type: string; direction?: string }>;
}

/**
 * Mapper Entidad/DTO interno → DTO de respuesta HTTP.
 *
 * SRP: separa el contrato público de la API de la representación interna, de
 * modo que cambiar una no rompe la otra.
 */
export class LevelMapper {
  static toResponseDto(dto: LevelDto): LevelResponseDto {
    return {
      id: dto.id,
      width: dto.width,
      height: dto.height,
      playerStart: dto.playerStart,
      cells: dto.cells.map((cell) => ({
        x: cell.x,
        y: cell.y,
        type: cell.type,
        direction: cell.direction,
      })),
    };
  }
}
