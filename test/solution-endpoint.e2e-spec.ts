import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  httpServer,
  PrismaServiceMock,
} from './create-test-app';

// e2e de GET /levels/:id/solution (back#19). Ejercita la ruta completa por el
// AppModule real: pipe de validación del :id, use case, LevelSolver y filtro de
// errores. PrismaService está mockeado — se verifica el contrato HTTP, no la BD.
describe('Solution endpoint (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;

  // Level.data tal como lo persiste el seed (columnas id/order izadas fuera).
  const solvableRecord = {
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

  // Dos flechas en bloqueo mutuo cíclico: válido de tablero pero insoluble.
  const unsolvableRecord = {
    id: 'level-99',
    order: 99,
    data: {
      cols: 4,
      rows: 1,
      arrows: [
        {
          id: 'a',
          headDir: 'right',
          cells: [
            [0, 0],
            [0, 1],
          ],
        },
        {
          id: 'b',
          headDir: 'left',
          cells: [
            [0, 3],
            [0, 2],
          ],
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
    // El doble de Prisma se comparte en el describe; limpiar el historial de
    // llamadas deja que cada test razone sobre sus propias invocaciones.
    prisma.level.findUnique.mockClear();
  });

  it('returns 200 with the clearing order for a solvable level', async () => {
    // Arrange
    prisma.level.findUnique.mockResolvedValue(solvableRecord);

    // Act
    const res = await request(httpServer(app))
      .get('/levels/level-01/solution')
      .expect(200);

    // Assert
    expect(res.body).toEqual({ levelId: 'level-01', solution: ['a'] });
  });

  it('returns 400 with the uniform body when the id is syntactically corrupt', async () => {
    // Act — id inválido: el pipe corta antes de tocar el repositorio.
    const res = await request(httpServer(app))
      .get('/levels/Bad_Id!/solution')
      .expect(400);

    // Assert
    expect(res.body).toEqual({
      statusCode: 400,
      code: 'INVALID_LEVEL_ID',
      message: expect.any(String) as string,
    });
    expect(prisma.level.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 with the uniform body when the level does not exist', async () => {
    // Arrange
    prisma.level.findUnique.mockResolvedValue(null);

    // Act
    const res = await request(httpServer(app))
      .get('/levels/level-77/solution')
      .expect(404);

    // Assert
    expect(res.body).toEqual({
      statusCode: 404,
      code: 'LEVEL_NOT_FOUND',
      message: expect.any(String) as string,
    });
  });

  it('returns 422 with the uniform body when the level has no solution', async () => {
    // Arrange
    prisma.level.findUnique.mockResolvedValue(unsolvableRecord);

    // Act
    const res = await request(httpServer(app))
      .get('/levels/level-99/solution')
      .expect(422);

    // Assert
    expect(res.body).toEqual({
      statusCode: 422,
      code: 'UNSOLVABLE_LEVEL',
      message: expect.any(String) as string,
    });
  });
});
