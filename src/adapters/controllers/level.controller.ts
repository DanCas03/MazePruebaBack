import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { LEVEL_REPOSITORY } from '../../application/ports/i-level.repository';
import type { ILevelRepository } from '../../application/ports/i-level.repository';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { LevelMapper, LevelResponseDto } from '../mappers/level.mapper';
import { LoggingInterceptor } from '../../shared/aspects/logging.interceptor';

/**
 * Controlador HTTP de niveles.
 *
 * SRP: sólo traduce HTTP → puerto → DTO de respuesta; no contiene lógica de
 * negocio. El logging es transversal (AOP) vía [LoggingInterceptor], por lo que
 * el controlador no tiene ni una sola llamada al logger.
 */
@Controller('levels')
@UseInterceptors(LoggingInterceptor)
export class LevelController {
  constructor(
    @Inject(LEVEL_REPOSITORY) private readonly levels: ILevelRepository,
  ) {}

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LevelResponseDto> {
    const dto = await this.levels.findById(LevelId.of(id));
    if (!dto) {
      throw new NotFoundException(`Nivel ${id} no encontrado`);
    }
    return LevelMapper.toResponseDto(dto);
  }
}
