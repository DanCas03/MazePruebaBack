-- ADR 0004 (back#31): temáticos sin orden de juego + columna de sección.
-- order pasa a nullable (los temáticos van con order = NULL; NULLs son
-- distintos en el índice único de Postgres). section default 'campaign'
-- para que todo Level existente quede en la campaña (retro-compat).
-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "section" TEXT NOT NULL DEFAULT 'campaign',
ALTER COLUMN "order" DROP NOT NULL;
