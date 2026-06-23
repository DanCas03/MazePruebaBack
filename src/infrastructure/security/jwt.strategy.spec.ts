import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let sut: JwtStrategy;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    // Arrange — mock ConfigService to isolate from env vars
    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as jest.Mocked<ConfigService>;
    sut = new JwtStrategy(mockConfigService);
  });

  describe('constructor', () => {
    it('should read JWT_SECRET from ConfigService', () => {
      // Assert — ConfigService.getOrThrow must be called with 'JWT_SECRET'
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('should map jwt payload to userId and email', () => {
      // Arrange
      const payload = { sub: 'user-uuid-1', email: 'user@example.com' };

      // Act
      const result = sut.validate(payload);

      // Assert
      expect(result).toEqual({ userId: 'user-uuid-1', email: 'user@example.com' });
    });

    it('should map a different payload correctly', () => {
      // Arrange
      const payload = { sub: 'another-uuid', email: 'other@test.com' };

      // Act
      const result = sut.validate(payload);

      // Assert
      expect(result).toEqual({ userId: 'another-uuid', email: 'other@test.com' });
    });
  });
});
