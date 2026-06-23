import type { User } from '../../domain/entities/user.entity';
import type { Email } from '../../domain/value-objects/email.vo';

export const USER_REPOSITORY_TOKEN = 'IUserRepository';

export interface IUserRepository {
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}
