// test/levels-hex.e2e-spec.ts
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  httpServer,
  PrismaServiceMock,
} from './create-test-app';

// e2e del wire hexagonal (back#60, ADR-0007): el descriptor `space` viaja en
// el DTO y la sección 'hex' distingue a los niveles libres de la campaña.
// PrismaService mockeado — contrato HTTP, no BD. Los records deben ser Levels
// válidos: el repositorio los reconstruye vía LevelBuilder al leerlos.
describe('Hex space wire (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;

  const hexRecord = {
    id: 'hex-01',
    order: null,
    section: 'hex',
    data: {
      cols: 7,
      rows: 7,
      space: { type: 'hex', radius: 3 },
      timeLimitSec: 45,
      arrows: [
        {
          id: 'a1',
          headDir: 'up',
          cells: [
            [3, 3],
            [4, 3],
          ],
        },
      ],
    },
  };

  const themedHexRecord = {
    id: 't-snowflake',
    order: null,
    section: 'themed',
    data: {
      cols: 11,
      rows: 11,
      space: { type: 'hex', radius: 5 },
      timeLimitSec: 120,
      palette: { core: '#3B82F6', snow: '#E8F4FF' },
      silhouette: {
        core: [[5, 4]],
        snow: [
          [4, 5],
          [5, 5],
        ],
      },
      arrows: [
        {
          id: 'a1',
          headDir: 'up',
          cells: [
            [4, 5],
            [5, 5],
          ],
          paintRole: 'snow',
        },
      ],
    },
  };

  beforeAll(async () => {
    prisma = createPrismaServiceMock();
    app = await createTestApp(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.level.findUnique.mockClear();
    prisma.level.findMany.mockClear();
  });

  it('catalog exposes section "hex" for free hex levels', async () => {
    // Arrange
    prisma.level.findMany.mockResolvedValue([hexRecord]);
    // Act
    const res = await request(httpServer(app)).get('/levels').expect(200);
    // Assert
    expect(res.body).toEqual([{ levelId: 'hex-01', section: 'hex' }]);
  });

  it('serves the hex space descriptor in the level DTO', async () => {
    // Arrange
    prisma.level.findUnique.mockResolvedValue(hexRecord);
    // Act
    const res = await request(httpServer(app))
      .get('/levels/hex-01')
      .expect(200);
    // Assert
    expect(res.body).toMatchObject({
      levelId: 'hex-01',
      space: { type: 'hex', radius: 3 },
      timeLimitSec: 45,
    });
  });

  it('round-trips a themed hex level with palette, silhouette and space', async () => {
    // Arrange
    prisma.level.findUnique.mockResolvedValue(themedHexRecord);
    // Act
    const res = await request(httpServer(app))
      .get('/levels/t-snowflake')
      .expect(200);
    // Assert
    expect(res.body).toMatchObject({
      levelId: 't-snowflake',
      space: { type: 'hex', radius: 5 },
      palette: { core: '#3B82F6', snow: '#E8F4FF' },
      silhouette: {
        core: [[5, 4]],
        snow: [
          [4, 5],
          [5, 5],
        ],
      },
    });
  });
});
