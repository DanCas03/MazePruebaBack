import { UserId } from '../value-objects/user-id.vo';
import { Email } from '../value-objects/email.vo';
import { HashedPassword } from '../value-objects/hashed-password.vo';

export class User {
  constructor(
    readonly id: UserId,
    readonly email: Email,
    readonly password: HashedPassword,
  ) {}
}
