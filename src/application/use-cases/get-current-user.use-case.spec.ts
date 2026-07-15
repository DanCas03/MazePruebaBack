import { GetCurrentUserUseCase } from './get-current-user.use-case';
import type { IUserRepository } from '../ports/i-user.repository';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';

describe('GetCurrentUserUseCase', () => {
  let sut: GetCurrentUserUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let existingUser: User;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
    };
    existingUser = new User(
      new UserId('user-uuid-1'),
      new Email('user@example.com'),
      new Username('player_01'),
      new HashedPassword('$2b$10$hashedPassword'),
    );
    sut = new GetCurrentUserUseCase(mockUserRepo);
  });

  it('should return the user when it exists', async () => {
    // Arrange
    mockUserRepo.findById.mockResolvedValue(existingUser);
    // Act
    const result = await sut.execute('user-uuid-1');
    // Assert
    expect(result).toBe(existingUser);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'user-uuid-1' }),
    );
  });

  it('should throw UserNotFoundException when the user does not exist', async () => {
    // Arrange
    mockUserRepo.findById.mockResolvedValue(null);
    // Act / Assert
    await expect(sut.execute('ghost-uuid')).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
