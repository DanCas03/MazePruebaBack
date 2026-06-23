import { JwtTokenService } from './jwt-token.service';
import { JwtService } from '@nestjs/jwt';

describe('JwtTokenService', () => {
  let sut: JwtTokenService;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    // Arrange — mock JwtService to isolate the adapter from JWT internals
    mockJwtService = { sign: jest.fn() } as unknown as jest.Mocked<JwtService>;
    sut = new JwtTokenService(mockJwtService);
  });

  describe('sign', () => {
    it('should delegate to JwtService.sign and return the token string', () => {
      // Arrange
      const payload = { sub: 'user-uuid-1', email: 'user@example.com' };
      mockJwtService.sign.mockReturnValue('jwt.signed.token');
      // Act
      const result = sut.sign(payload);
      // Assert
      expect(result).toBe('jwt.signed.token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(payload);
    });
  });
});
