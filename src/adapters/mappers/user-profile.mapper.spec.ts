import { UserProfileMapper } from './user-profile.mapper';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';

describe('UserProfileMapper', () => {
  it('maps a User entity to its public profile DTO', () => {
    // Arrange
    const user = new User(
      new UserId('user-uuid-1'),
      new Email('user@example.com'),
      new Username('player_01'),
      new HashedPassword('$2b$10$hashedPassword'),
    );
    // Act
    const dto = UserProfileMapper.toDto(user);
    // Assert
    expect(dto).toEqual({
      id: 'user-uuid-1',
      username: 'player_01',
      email: 'user@example.com',
    });
  });

  it('does not expose the password hash', () => {
    // Arrange
    const user = new User(
      new UserId('user-uuid-2'),
      new Email('other@example.com'),
      new Username('player_02'),
      new HashedPassword('$2b$10$secretHash'),
    );
    // Act
    const dto = UserProfileMapper.toDto(user);
    // Assert
    expect(Object.keys(dto)).toEqual(['id', 'username', 'email']);
    expect(JSON.stringify(dto)).not.toContain('secretHash');
  });
});
