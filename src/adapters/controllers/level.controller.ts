import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetLevelUseCase } from '../../application/use-cases/get-level.use-case';
import { GetSolutionUseCase } from '../../application/use-cases/get-solution.use-case';
import { ListLevelsUseCase } from '../../application/use-cases/list-levels.use-case';
import {
  LevelMapper,
  LevelResponseDto,
  LevelSummaryDto,
  SolutionResponseDto,
} from '../mappers/level.mapper';
import { ErrorResponseDto } from '../dtos/error-response.dto';
import { LevelIdValidationPipe } from '../pipes/level-id-validation.pipe';

// Adapter: expone Level (back#5) vía HTTP. El controlador solo traduce
// HTTP <-> use cases (DIP); no conoce ILevelRepository ni Prisma.
@ApiTags('levels')
@Controller('levels')
export class LevelController {
  constructor(
    private readonly getLevelUseCase: GetLevelUseCase,
    private readonly getSolutionUseCase: GetSolutionUseCase,
    private readonly listLevelsUseCase: ListLevelsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the level catalog (campaign in play order, then themed)',
    description:
      'Each item carries its catalog section: "campaign" (ordered by play ' +
      'order) or "themed" (figure levels, ordered by levelId). ADR 0004.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Level summaries: campaign levels in play order followed by themed ' +
      'levels. Every item includes levelId and section.',
    type: [LevelSummaryDto],
  })
  async list(): Promise<LevelSummaryDto[]> {
    const levels = await this.listLevelsUseCase.execute();
    return levels.map((level) => LevelMapper.toSummaryDto(level));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a level by id (arrow-path wire contract)',
    description:
      'Themed levels additionally carry opaque paint instructions: a root ' +
      '"palette" (role -> #RRGGBB hex) and an optional "paintRole" per ' +
      'arrow, plus an optional root "silhouette" (region -> fill cells ' +
      '[row, col]) describing the figure mask. None of these affect ' +
      'mechanics or solvability. ADR 0004.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Full arrow-path level. Themed levels include palette, per-arrow ' +
      'paintRole and silhouette (opaque paint/figure metadata).',
    type: LevelResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Malformed level id.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Level not found.',
    type: ErrorResponseDto,
  })
  async getById(
    @Param('id', LevelIdValidationPipe) id: string,
  ): Promise<LevelResponseDto> {
    const level = await this.getLevelUseCase.execute(id);
    return LevelMapper.toDto(level);
  }

  @Get(':id/solution')
  @ApiOperation({
    summary: 'Get the clearing Solution for a level (order of arrow ids)',
  })
  @ApiResponse({
    status: 200,
    description: 'Solution: arrow ids in clearing order.',
    type: SolutionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Malformed level id.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Level not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Level exists but has no solution.',
    type: ErrorResponseDto,
  })
  async getSolution(
    @Param('id', LevelIdValidationPipe) id: string,
  ): Promise<SolutionResponseDto> {
    const solution = await this.getSolutionUseCase.execute(id);
    return LevelMapper.toSolutionDto(id, solution);
  }
}
