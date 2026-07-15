import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  httpServer,
  PrismaServiceMock,
} from './create-test-app';

// Vista mínima del documento OpenAPI: solo lo que estos tests asertan.
interface OpenApiDocument {
  openapi: string;
  info: { title: string };
  paths: Record<
    string,
    Record<string, { responses?: Record<string, unknown> } | undefined>
  >;
  components: {
    schemas: Record<string, { properties: Record<string, unknown> }>;
  };
}

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
    const res = await request(httpServer(app)).get('/api-json').expect(200);

    // Assert
    const doc = res.body as OpenApiDocument;
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info.title).toBe('Arrow Maze API');
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining([
        '/auth/register',
        '/auth/login',
        '/auth/me',
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
    const res = await request(httpServer(app)).get('/api-json').expect(200);

    // Assert
    const doc = res.body as OpenApiDocument;
    const schema = doc.components.schemas.ErrorResponseDto;
    expect(schema).toBeDefined();
    expect(Object.keys(schema.properties)).toEqual(
      expect.arrayContaining(['statusCode', 'code', 'message']),
    );
  });

  it('references ErrorResponseDto exactly where the domain filter responds', async () => {
    // Act
    const res = await request(httpServer(app)).get('/api-json').expect(200);

    // Assert
    const doc = res.body as OpenApiDocument;
    const responseOf = (path: string, method: string, status: string) =>
      JSON.stringify(doc.paths[path]?.[method]?.responses?.[status] ?? {});
    const ERROR_REF = '#/components/schemas/ErrorResponseDto';

    expect(responseOf('/levels/{id}', 'get', '404')).toContain(ERROR_REF);
    expect(responseOf('/auth/login', 'post', '401')).toContain(ERROR_REF);
    expect(responseOf('/auth/register', 'post', '409')).toContain(ERROR_REF);
    // Los 401 de los guards JWT tienen la forma estándar de Nest, no la del
    // filtro de dominio: NO deben documentarse con este esquema.
    expect(responseOf('/scores', 'post', '401')).not.toContain(ERROR_REF);
    expect(responseOf('/progress', 'post', '401')).not.toContain(ERROR_REF);
  });

  it('serves the Swagger UI at /api', async () => {
    // Act
    const res = await request(httpServer(app)).get('/api').expect(200);

    // Assert
    expect(res.type).toBe('text/html');
    expect(res.text.toLowerCase()).toContain('swagger');
  });
});
