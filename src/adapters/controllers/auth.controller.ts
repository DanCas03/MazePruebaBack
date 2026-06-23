import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';

// Adapter: traduce HTTP requests a invocaciones de use cases (DIP).
// El controlador no conoce IUserRepository ni ningún detalle de infraestructura;
// delega únicamente en los use cases inyectados.
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ token: string }> {
    const token = await this.registerUseCase.execute(dto.email, dto.password);
    return { token };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<{ token: string }> {
    const token = await this.loginUseCase.execute(dto.email, dto.password);
    return { token };
  }
}
