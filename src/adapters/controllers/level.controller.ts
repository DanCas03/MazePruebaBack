import { Controller, Get, Param } from '@nestjs/common';
import { GetLevelUseCase } from '../../application/use-cases/get-level.use-case';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { LevelMapper, LevelResponseDto } from '../mappers/level.mapper';

@Controller('levels')
export class LevelController {
  constructor(private readonly getLevelUseCase: GetLevelUseCase) {}

  @Get(':id')
  async getLevel(@Param('id') id: string): Promise<LevelResponseDto> {
    const grid = await this.getLevelUseCase.execute(new LevelId(id));
    return LevelMapper.toDto(grid);
  }
}
