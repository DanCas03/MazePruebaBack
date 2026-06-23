import { HashedPassword } from './hashed-password.vo';
import { InvalidHashedPasswordException } from '../exceptions/invalid-hashed-password.exception';

describe('HashedPassword', () => {
  it('should create with a non-empty hash string', () => {
    const sut = new HashedPassword('$2b$10$abc');
    expect(sut.value).toBe('$2b$10$abc');
  });

  it('should throw InvalidHashedPasswordException for empty string', () => {
    expect(() => new HashedPassword('')).toThrow(InvalidHashedPasswordException);
  });

  it('should throw InvalidHashedPasswordException for whitespace-only string', () => {
    expect(() => new HashedPassword('   ')).toThrow(InvalidHashedPasswordException);
  });

  it('equals returns true for the same hash', () => {
    expect(new HashedPassword('hash').equals(new HashedPassword('hash'))).toBe(true);
  });

  it('equals returns false for different hashes', () => {
    expect(new HashedPassword('a').equals(new HashedPassword('b'))).toBe(false);
  });
});
