import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { PrismaUserRepository } from '../infrastructure/database/prisma-user.repository';
import { BcryptHashService } from '../infrastructure/security/bcrypt-hash.service';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import { JwtStrategy } from '../infrastructure/security/jwt.strategy';
import { AuthController } from './controllers/auth.controller';
import { USER_REPOSITORY_TOKEN } from '../application/ports/i-user.repository';
import { HASH_SERVICE_TOKEN } from '../application/ports/i-hash.service';
import { TOKEN_SERVICE_TOKEN } from '../application/ports/i-token.service';

// AuthModule cablea los puertos de autenticación como composition root:
// useFactory para instanciar use cases framework-free (DIP).
// JwtModule se registra de forma asíncrona para leer JWT_SECRET desde ConfigService
// (nunca process.env directo). El cableado de JwtTokenService inyecta la clase
// JwtService (token real que exporta @nestjs/jwt), no el string 'JwtService'.
@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get('JWT_EXPIRATION', '7d') },
      }),
    }),
  ],
  providers: [
    { provide: USER_REPOSITORY_TOKEN, useClass: PrismaUserRepository },
    { provide: HASH_SERVICE_TOKEN, useClass: BcryptHashService },
    {
      // Adapter: inyecta JwtService de @nestjs/jwt en el puerto ITokenService.
      // useFactory mantiene el use case libre de acoplamiento a @nestjs/jwt (DIP).
      provide: TOKEN_SERVICE_TOKEN,
      useFactory: (jwtService: JwtService) => new JwtTokenService(jwtService),
      inject: [JwtService],
    },
    {
      // Command pattern: RegisterUseCase encapsula el caso de uso "registrar usuario".
      // Se instancia con new (framework-free) inyectando los tres puertos.
      provide: RegisterUseCase,
      useFactory: (repo: any, hash: any, token: any) =>
        new RegisterUseCase(repo, hash, token),
      inject: [USER_REPOSITORY_TOKEN, HASH_SERVICE_TOKEN, TOKEN_SERVICE_TOKEN],
    },
    {
      // Command pattern: LoginUseCase encapsula el caso de uso "autenticar usuario".
      provide: LoginUseCase,
      useFactory: (repo: any, hash: any, token: any) =>
        new LoginUseCase(repo, hash, token),
      inject: [USER_REPOSITORY_TOKEN, HASH_SERVICE_TOKEN, TOKEN_SERVICE_TOKEN],
    },
    JwtStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
