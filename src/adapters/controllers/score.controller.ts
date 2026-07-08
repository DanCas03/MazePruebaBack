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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SubmitScoreUseCase } from '../../application/use-cases/submit-score.use-case';
import { GetLeaderboardUseCase } from '../../application/use-cases/get-leaderboard.use-case';
import { JwtAuthGuard } from '../../infrastructure/security/jwt-auth.guard';
import { SubmitScoreDto } from '../dtos/submit-score.dto';
import { ScoreMapper, ScoreEntryResponseDto } from '../mappers/score.mapper';

export interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string };
}

// Adapter: expone ScoreEntry (back#7) vía HTTP. El controlador solo traduce
// HTTP <-> use cases (DIP); no conoce IScoreRepository ni Prisma.
@ApiTags('leaderboard')
@Controller()
export class ScoreController {
  constructor(
    private readonly submitScoreUseCase: SubmitScoreUseCase,
    private readonly getLeaderboardUseCase: GetLeaderboardUseCase,
  ) {}

  @Post('scores')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a score for a completed level' })
  @ApiResponse({ status: 201, description: 'Score validated and persisted.' })
  @ApiResponse({ status: 400, description: 'Invalid score payload.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async submitScore(
    @Body() dto: SubmitScoreDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ScoreEntryResponseDto> {
    const entry = await this.submitScoreUseCase.execute({
      userId: req.user.userId,
      levelId: dto.levelId,
      score: dto.score,
      stars: dto.stars,
      moves: dto.moves,
      timeSeconds: dto.timeSeconds,
    });
    return ScoreMapper.toDto(entry);
  }

  @Get('leaderboard/:levelId')
  @ApiOperation({ summary: 'Get the top scores for a level' })
  @ApiResponse({
    status: 200,
    description: 'Top scores, ordered by score desc.',
  })
  async getLeaderboard(
    @Param('levelId') levelId: string,
    @Query('limit') limit?: string,
  ): Promise<ScoreEntryResponseDto[]> {
    const parsedLimit = limit === undefined ? undefined : Number(limit);
    const entries = await this.getLeaderboardUseCase.execute(
      levelId,
      parsedLimit,
    );
    return entries.map((entry) => ScoreMapper.toDto(entry));
  }
}
