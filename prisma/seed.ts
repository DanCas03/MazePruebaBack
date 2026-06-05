import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Siembra el nivel 1 (mismo layout que el asset del frontend
 * `level_1.json`). El campo `cellsJson` guarda `{ playerStart, cells }`.
 *
 * Ejecutar con: `npm run db:seed` (requiere PostgreSQL en marcha y migración
 * aplicada con `npx prisma migrate dev`).
 */
async function main(): Promise<void> {
  const cellsJson = JSON.stringify({
    playerStart: { x: 0, y: 0 },
    cells: [
      { x: 0, y: 0, type: 'empty' },
      { x: 1, y: 0, type: 'arrow', direction: 'right' },
      { x: 2, y: 0, type: 'arrow', direction: 'down' },
      { x: 3, y: 0, type: 'wall' },
      { x: 4, y: 0, type: 'wall' },
      { x: 0, y: 1, type: 'wall' },
      { x: 1, y: 1, type: 'empty' },
      { x: 2, y: 1, type: 'arrow', direction: 'right' },
      { x: 3, y: 1, type: 'arrow', direction: 'down' },
      { x: 4, y: 1, type: 'wall' },
      { x: 0, y: 2, type: 'wall' },
      { x: 1, y: 2, type: 'wall' },
      { x: 2, y: 2, type: 'empty' },
      { x: 3, y: 2, type: 'arrow', direction: 'right' },
      { x: 4, y: 2, type: 'arrow', direction: 'down' },
      { x: 0, y: 3, type: 'wall' },
      { x: 1, y: 3, type: 'wall' },
      { x: 2, y: 3, type: 'wall' },
      { x: 3, y: 3, type: 'empty' },
      { x: 4, y: 3, type: 'arrow', direction: 'down' },
      { x: 0, y: 4, type: 'wall' },
      { x: 1, y: 4, type: 'wall' },
      { x: 2, y: 4, type: 'wall' },
      { x: 3, y: 4, type: 'wall' },
      { x: 4, y: 4, type: 'exit' },
    ],
  });

  await prisma.level.upsert({
    where: { id: 1 },
    update: { width: 5, height: 5, cellsJson },
    create: { id: 1, width: 5, height: 5, cellsJson },
  });

  // eslint-disable-next-line no-console
  console.log('Seed completado: nivel 1 disponible.');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
