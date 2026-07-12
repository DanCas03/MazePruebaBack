import { RegisterUseCase } from './register.use-case';
import type { IUserRepository } from '../ports/i-user.repository';
import type { IHashService } from '../ports/i-hash.service';
import type { ITokenService } from '../ports/i-token.service';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';

describe('RegisterUseCase', () => {
  let sut: RegisterUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockHashService: jest.Mocked<IHashService>;
  let mockTokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    mockUserRepo = { findByEmail: jest.fn(), save: jest.fn() };
    mockHashService = { hash: jest.fn(), compare: jest.fn() };
    mockTokenService = { sign: jest.fn() };
    sut = new RegisterUseCase(mockUserRepo, mockHashService, mockTokenService);
  });

  it('should return a JWT token when email is not already registered', async () => {
    // Arrange
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockHashService.hash.mockResolvedValue('$2b$10$hashedPassword');
    mockTokenService.sign.mockReturnValue('jwt.token.here');
    // Act
    const result = await sut.execute('user@example.com', 'secret123');
    // Assert
    expect(result).toBe('jwt.token.here');
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw UserAlreadyExistsException when email is taken', async () => {
    // Arrange
    const existingUser = new User(
      new UserId('user-1'),
      new Email('user@example.com'),
      new HashedPassword('$2b$10$hashedPassword'),
    );
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);
    // Act / Assert
    await expect(sut.execute('user@example.com', 'secret123')).rejects.toThrow(
      UserAlreadyExistsException,
    );
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });
});
