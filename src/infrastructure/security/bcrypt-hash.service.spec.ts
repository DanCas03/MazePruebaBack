import { BcryptHashService } from './bcrypt-hash.service';

describe('BcryptHashService', () => {
  let sut: BcryptHashService;

  beforeEach(() => {
    sut = new BcryptHashService();
  });

  describe('hash', () => {
    it('should return a bcrypt hash different from the plain text', async () => {
      // Arrange
      const plain = 'my-secret-password';
      // Act
      const hashed = await sut.hash(plain);
      // Assert
      expect(hashed).not.toBe(plain);
      expect(hashed.startsWith('$2b$')).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return true when plain matches the hash', async () => {
      // Arrange
      const plain = 'my-secret-password';
      const hashed = await sut.hash(plain);
      // Act
      const result = await sut.compare(plain, hashed);
      // Assert
      expect(result).toBe(true);
    });

    it('should return false when plain does not match the hash', async () => {
      // Arrange
      const plain = 'my-secret-password';
      const hashed = await sut.hash(plain);
      // Act
      const result = await sut.compare('wrong-password', hashed);
      // Assert
      expect(result).toBe(false);
    });
  });
});
