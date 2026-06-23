import { LevelController } from './level.controller';
import { GetLevelUseCase } from '../../application/use-cases/get-level.use-case';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';
import { ArrowCell } from '../../domain/entities/arrow-cell.entity';
import { EmptyCell } from '../../domain/entities/empty-cell.entity';
import { Position } from '../../domain/value-objects/position.vo';
import { Direction } from '../../domain/value-objects/direction.vo';
import type { ICell } from '../../domain/entities/cell.entity';

describe('LevelController', () => {
  let sut: LevelController;
  let mockUseCase: jest.Mocked<Pick<GetLevelUseCase, 'execute'>>;

  beforeEach(() => {
    mockUseCase = { execute: jest.fn() };
    sut = new LevelController(mockUseCase as unknown as GetLevelUseCase);
  });

  it('delegates to the use case with a LevelId from the route param and returns the mapped DTO', async () => {
    // Arrange
    const grid: ICell[][] = [
      [
        new ArrowCell(new Position(0, 0), Direction.RIGHT, 2),
        new EmptyCell(new Position(0, 1)),
      ],
    ];
    mockUseCase.execute.mockResolvedValue(grid);

    // Act
    const result = await sut.getLevel('level-42');

    // Assert
    expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
    const passedId = mockUseCase.execute.mock.calls[0][0];
    expect(passedId).toBeInstanceOf(LevelId);
    expect(passedId.value).toBe('level-42');
    expect(result).toEqual({
      cells: [
        [
          {
            type: 'ARROW',
            position: { row: 0, col: 0 },
            direction: 'RIGHT',
            length: 2,
          },
          { type: 'EMPTY', position: { row: 0, col: 1 } },
        ],
      ],
    });
  });

  it('propagates LevelNotFoundException when the use case throws (surfaced as 404 by the global filter)', async () => {
    // Arrange
    mockUseCase.execute.mockRejectedValue(
      new LevelNotFoundException("Level 'missing' not found"),
    );

    // Act
    const act = () => sut.getLevel('missing');

    // Assert
    await expect(act()).rejects.toBeInstanceOf(LevelNotFoundException);
  });
});
