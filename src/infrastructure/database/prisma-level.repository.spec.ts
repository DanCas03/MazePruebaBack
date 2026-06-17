import { PrismaLevelRepository } from './prisma-level.repository';
import { PrismaService } from './prisma.service';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { CellType } from '../../domain/value-objects/cell-type.vo';
import { Direction } from '../../domain/value-objects/direction.vo';
import { ArrowCell } from '../../domain/entities/arrow-cell.entity';
import { EmptyCell } from '../../domain/entities/empty-cell.entity';

describe('PrismaLevelRepository', () => {
  let sut: PrismaLevelRepository;
  let mockPrisma: { level: { findUnique: jest.Mock } };

  beforeEach(() => {
    mockPrisma = { level: { findUnique: jest.fn() } };
    sut = new PrismaLevelRepository(mockPrisma as unknown as PrismaService);
  });

  describe('findById', () => {
    it('should return null when the level does not exist in the database', async () => {
      // Arrange
      mockPrisma.level.findUnique.mockResolvedValue(null);
      // Act
      const result = await sut.findById(new LevelId('missing'));
      // Assert
      expect(result).toBeNull();
    });

    it('should deserialize a JSON grid into ICell[][] when level exists', async () => {
      // Arrange
      const id = new LevelId('level-1');
      mockPrisma.level.findUnique.mockResolvedValue({
        id: id.value,
        data: [
          [{ type: CellType.ARROW, direction: Direction.RIGHT, length: 2 }],
          [{ type: CellType.EMPTY }],
        ],
      });
      // Act
      const result = await sut.findById(id);
      // Assert
      expect(result).not.toBeNull();
      expect(result![0][0]).toBeInstanceOf(ArrowCell);
      expect(result![1][0]).toBeInstanceOf(EmptyCell);
    });
  });
});
