import { AuthController } from './auth.controller';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';

describe('AuthController', () => {
  let sut: AuthController;
  let mockRegisterUseCase: jest.Mocked<Pick<RegisterUseCase, 'execute'>>;
  let mockLoginUseCase: jest.Mocked<Pick<LoginUseCase, 'execute'>>;

  beforeEach(() => {
    // Arrange — mock use cases to isolate the controller from domain/infra logic
    mockRegisterUseCase = { execute: jest.fn() };
    mockLoginUseCase = { execute: jest.fn() };
    sut = new AuthController(
      mockRegisterUseCase as unknown as RegisterUseCase,
      mockLoginUseCase as unknown as LoginUseCase,
    );
  });

  describe('register', () => {
    it('delegates to RegisterUseCase with email and password, and returns { token }', async () => {
      // Arrange
      const dto = { email: 'user@example.com', password: 'secret123' };
      mockRegisterUseCase.execute.mockResolvedValue('signed.jwt.token');

      // Act
      const result = await sut.register(dto);

      // Assert
      expect(mockRegisterUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(
        'user@example.com',
        'secret123',
      );
      expect(result).toEqual({ token: 'signed.jwt.token' });
    });

    it('propagates UserAlreadyExistsException when the use case throws (surfaced as 409 by the global filter)', async () => {
      // Arrange
      mockRegisterUseCase.execute.mockRejectedValue(
        new UserAlreadyExistsException(
          "Email 'user@example.com' already registered",
        ),
      );

      // Act
      const act = () =>
        sut.register({
          email: 'user@example.com',
          password: 'secret123',
        });

      // Assert
      await expect(act()).rejects.toBeInstanceOf(UserAlreadyExistsException);
    });
  });

  describe('login', () => {
    it('delegates to LoginUseCase with email and password, and returns { token }', async () => {
      // Arrange
      const dto = { email: 'user@example.com', password: 'secret123' };
      mockLoginUseCase.execute.mockResolvedValue('signed.jwt.token');

      // Act
      const result = await sut.login(dto);

      // Assert
      expect(mockLoginUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
        'user@example.com',
        'secret123',
      );
      expect(result).toEqual({ token: 'signed.jwt.token' });
    });

    it('propagates InvalidCredentialsException when the use case throws (surfaced as 401 by the global filter)', async () => {
      // Arrange
      mockLoginUseCase.execute.mockRejectedValue(
        new InvalidCredentialsException('Invalid email or password'),
      );

      // Act
      const act = () =>
        sut.login({ email: 'user@example.com', password: 'wrongpass' });

      // Assert
      await expect(act()).rejects.toBeInstanceOf(InvalidCredentialsException);
    });
  });
});
