import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  PrismaServiceMock,
} from './create-test-app';

// e2e de OpenAPI (back#3): el documento generado por DocumentBuilder se sirve
// (UI en /api, JSON en /api-json) y cubre los endpoints y el esquema de error.
describe('OpenAPI document (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;

  beforeAll(async () => {
    prisma = createPrismaServiceMock();
    app = await createTestApp(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves a valid OpenAPI 3 document at /api-json', async () => {
    // Act
    const res = await request(app.getHttpServer()).get('/api-json').expect(200);

    // Assert
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info.title).toBe('Arrow Maze API');
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        '/auth/register',
        '/auth/login',
        '/levels',
        '/levels/{id}',
        '/scores',
        '/leaderboard/{levelId}',
        '/progress',
      ]),
    );
  });

  it('documents the uniform error schema (ErrorResponseDto) in the components', async () => {
    // Act
    const res = await request(app.getHttpServer()).get('/api-json').expect(200);

    // Assert
    const schema = res.body.components.schemas.ErrorResponseDto;
    expect(schema).toBeDefined();
    expect(Object.keys(schema.properties)).toEqual(
      expect.arrayContaining(['statusCode', 'code', 'message']),
    );
  });

  it('serves the Swagger UI at /api', async () => {
    // Act
    const res = await request(app.getHttpServer()).get('/api').expect(200);

    // Assert
    expect(res.type).toBe('text/html');
    expect(res.text.toLowerCase()).toContain('swagger');
  });
});
