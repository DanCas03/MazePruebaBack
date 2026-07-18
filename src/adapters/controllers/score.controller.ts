import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SubmitScoreUseCase } from '../../application/use-cases/submit-score.use-case';
import { GetLeaderboardUseCase } from '../../application/use-cases/get-leaderboard.use-case';
import { GetGlobalLeaderboardUseCase } from '../../application/use-cases/get-global-leaderboard.use-case';
import { JwtAuthGuard } from '../../infrastructure/security/jwt-auth.guard';
import { SubmitScoreDto } from '../dtos/submit-score.dto';
import {
  ScoreMapper,
  SubmitScoreResponseDto,
  LeaderboardEntryResponseDto,
  GlobalLeaderboardResponseDto,
} from '../mappers/score.mapper';
import type { AuthenticatedRequest } from '../http/authenticated-request.interface';

export type { AuthenticatedRequest } from '../http/authenticated-request.interface';

// Adapter: expone ScoreEntry (back#7) vía HTTP. El controlador solo traduce
// HTTP <-> use cases (DIP); no conoce IScoreRepository ni Prisma.
@ApiTags('leaderboard')
@Controller()
export class ScoreController {
  constructor(
    private readonly submitScoreUseCase: SubmitScoreUseCase,
    private readonly getLeaderboardUseCase: GetLeaderboardUseCase,
    private readonly getGlobalLeaderboardUseCase: GetGlobalLeaderboardUseCase,
  ) {}

  @Post('scores')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a score for a completed level' })
  @ApiResponse({
    status: 201,
    description: 'Canonical score derived and persisted',
    type: SubmitScoreResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid score payload.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Level not found' })
  async submitScore(
    @Body() dto: SubmitScoreDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SubmitScoreResponseDto> {
    const entry = await this.submitScoreUseCase.execute({
      userId: req.user.userId,
      levelId: dto.levelId,
      moves: dto.moves,
      timeSeconds: dto.timeSeconds,
      collisions: dto.collisions,
      previewScore: dto.previewScore,
    });
    return ScoreMapper.toSubmitResponse(entry);
  }

  // NOTA: esta ruta literal debe declararse ANTES de 'leaderboard/:levelId'
  // para que Nest la resuelva primero (si no, ':levelId' capturaría 'leaderboard'
  // como id de nivel).
  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Global player ranking (campaign best-per-level totals)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max rows in the top list (defaults server-side)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top players plus requesting user row.',
    type: GlobalLeaderboardResponseDto,
  })
  async getGlobalLeaderboard(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<GlobalLeaderboardResponseDto> {
    const parsedLimit = limit === undefined ? undefined : Number(limit);
    const board = await this.getGlobalLeaderboardUseCase.execute(
      req.user.userId,
      parsedLimit,
    );
    return ScoreMapper.toGlobalLeaderboardDto(board);
  }

  @Get('leaderboard/:levelId')
  @ApiOperation({ summary: 'Get the top scores for a level' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max rows returned (defaults server-side)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top scores, ordered by score desc.',
    type: [LeaderboardEntryResponseDto],
  })
  async getLeaderboard(
    @Param('levelId') levelId: string,
    @Query('limit') limit?: string,
  ): Promise<LeaderboardEntryResponseDto[]> {
    const parsedLimit = limit === undefined ? undefined : Number(limit);
    const rows = await this.getLeaderboardUseCase.execute(levelId, parsedLimit);
    return rows.map((row) => ScoreMapper.leaderboardRowToDto(row));
  }
}
