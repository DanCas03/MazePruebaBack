import { validateLevelSilhouette } from './level-silhouette.validator';
import type { SilhouetteFixtureShape } from './level-silhouette.validator';

// Guardrail del seed para la máscara de silueta temática (ADR 0004, back#53):
// consistencia barata y nada más — el back no valida semántica visual, solo
// forma. Espejo de level-paint.validator.spec.ts.
describe('validateLevelSilhouette', () => {
  const themedFixture = (
    overrides: Partial<SilhouetteFixtureShape> = {},
  ): SilhouetteFixtureShape => ({
    levelId: 't-smoke',
    cols: 4,
    rows: 4,
    palette: { heart: '#FF4D6D' },
    silhouette: {
      heart: [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
    },
    arrows: [
      {
        id: 'a1',
        cells: [
          [0, 0],
          [0, 1],
        ],
      },
      { id: 'a2', cells: [[1, 0]] },
    ],
    ...overrides,
  });

  it('should accept a themed fixture whose silhouette covers every arrow cell', () => {
    // Arrange
    const fixture = themedFixture();
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).not.toThrow();
  });

  it('should accept a campaign fixture with no silhouette', () => {
    // Arrange
    const fixture = themedFixture({
      silhouette: undefined,
      palette: undefined,
    });
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).not.toThrow();
  });

  it('should throw when silhouette is present but empty', () => {
    // Arrange
    const fixture = themedFixture({ silhouette: {} });
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).toThrow(/empty/);
  });

  it('should throw when a silhouette region references a role missing from the palette', () => {
    // Arrange
    const fixture = themedFixture({
      palette: { face: '#FBBF24' },
    });
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).toThrow(/missing from the palette/);
  });

  it('should throw when a silhouette cell is not an integer pair', () => {
    // Arrange
    const fixture = themedFixture({
      silhouette: {
        heart: [
          [0, 0.5],
          [0, 1],
          [1, 0],
          [1, 1],
        ] as unknown as [number, number][],
      },
    });
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).toThrow(/integer pair/);
  });

  it('should throw when a silhouette cell is out of the board bounds', () => {
    // Arrange
    const fixture = themedFixture({
      silhouette: {
        heart: [
          [0, 0],
          [0, 1],
          [1, 0],
          [9, 9],
        ],
      },
    });
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).toThrow(/out of bounds/);
  });

  it('should throw when a region has a duplicate cell', () => {
    // Arrange
    const fixture = themedFixture({
      silhouette: {
        heart: [
          [0, 0],
          [0, 0],
          [1, 0],
          [1, 1],
        ],
      },
    });
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).toThrow(/duplicate/);
  });

  it('should throw when two regions overlap on the same cell', () => {
    // Arrange
    const fixture = themedFixture({
      palette: { heart: '#FF4D6D', face: '#FBBF24' },
      silhouette: {
        heart: [
          [0, 0],
          [0, 1],
        ],
        face: [
          [0, 1],
          [1, 1],
        ],
      },
    });
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).toThrow(/overlap/);
  });

  it('should throw when an arrow cell falls outside the silhouette union', () => {
    // Arrange
    const fixture = themedFixture({
      arrows: [{ id: 'a1', cells: [[3, 3]] }],
    });
    // Act
    const act = () => validateLevelSilhouette(fixture);
    // Assert
    expect(act).toThrow(/outside the silhouette/);
  });
});
