import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';

// Adapter: traduce HTTP requests a invocaciones de use cases (DIP).
// El controlador no conoce IUserRepository ni ningún detalle de infraestructura;
// delega únicamente en los use cases inyectados.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and return a signed JWT' })
  @ApiResponse({ status: 201, description: 'Account created; returns a JWT.' })
  // UserAlreadyExistsException no está mapeada en DomainExceptionFilter, así que
  // cae al default 400 (no 409). Documentar el código real, no el asumido.
  @ApiResponse({ status: 400, description: 'Email already registered.' })
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
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  async login(@Body() dto: LoginDto): Promise<{ token: string }> {
    const token = await this.loginUseCase.execute(dto.email, dto.password);
    return { token };
  }
}
