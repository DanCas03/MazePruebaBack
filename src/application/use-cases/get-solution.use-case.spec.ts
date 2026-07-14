import { GetSolutionUseCase } from './get-solution.use-case';
import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { LevelSolver } from '../../domain/services/level-solver';
import { LevelBuilder } from '../../domain/entities/level.builder';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { InvalidLevelIdException } from '../../domain/exceptions/invalid-level-id.exception';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';
import { UnsolvableLevelException } from '../../domain/exceptions/unsolvable-level.exception';

describe('GetSolutionUseCase', () => {
  let sut: GetSolutionUseCase;
  let mockLevelRepo: jest.Mocked<ILevelRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  // Nivel soluble: una flecha con el carril despejado hasta el borde.
  const buildSolvableLevel = () =>
    new LevelBuilder(new LevelId('level-01'))
      .withDimensions(3, 3)
      .addArrow({
        id: 'a',
        headDir: 'right',
        cells: [
          [1, 0],
          [1, 1],
        ],
      })
      .build();

  // Nivel insoluble: dos flechas en bloqueo mutuo cíclico (LevelSolver spec).
  const buildUnsolvableLevel = () =>
    new LevelBuilder(new LevelId('level-99'))
      .withDimensions(4, 1)
      .addArrow({
        id: 'a',
        headDir: 'right',
        cells: [
          [0, 0],
          [0, 1],
        ],
      })
      .addArrow({
        id: 'b',
        headDir: 'left',
        cells: [
          [0, 3],
          [0, 2],
        ],
      })
      .build();

  beforeEach(() => {
    mockLevelRepo = { findById: jest.fn(), findAllOrdered: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    // LevelSolver es un servicio de dominio puro y determinista: se usa real
    // para que el test certifique la solubilidad de verdad, no un mock.
    sut = new GetSolutionUseCase(mockLevelRepo, new LevelSolver(), mockLogger);
  });

  it('returns the clearing order for a solvable level', async () => {
    // Arrange
    mockLevelRepo.findById.mockResolvedValue(buildSolvableLevel());

    // Act
    const result = await sut.execute('level-01');

    // Assert
    expect(result.map((id) => id.value)).toEqual(['a']);
    const [idArg] = mockLevelRepo.findById.mock.calls[0];
    expect(idArg).toBeInstanceOf(LevelId);
    expect(idArg.value).toBe('level-01');
  });

  it('throws InvalidLevelIdException for an empty id, before hitting the repository', async () => {
    // Act / Assert
    await expect(sut.execute('')).rejects.toThrow(InvalidLevelIdException);
    expect(mockLevelRepo.findById).not.toHaveBeenCalled();
  });

  it('throws LevelNotFoundException when the repository resolves null', async () => {
    // Arrange
    mockLevelRepo.findById.mockResolvedValue(null);

    // Act / Assert
    await expect(sut.execute('level-01')).rejects.toThrow(
      LevelNotFoundException,
    );
  });

  it('throws UnsolvableLevelException (422) when the level cannot be cleared', async () => {
    // Arrange
    mockLevelRepo.findById.mockResolvedValue(buildUnsolvableLevel());

    // Act / Assert
    await expect(sut.execute('level-99')).rejects.toThrow(
      UnsolvableLevelException,
    );
  });

  it('logs an enriched audit context (levelId + map metadata) on the unsolvable path', async () => {
    // Arrange
    mockLevelRepo.findById.mockResolvedValue(buildUnsolvableLevel());

    // Act
    await sut.execute('level-99').catch(() => undefined);

    // Assert — el log de error captura no solo el mensaje sino el contexto.
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    const [message, error, context] = mockLogger.error.mock.calls[0];
    expect(context).toBe(GetSolutionUseCase.name);
    expect(error).toBeUndefined();
    expect(message).toContain('level-99');
    expect(message).toContain('audit=');
    const payload = JSON.parse(message.split('audit=')[1]) as Record<
      string,
      unknown
    >;
    expect(payload).toEqual({
      levelId: 'level-99',
      cols: 4,
      rows: 1,
      arrowCount: 2,
      arrowIds: ['a', 'b'],
    });
  });

  it('attaches the same audit context to the thrown exception for downstream auditing', async () => {
    // Arrange
    mockLevelRepo.findById.mockResolvedValue(buildUnsolvableLevel());

    // Act
    const error = await sut.execute('level-99').catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(UnsolvableLevelException);
    expect((error as UnsolvableLevelException).context).toEqual({
      levelId: 'level-99',
      cols: 4,
      rows: 1,
      arrowCount: 2,
      arrowIds: ['a', 'b'],
    });
  });
});
