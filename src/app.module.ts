import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LevelModule } from './adapters/level.module';
import { AuthModule } from './adapters/auth.module';
import { ScoreModule } from './adapters/score.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { LoggingInterceptor } from './shared/aspects/logging.interceptor';
import { DomainExceptionFilter } from './shared/aspects/domain-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    LevelModule,
    AuthModule,
    ScoreModule,
  ],
  providers: [
    // AOP global: logging de requests y traducción de excepciones de dominio
    // a códigos HTTP (p.ej. LevelNotFoundException -> 404).
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
