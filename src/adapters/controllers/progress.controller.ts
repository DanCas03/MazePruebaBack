import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SyncProgressUseCase } from '../../application/use-cases/sync-progress.use-case';
import { GetProgressUseCase } from '../../application/use-cases/get-progress.use-case';
import { JwtAuthGuard } from '../../infrastructure/security/jwt-auth.guard';
import { SyncProgressDto } from '../dtos/sync-progress.dto';
import {
  ProgressMapper,
  ProgressEntryResponseDto,
} from '../mappers/progress.mapper';
import type { AuthenticatedRequest } from '../http/authenticated-request.interface';

// Adapter: expone Progress (back#8) vía HTTP. El controlador solo traduce
// HTTP <-> use cases (DIP); no conoce IProgressRepository ni Prisma.
@ApiTags('progress')
@Controller('progress')
export class ProgressController {
  constructor(
    private readonly syncProgressUseCase: SyncProgressUseCase,
    private readonly getProgressUseCase: GetProgressUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync player progress (completed levels + best scores)',
  })
  @ApiResponse({
    status: 201,
    description: 'Progress merged and persisted.',
    type: [ProgressEntryResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid progress payload.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async syncProgress(
    @Body() dto: SyncProgressDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProgressEntryResponseDto[]> {
    const merged = await this.syncProgressUseCase.execute({
      userId: req.user.userId,
      levels: dto.levels,
    });
    return merged.map((entry) => ProgressMapper.toDto(entry));
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's progress" })
  @ApiResponse({
    status: 200,
    description: 'Progress for the authenticated user.',
    type: [ProgressEntryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async getProgress(
    @Req() req: AuthenticatedRequest,
  ): Promise<ProgressEntryResponseDto[]> {
    const entries = await this.getProgressUseCase.execute(req.user.userId);
    return entries.map((entry) => ProgressMapper.toDto(entry));
  }
}
