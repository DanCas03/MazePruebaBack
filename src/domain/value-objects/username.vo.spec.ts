import { Username } from './username.vo';
import { InvalidUsernameException } from '../exceptions/invalid-username.exception';

describe('Username', () => {
  it('accepts a valid username', () => {
    // Arrange / Act
    const sut = new Username('player_01');
    // Assert
    expect(sut.value).toBe('player_01');
  });

  it('is equal to another username with the same value', () => {
    // Arrange / Act / Assert
    expect(new Username('ana_99').equals(new Username('ana_99'))).toBe(true);
    expect(new Username('ana_99').equals(new Username('leo_99'))).toBe(false);
  });

  it.each(['ab', 'a'.repeat(21), 'has space', 'inv$lid', ''])(
    "rejects '%s'",
    (bad) => {
      // Arrange / Act / Assert
      expect(() => new Username(bad)).toThrow(InvalidUsernameException);
    },
  );
});
