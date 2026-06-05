import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Servicio de acceso a la base de datos (Capa 4).
 *
 * Encapsula el `PrismaClient` y gestiona su ciclo de vida con los hooks de
 * NestJS. La conexión inicial es tolerante a fallos: si la BD no está
 * disponible al arrancar, se registra una advertencia y la conexión se
 * intentará de forma perezosa en la primera consulta (útil para desarrollo).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Conectado a la base de datos.');
    } catch (error) {
      this.logger.warn(
        `No se pudo conectar a la BD al arrancar: ${(error as Error).message}. ` +
          'Se reintentará de forma perezosa.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
