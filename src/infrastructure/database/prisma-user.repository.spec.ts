import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaService } from './prisma.service';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { User } from '../../domain/entities/user.entity';

describe('PrismaUserRepository', () => {
  let sut: PrismaUserRepository;
  let mockPrisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(() => {
    // Arrange — mock PrismaService to isolate from Postgres
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    sut = new PrismaUserRepository(mockPrisma as unknown as PrismaService);
  });

  describe('findByEmail', () => {
    it('should return null when no user with that email exists', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      // Act
      const result = await sut.findByEmail(new Email('ghost@example.com'));
      // Assert
      expect(result).toBeNull();
    });

    it('should return a User entity when a matching record exists', async () => {
      // Arrange
      const record = {
        id: 'user-uuid-1',
        email: 'user@example.com',
        username: 'player_01',
        password: '$2b$10$hashedPassword',
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(record);
      // Act
      const result = await sut.findByEmail(new Email('user@example.com'));
      // Assert
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(User);
      expect(result!.id.value).toBe('user-uuid-1');
      expect(result!.email.value).toBe('user@example.com');
      expect(result!.username.value).toBe('player_01');
      expect(result!.password.value).toBe('$2b$10$hashedPassword');
    });
  });

  describe('findByUsername', () => {
    it('should return null when no user with that username exists', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      // Act
      const result = await sut.findByUsername(new Username('ghost_01'));
      // Assert
      expect(result).toBeNull();
    });

    it('should return a User entity when a matching record exists', async () => {
      // Arrange
      const record = {
        id: 'user-uuid-1',
        email: 'user@example.com',
        username: 'player_01',
        password: '$2b$10$hashedPassword',
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(record);
      // Act
      const result = await sut.findByUsername(new Username('player_01'));
      // Assert
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(User);
      expect(result!.id.value).toBe('user-uuid-1');
      expect(result!.username.value).toBe('player_01');
    });
  });

  describe('save', () => {
    it('should call prisma.user.create with the correct data', async () => {
      // Arrange
      mockPrisma.user.create.mockResolvedValue(undefined);
      const user = new User(
        new UserId('user-uuid-2'),
        new Email('new@example.com'),
        new Username('player_01'),
        new HashedPassword('$2b$10$anotherHash'),
      );
      // Act
      await sut.save(user);
      // Assert
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-uuid-2',
          email: 'new@example.com',
          username: 'player_01',
          password: '$2b$10$anotherHash',
        },
      });
    });
  });
});
