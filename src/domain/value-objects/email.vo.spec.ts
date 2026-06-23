import { Email } from './email.vo';
import { InvalidEmailException } from '../exceptions/invalid-email.exception';

describe('Email', () => {
  it('should create email with valid format', () => {
    const sut = new Email('user@example.com');
    expect(sut.value).toBe('user@example.com');
  });

  it('should throw InvalidEmailException for missing @', () => {
    expect(() => new Email('notanemail')).toThrow(InvalidEmailException);
  });

  it('should throw InvalidEmailException for missing domain', () => {
    expect(() => new Email('user@')).toThrow(InvalidEmailException);
  });

  it('equals should be case-insensitive', () => {
    // Arrange
    const a = new Email('User@Example.COM');
    const b = new Email('user@example.com');
    // Act / Assert
    expect(a.equals(b)).toBe(true);
  });
});
