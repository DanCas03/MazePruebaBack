import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { configureApp } from '../src/app.setup';

// Doble de PrismaService: las e2e verifican el contrato HTTP (forma de error,
// OpenAPI), no la persistencia — Postgres queda fuera para que corran en
// cualquier máquina/CI sin base de datos.
export interface PrismaServiceMock {
  user: { findUnique: jest.Mock; create: jest.Mock };
  level: { findUnique: jest.Mock; findMany: jest.Mock };
}

export function createPrismaServiceMock(): PrismaServiceMock {
  return {
    user: { findUnique: jest.fn(), create: jest.fn() },
    level: { findUnique: jest.fn(), findMany: jest.fn() },
  };
}

// Arranca la app completa (AppModule real) con la MISMA configuración global
// que producción: configureApp es compartido con main.ts, así que pipes y
// OpenAPI aquí son exactamente los que sirve el bootstrap real.
export async function createTestApp(
  prismaMock: PrismaServiceMock,
): Promise<INestApplication> {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-test-secret';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
