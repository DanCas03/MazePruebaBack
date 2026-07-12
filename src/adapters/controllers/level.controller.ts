import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetLevelUseCase } from '../../application/use-cases/get-level.use-case';
import { ListLevelsUseCase } from '../../application/use-cases/list-levels.use-case';
import {
  LevelMapper,
  LevelResponseDto,
  LevelSummaryDto,
} from '../mappers/level.mapper';
import { ErrorResponseDto } from '../dtos/error-response.dto';

// Adapter: expone Level (back#5) vía HTTP. El controlador solo traduce
// HTTP <-> use cases (DIP); no conoce ILevelRepository ni Prisma.
@ApiTags('levels')
@Controller('levels')
export class LevelController {
  constructor(
    private readonly getLevelUseCase: GetLevelUseCase,
    private readonly listLevelsUseCase: ListLevelsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List level ids in play order' })
  @ApiResponse({ status: 200, description: 'Level ids, in play order.' })
  async list(): Promise<LevelSummaryDto[]> {
    const levels = await this.listLevelsUseCase.execute();
    return levels.map((level) => LevelMapper.toSummaryDto(level));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a level by id (arrow-path wire contract)' })
  @ApiResponse({ status: 200, description: 'Full arrow-path level.' })
  @ApiResponse({
    status: 404,
    description: 'Level not found.',
    type: ErrorResponseDto,
  })
  async getById(@Param('id') id: string): Promise<LevelResponseDto> {
    const level = await this.getLevelUseCase.execute(id);
    return LevelMapper.toDto(level);
  }
}
