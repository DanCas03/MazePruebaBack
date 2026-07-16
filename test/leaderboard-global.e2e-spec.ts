import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  httpServer,
  PrismaServiceMock,
} from './create-test-app';

// e2e de GET /leaderboard (A5, ADR 0006): ejercita la ruta completa por el
// AppModule real — register (JWT real) + guard + GetGlobalLeaderboardUseCase.
// PrismaService está mockeado (sin Postgres); se verifica el contrato HTTP,
// no la persistencia. Un usuario recién registrado no tiene scores, así que
// `me` debe ser null; no se asume que `top` esté vacío (puede haber otros
// jugadores en la base real) — solo se afirma la forma del body.
describe('GET /leaderboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;

  beforeAll(async () => {
    prisma = createPrismaServiceMock();
    app = await createTestApp(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with {top, me} for a fresh user with no scores', async () => {
    // Arrange — registro: sin colisiones de email/username, persiste el user.
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(undefined);
    // Sin niveles de campaña ni scores: findGlobalTotals no encuentra al
    // usuario recién creado en los totales agregados.
    prisma.level.findMany.mockResolvedValue([]);
    prisma.scoreEntry.groupBy.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);

    const registerRes = await request(httpServer(app))
      .post('/auth/register')
      .send({
        email: 'fresh-player@example.com',
        username: 'fresh_player',
        password: 'sup3rs3cret',
      })
      .expect(201);
    const token = (registerRes.body as { token: string }).token;

    // Act
    const res = await request(httpServer(app))
      .get('/leaderboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert — forma del body, no contenido asumido de otros jugadores.
    expect(Array.isArray(res.body.top)).toBe(true);
    expect(res.body.me).toBeNull();
  });

  it('returns 401 when the bearer token is missing', async () => {
    // Act / Assert
    await request(httpServer(app)).get('/leaderboard').expect(401);
  });
});
