import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
  describe('class definition', () => {
    it('should extend AuthGuard("jwt")', () => {
      // Arrange & Act — verify inheritance chain
      const guard = new JwtAuthGuard();

      // Assert — JwtAuthGuard must be an instance of the jwt AuthGuard base class
      expect(guard).toBeInstanceOf(AuthGuard('jwt'));
    });

    it('should be instantiable', () => {
      // Arrange & Act
      const guard = new JwtAuthGuard();

      // Assert
      expect(guard).toBeDefined();
    });
  });
});
