import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LevelModule } from './adapters/level.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LevelModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
