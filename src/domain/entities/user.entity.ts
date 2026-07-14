import { UserId } from '../value-objects/user-id.vo';
import { Email } from '../value-objects/email.vo';
import { Username } from '../value-objects/username.vo';
import { HashedPassword } from '../value-objects/hashed-password.vo';

export class User {
  constructor(
    readonly id: UserId,
    readonly email: Email,
    readonly username: Username,
    readonly password: HashedPassword,
  ) {}
}
