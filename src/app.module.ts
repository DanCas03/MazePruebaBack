import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LevelModule } from './adapters/level.module';
import { LoggingInterceptor } from './shared/aspects/logging.interceptor';
import { NestLoggerAdapter } from './infrastructure/logger/nest-logger.adapter';
import { LOGGER_SERVICE_TOKEN } from './application/ports/i-logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LevelModule,
  ],
  providers: [
    { provide: LOGGER_SERVICE_TOKEN, useClass: NestLoggerAdapter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
