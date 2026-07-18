import * as fs from 'fs';
import * as path from 'path';
import { LevelSolver } from '../../domain/services/level-solver';
import { LevelFixture, buildLevelFromFixture } from './level-fixture';
import { validateLevelPaint } from './level-paint.validator';
import { validateLevelSilhouette } from './level-silhouette.validator';

// Replica la validación del seed (prisma/seed.ts validate) para TODO el
// catálogo, sin BD: cada fixture se construye sobre su geometría real y el
// solver lo declara soluble; luego los chequeos baratos de paint/silhouette.
// Es el guardián en CI de que ningún nivel autorizado (incl. los hex de #60)
// sea insoluble o tenga metadata rota.
describe('level catalog (all fixtures solvable + valid)', () => {
  const dir = path.join(process.cwd(), 'prisma', 'levels');
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^(level-\d+|t-[a-z0-9-]+|hex-\d+)\.json$/.test(f));
  const solver = new LevelSolver();

  it('finds level fixtures', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is solvable and shape-valid', (file) => {
    // Arrange
    const fixture = JSON.parse(
      fs.readFileSync(path.join(dir, file), 'utf8'),
    ) as LevelFixture;
    // Act
    const level = buildLevelFromFixture(fixture);
    // Assert
    expect(solver.isSolvable(level)).toBe(true);
    expect(() => validateLevelPaint(fixture)).not.toThrow();
    expect(() => validateLevelSilhouette(fixture)).not.toThrow();
  });
});
