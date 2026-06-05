import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo de infraestructura de base de datos. Provee y exporta el
 * [PrismaService] para que los repositorios concretos lo inyecten.
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
