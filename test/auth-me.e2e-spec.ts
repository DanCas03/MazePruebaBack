import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  httpServer,
  PrismaServiceMock,
} from './create-test-app';

// e2e de GET /auth/me (back#44): el endpoint protegido resuelve el perfil del
// usuario autenticado a partir del `sub` del JWT. Prisma queda mockeado (sin
// Postgres); el JWT es real, firmado con el mismo secret que valida el guard.
describe('GET /auth/me (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;
  let token: string;

  const userRecord = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    username: 'player_01',
    password: '$2b$10$hashedPassword',
  };

  beforeAll(async () => {
    prisma = createPrismaServiceMock();
    app = await createTestApp(prisma);
    // Firma un token válido con el JwtService real de la app (mismo secret que
    // JwtStrategy). El payload replica el que emiten login/register.
    const jwt = app.get(JwtService, { strict: false });
    token = jwt.sign({ sub: userRecord.id, email: userRecord.email });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with the user profile for a valid bearer token', async () => {
    // Arrange
    prisma.user.findUnique.mockResolvedValue(userRecord);

    // Act
    const res = await request(httpServer(app))
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert
    expect(res.body).toEqual({
      id: 'user-uuid-1',
      username: 'player_01',
      email: 'user@example.com',
    });
    expect(res.body).not.toHaveProperty('password');
  });

  it('returns 401 when the bearer token is missing', async () => {
    // Act / Assert
    await request(httpServer(app)).get('/auth/me').expect(401);
  });

  it('returns 404 with the uniform body when the user no longer exists', async () => {
    // Arrange
    prisma.user.findUnique.mockResolvedValue(null);

    // Act
    const res = await request(httpServer(app))
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    // Assert
    expect(res.body).toEqual({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
      message: expect.any(String) as string,
    });
  });
});
