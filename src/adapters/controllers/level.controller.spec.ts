import { LevelController } from './level.controller';
import { GetLevelUseCase } from '../../application/use-cases/get-level.use-case';
import { ListLevelsUseCase } from '../../application/use-cases/list-levels.use-case';
import { Level } from '../../domain/entities/level.entity';
import { Arrow } from '../../domain/entities/arrow.entity';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { ArrowId } from '../../domain/value-objects/arrow-id.vo';
import { Position } from '../../domain/value-objects/position.vo';
import { Direction } from '../../domain/value-objects/direction.vo';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';

describe('LevelController', () => {
  let sut: LevelController;
  let mockGetLevelUseCase: jest.Mocked<Pick<GetLevelUseCase, 'execute'>>;
  let mockListLevelsUseCase: jest.Mocked<Pick<ListLevelsUseCase, 'execute'>>;

  const buildLevel = () =>
    new Level(
      new LevelId('l-007'),
      8,
      11,
      [
        new Arrow(
          new ArrowId('a1'),
          [new Position(10, 3), new Position(9, 3), new Position(9, 4)],
          Direction.UP,
        ),
        new Arrow(
          new ArrowId('a2'),
          [new Position(2, 0), new Position(2, 1)],
          Direction.RIGHT,
        ),
      ],
      90,
    );

  beforeEach(() => {
    mockGetLevelUseCase = { execute: jest.fn() };
    mockListLevelsUseCase = { execute: jest.fn() };
    sut = new LevelController(
      mockGetLevelUseCase as unknown as GetLevelUseCase,
      mockListLevelsUseCase as unknown as ListLevelsUseCase,
    );
  });

  describe('list', () => {
    it('delegates to ListLevelsUseCase and returns level ids in order', async () => {
      // Arrange
      mockListLevelsUseCase.execute.mockResolvedValue([buildLevel()]);

      // Act
      const result = await sut.list();

      // Assert
      expect(mockListLevelsUseCase.execute).toHaveBeenCalledWith();
      expect(result).toEqual([{ levelId: 'l-007' }]);
    });
  });

  describe('getById', () => {
    it('delegates to GetLevelUseCase with the id param and returns the mapped arrow-path DTO', async () => {
      // Arrange
      mockGetLevelUseCase.execute.mockResolvedValue(buildLevel());

      // Act
      const result = await sut.getById('l-007');

      // Assert
      expect(mockGetLevelUseCase.execute).toHaveBeenCalledWith('l-007');
      expect(result).toEqual({
        levelId: 'l-007',
        cols: 8,
        rows: 11,
        timeLimitSec: 90,
        arrows: [
          {
            id: 'a1',
            headDir: 'up',
            cells: [
              [10, 3],
              [9, 3],
              [9, 4],
            ],
          },
          {
            id: 'a2',
            headDir: 'right',
            cells: [
              [2, 0],
              [2, 1],
            ],
          },
        ],
      });
    });

    it('propagates LevelNotFoundException when the use case throws (surfaced as 404 by the global filter)', async () => {
      // Arrange
      mockGetLevelUseCase.execute.mockRejectedValue(
        new LevelNotFoundException("Level 'missing' not found"),
      );

      // Act
      const act = () => sut.getById('missing');

      // Assert
      await expect(act()).rejects.toBeInstanceOf(LevelNotFoundException);
    });
  });
});
