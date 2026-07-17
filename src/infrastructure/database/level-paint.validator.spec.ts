import { validateLevelPaint } from './level-paint.validator';
import type { PaintFixtureShape } from './level-paint.validator';

// Guardrail del seed para Instrucciones de pintado (ADR 0004, back#31):
// consistencia barata y nada más — el back no valida semántica visual.
describe('validateLevelPaint', () => {
  const themedFixture = (
    overrides: Partial<PaintFixtureShape> = {},
  ): PaintFixtureShape => ({
    levelId: 't-smoke',
    palette: { cara: '#FBBF24', ojo: '#1E293B' },
    arrows: [
      { id: 'a1', paintRole: 'ojo' },
      { id: 'a2', paintRole: 'cara' },
    ],
    ...overrides,
  });

  it('should accept a themed fixture whose roles all exist in a well-formed palette', () => {
    // Arrange
    const fixture = themedFixture();
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).not.toThrow();
  });

  it('should accept a campaign fixture with no palette and no paintRole', () => {
    // Arrange
    const fixture = themedFixture({
      palette: undefined,
      arrows: [{ id: 'a1' }, { id: 'a2' }],
    });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).not.toThrow();
  });

  it('should accept a palette with roles no arrow uses (unused roles are not an error)', () => {
    // Arrange
    const fixture = themedFixture({ arrows: [{ id: 'a1' }] });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).not.toThrow();
  });

  it('should throw when an arrow has a paintRole but the fixture has no palette', () => {
    // Arrange
    const fixture = themedFixture({ palette: undefined });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).toThrow(/no palette/);
  });

  it('should throw when a paintRole references a role missing from the palette', () => {
    // Arrange
    const fixture = themedFixture({
      arrows: [{ id: 'a1', paintRole: 'nariz' }],
    });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).toThrow(/missing from the palette/);
  });

  it('should throw when a palette color is not a #RRGGBB hex', () => {
    // Arrange
    const fixture = themedFixture({
      palette: { cara: 'yellow', ojo: '#1E293B' },
    });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).toThrow(/malformed/);
  });

  it('should throw when a palette color is a short #RGB hex', () => {
    // Arrange
    const fixture = themedFixture({
      palette: { cara: '#FB4', ojo: '#1E293B' },
    });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).toThrow(/malformed/);
  });

  it('should throw when a silhouette role is not in the palette', () => {
    // Arrange
    const fixture = themedFixture({
      cols: 4,
      rows: 4,
      silhouette: { fantasma: [[0, 0]] },
    });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).toThrow(/silhouette/i);
  });

  it('should throw when a silhouette cell is out of bounds', () => {
    // Arrange
    const fixture = themedFixture({
      cols: 4,
      rows: 4,
      silhouette: { cara: [[9, 9]] },
    });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).toThrow(/bounds|silhouette/i);
  });

  it('should accept a well-formed silhouette whose roles exist in the palette and cells are in bounds', () => {
    // Arrange
    const fixture = themedFixture({
      cols: 4,
      rows: 4,
      silhouette: {
        cara: [
          [0, 0],
          [0, 1],
        ],
      },
    });
    // Act
    const act = () => validateLevelPaint(fixture);
    // Assert
    expect(act).not.toThrow();
  });
});
