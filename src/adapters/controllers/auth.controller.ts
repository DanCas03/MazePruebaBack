import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { ErrorResponseDto } from '../dtos/error-response.dto';
import { TokenResponseDto } from '../dtos/token-response.dto';
import { JwtAuthGuard } from '../../infrastructure/security/jwt-auth.guard';
import {
  UserProfileMapper,
  UserProfileResponseDto,
} from '../mappers/user-profile.mapper';
import type { AuthenticatedRequest } from '../http/authenticated-request.interface';

// Adapter: traduce HTTP requests a invocaciones de use cases (DIP).
// El controlador no conoce IUserRepository ni ningún detalle de infraestructura;
// delega únicamente en los use cases inyectados.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and return a signed JWT' })
  @ApiResponse({
    status: 201,
    description: 'Account created; returns a JWT.',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered, or username already taken.',
    type: ErrorResponseDto,
  })
  async register(@Body() dto: RegisterDto): Promise<{ token: string }> {
    const token = await this.registerUseCase.execute(
      dto.email,
      dto.username,
      dto.password,
    );
    return { token };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate a user and return a signed JWT' })
  @ApiResponse({
    status: 200,
    description: 'Credentials valid; returns a JWT.',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password.',
    type: ErrorResponseDto,
  })
  async login(@Body() dto: LoginDto): Promise<{ token: string }> {
    const token = await this.loginUseCase.execute(dto.email, dto.password);
    return { token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return the authenticated user's basic profile" })
  @ApiResponse({
    status: 200,
    description: 'Profile of the authenticated user (id, username, email).',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid bearer token.',
  })
  @ApiResponse({
    status: 404,
    description: 'The token is valid but the user no longer exists.',
    type: ErrorResponseDto,
  })
  async me(@Req() req: AuthenticatedRequest): Promise<UserProfileResponseDto> {
    const user = await this.getCurrentUserUseCase.execute(req.user.userId);
    return UserProfileMapper.toDto(user);
  }
}
