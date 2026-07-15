import { RegisterUseCase } from './register.use-case';
import type { IUserRepository } from '../ports/i-user.repository';
import type { IHashService } from '../ports/i-hash.service';
import type { ITokenService } from '../ports/i-token.service';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';
import { UsernameAlreadyTakenException } from '../../domain/exceptions/username-already-taken.exception';
import { Email } from '../../domain/value-objects/email.vo';

describe('RegisterUseCase', () => {
  let sut: RegisterUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockHashService: jest.Mocked<IHashService>;
  let mockTokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
    };
    mockHashService = { hash: jest.fn(), compare: jest.fn() };
    mockTokenService = { sign: jest.fn() };
    sut = new RegisterUseCase(mockUserRepo, mockHashService, mockTokenService);
  });

  it('should return a JWT token when email and username are free', async () => {
    // Arrange
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findByUsername.mockResolvedValue(null);
    mockHashService.hash.mockResolvedValue('$2b$10$hashedPassword');
    mockTokenService.sign.mockReturnValue('jwt.token.here');
    // Act
    const result = await sut.execute(
      'user@example.com',
      'player_01',
      'secret123',
    );
    // Assert
    expect(result).toBe('jwt.token.here');
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw UserAlreadyExistsException when email is taken', async () => {
    // Arrange
    mockUserRepo.findByEmail.mockResolvedValue({
      email: new Email('user@example.com'),
    } as any);
    // Act / Assert
    await expect(
      sut.execute('user@example.com', 'player_01', 'secret123'),
    ).rejects.toThrow(UserAlreadyExistsException);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });

  it('should throw UsernameAlreadyTakenException when username is taken', async () => {
    // Arrange
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findByUsername.mockResolvedValue({} as any);
    // Act / Assert
    await expect(
      sut.execute('user@example.com', 'player_01', 'secret123'),
    ).rejects.toThrow(UsernameAlreadyTakenException);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });
});
