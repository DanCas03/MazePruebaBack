import { LoginUseCase } from './login.use-case';
import type { IUserRepository } from '../ports/i-user.repository';
import type { IHashService } from '../ports/i-hash.service';
import type { ITokenService } from '../ports/i-token.service';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { Email } from '../../domain/value-objects/email.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { User } from '../../domain/entities/user.entity';

describe('LoginUseCase', () => {
  let sut: LoginUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockHashService: jest.Mocked<IHashService>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let existingUser: User;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
    };
    mockHashService = { hash: jest.fn(), compare: jest.fn() };
    mockTokenService = { sign: jest.fn() };
    existingUser = new User(
      new UserId('user-uuid-1'),
      new Email('user@example.com'),
      new Username('player_01'),
      new HashedPassword('$2b$10$hashedPassword'),
    );
    sut = new LoginUseCase(mockUserRepo, mockHashService, mockTokenService);
  });

  it('should return a JWT token when credentials are valid', async () => {
    // Arrange
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);
    mockHashService.compare.mockResolvedValue(true);
    mockTokenService.sign.mockReturnValue('jwt.token.valid');
    // Act
    const result = await sut.execute('user@example.com', 'secret123');
    // Assert
    expect(result).toBe('jwt.token.valid');
  });

  it('should throw InvalidCredentialsException when user does not exist', async () => {
    // Arrange
    mockUserRepo.findByEmail.mockResolvedValue(null);
    // Act / Assert
    await expect(sut.execute('ghost@example.com', 'pass')).rejects.toThrow(
      InvalidCredentialsException,
    );
  });

  it('should throw InvalidCredentialsException when password is wrong', async () => {
    // Arrange
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);
    mockHashService.compare.mockResolvedValue(false);
    // Act / Assert
    await expect(sut.execute('user@example.com', 'wrongpass')).rejects.toThrow(
      InvalidCredentialsException,
    );
  });
});
