import type { User } from '../../domain/entities/user.entity';
import type { UserId } from '../../domain/value-objects/user-id.vo';
import type { Email } from '../../domain/value-objects/email.vo';
import type { Username } from '../../domain/value-objects/username.vo';

export const USER_REPOSITORY_TOKEN = 'IUserRepository';

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByUsername(username: Username): Promise<User | null>;
  save(user: User): Promise<void>;
}
