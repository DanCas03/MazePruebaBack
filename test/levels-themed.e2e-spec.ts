import type { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  httpServer,
  PrismaServiceMock,
} from './create-test-app';

// e2e del wire temático (back#31, ADR 0004): sección en el catálogo e
// Instrucciones de pintado (palette + paintRole) como passthrough opaco.
// PrismaService está mockeado — se verifica el contrato HTTP, no la BD.
describe('Themed section and paint wire (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;

  // Nivel temático sintético, representativo de cómo el seed persiste un t-*:
  // order null, section themed, palette y paintRole DENTRO de data. Fixture
  // in-memory (Prisma mockeado) para verificar el contrato HTTP del wire
  // temático, desacoplado del contenido real de prisma/levels/.
  const themedRecord = {
    id: 't-smoke',
    order: null,
    section: 'themed',
    data: {
      cols: 6,
      rows: 6,
      palette: { cara: '#FBBF24', ojo: '#1E293B' },
      // Máscara de silueta (ADR 0004, back#53): región -> celdas de relleno.
      silhouette: {
        ojo: [
          [1, 1],
          [1, 2],
          [1, 3],
          [1, 4],
        ],
        cara: [
          [4, 1],
          [4, 2],
          [4, 3],
          [4, 4],
        ],
      },
      arrows: [
        {
          id: 'a1',
          headDir: 'up',
          cells: [
            [1, 1],
            [1, 2],
          ],
          paintRole: 'ojo',
        },
        {
          id: 'a2',
          headDir: 'up',
          cells: [
            [1, 4],
            [1, 3],
          ],
          paintRole: 'ojo',
        },
        {
          id: 'a3',
          headDir: 'down',
          cells: [
            [4, 1],
            [4, 2],
            [4, 3],
            [4, 4],
          ],
          paintRole: 'cara',
        },
      ],
    },
  };

  // Record de campaña PRE-back#31 (sin columna section): debe comportarse
  // como campaign — retro-compat con backs/datos viejos.
  const legacyCampaignRecord = {
    id: 'level-01',
    order: 1,
    data: {
      cols: 3,
      rows: 3,
      arrows: [
        {
          id: 'a',
          headDir: 'right',
          cells: [
            [1, 0],
            [1, 1],
          ],
        },
      ],
    },
  };

  // Los 15 fixtures curados reales, como records legacy (sin section): la
  // regresión de campaña completa contra el catálogo.
  const campaignFixtureRecords = () => {
    const dir = path.join(process.cwd(), 'prisma', 'levels');
    return fs
      .readdirSync(dir)
      .filter((file) => /^level-\d+\.json$/.test(file))
      .map((file) => {
        const fixture = JSON.parse(
          fs.readFileSync(path.join(dir, file), 'utf8'),
        ) as {
          levelId: string;
          order: number;
          cols: number;
          rows: number;
          timeLimitSec?: number;
          arrows: unknown[];
        };
        return {
          id: fixture.levelId,
          order: fixture.order,
          data: {
            cols: fixture.cols,
            rows: fixture.rows,
            ...(fixture.timeLimitSec !== undefined
              ? { timeLimitSec: fixture.timeLimitSec }
              : {}),
            arrows: fixture.arrows,
          },
        };
      })
      .sort((a, b) => a.order - b.order);
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

  describe('GET /levels (catalog with sections)', () => {
    it('returns section for every level: campaign first in play order, themed after', async () => {
      // Arrange — la BD devuelve el catálogo ya ordenado (campaña, luego temáticos).
      const campaign = campaignFixtureRecords();
      prisma.level.findMany.mockResolvedValue([...campaign, themedRecord]);

      // Act
      const res = await request(httpServer(app)).get('/levels').expect(200);

      // Assert — 15 de campaña intactos + 1 temático, todos con section.
      const body = res.body as { levelId: string; section: string }[];
      expect(body).toHaveLength(16);
      expect(body.slice(0, 15)).toEqual(
        campaign.map((record) => ({
          levelId: record.id,
          section: 'campaign',
        })),
      );
      expect(body[15]).toEqual({ levelId: 't-smoke', section: 'themed' });
    });

    it('treats records without a section column as campaign (retro-compat)', async () => {
      // Arrange
      prisma.level.findMany.mockResolvedValue([legacyCampaignRecord]);

      // Act
      const res = await request(httpServer(app)).get('/levels').expect(200);

      // Assert
      expect(res.body).toEqual([{ levelId: 'level-01', section: 'campaign' }]);
    });
  });

  describe('GET /levels/:id (themed level with paint instructions)', () => {
    it('round-trips palette, per-arrow paintRole and silhouette intact (#53)', async () => {
      // Arrange
      prisma.level.findUnique.mockResolvedValue(themedRecord);

      // Act
      const res = await request(httpServer(app))
        .get('/levels/t-smoke')
        .expect(200);

      // Assert — passthrough opaco, byte a byte lo sembrado. themedRecord no
      // trae timeLimitSec en su data (legado pre-regeneración, ADR 0006), así
      // que el builder aplica el provisional max(30, nº flechas * 6): 3
      // flechas ⇒ 30.
      expect(res.body).toEqual({
        levelId: 't-smoke',
        cols: 6,
        rows: 6,
        timeLimitSec: 30,
        palette: { cara: '#FBBF24', ojo: '#1E293B' },
        silhouette: {
          ojo: [
            [1, 1],
            [1, 2],
            [1, 3],
            [1, 4],
          ],
          cara: [
            [4, 1],
            [4, 2],
            [4, 3],
            [4, 4],
          ],
        },
        arrows: [
          {
            id: 'a1',
            headDir: 'up',
            cells: [
              [1, 1],
              [1, 2],
            ],
            paintRole: 'ojo',
          },
          {
            id: 'a2',
            headDir: 'up',
            cells: [
              [1, 4],
              [1, 3],
            ],
            paintRole: 'ojo',
          },
          {
            id: 'a3',
            headDir: 'down',
            cells: [
              [4, 1],
              [4, 2],
              [4, 3],
              [4, 4],
            ],
            paintRole: 'cara',
          },
        ],
      });
    });

    it('keeps the campaign wire free of palette, paintRole and silhouette keys (no semantics change)', async () => {
      // Arrange
      prisma.level.findUnique.mockResolvedValue(legacyCampaignRecord);

      // Act
      const res = await request(httpServer(app))
        .get('/levels/level-01')
        .expect(200);

      // Assert
      expect(res.body).not.toHaveProperty('palette');
      expect(res.body).not.toHaveProperty('silhouette');
      const arrows = (res.body as { arrows: object[] }).arrows;
      arrows.forEach((arrow) => {
        expect(arrow).not.toHaveProperty('paintRole');
      });
    });
  });

  describe('GET /levels/:id/solution (themed levels are solvable Levels)', () => {
    it('returns 200 with a clearing order for the themed smoke level', async () => {
      // Arrange
      prisma.level.findUnique.mockResolvedValue(themedRecord);

      // Act
      const res = await request(httpServer(app))
        .get('/levels/t-smoke/solution')
        .expect(200);

      // Assert — greedy determinista: todas salen de una, orden congelado.
      expect(res.body).toEqual({
        levelId: 't-smoke',
        solution: ['a1', 'a2', 'a3'],
      });
    });
  });
});
