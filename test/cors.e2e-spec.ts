import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  httpServer,
  PrismaServiceMock,
} from './create-test-app';

// e2e de CORS: el front web dockerizado corre en el navegador del host
// (localhost:8080) y llama a la API en localhost:3000 — cross-origin. Sin las
// cabeceras Access-Control-* el navegador bloquea toda petición, aunque curl
// funcione. Verifica que configureApp (compartido con main.ts) habilita CORS.
describe('CORS (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;

  beforeAll(async () => {
    prisma = createPrismaServiceMock();
    app = await createTestApp(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns Access-Control-Allow-Origin on a cross-origin request', async () => {
    // Arrange
    prisma.level.findMany.mockResolvedValue([]);

    // Act
    const res = await request(httpServer(app))
      .get('/levels')
      .set('Origin', 'http://localhost:8080')
      .expect(200);

    // Assert
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('answers the preflight OPTIONS allowing the requested method', async () => {
    // Act
    const res = await request(httpServer(app))
      .options('/levels')
      .set('Origin', 'http://localhost:8080')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);

    // Assert
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
  });
});
