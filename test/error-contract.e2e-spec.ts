import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  PrismaServiceMock,
} from './create-test-app';

// e2e del contrato de error (back#3): toda excepción de dominio sale por
// DomainExceptionFilter con el cuerpo uniforme { statusCode, code, message }.
// toEqual asegura que son EXACTAMENTE esas tres claves.
describe('Domain error contract (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;

  beforeAll(async () => {
    prisma = createPrismaServiceMock();
    app = await createTestApp(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 404 with the uniform body when the level does not exist', async () => {
    // Arrange
    prisma.level.findUnique.mockResolvedValue(null);

    // Act
    const res = await request(app.getHttpServer())
      .get('/levels/level-99')
      .expect(404);

    // Assert
    expect(res.body).toEqual({
      statusCode: 404,
      code: 'LEVEL_NOT_FOUND',
      message: expect.any(String),
    });
  });

  it('returns 401 with the uniform body on invalid credentials', async () => {
    // Arrange
    prisma.user.findUnique.mockResolvedValue(null);

    // Act
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ghost@arrowmaze.com', password: 'whatever123' })
      .expect(401);

    // Assert
    expect(res.body).toEqual({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: expect.any(String),
    });
  });

  it('returns 409 with the uniform body when the email is already registered', async () => {
    // Arrange
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'taken@arrowmaze.com',
      password: '$2b$10$e2eFakeButNonEmptyHashValue',
    });

    // Act
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'taken@arrowmaze.com', password: 'secret123' })
      .expect(409);

    // Assert
    expect(res.body).toEqual({
      statusCode: 409,
      code: 'USER_ALREADY_EXISTS',
      message: expect.any(String),
    });
  });
});
