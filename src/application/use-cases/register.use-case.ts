import { randomUUID } from 'crypto';
import type { IUserRepository } from '../ports/i-user.repository';
import type { IHashService } from '../ports/i-hash.service';
import type { ITokenService } from '../ports/i-token.service';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';

// Command pattern: encapsulates the "register user" operation with all its dependencies
// injected via constructor (DIP — depends on ports, not concrete implementations).
export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(rawEmail: string, plainPassword: string): Promise<string> {
    const email = new Email(rawEmail);
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new UserAlreadyExistsException(`Email '${rawEmail}' already registered`);

    const hashed = await this.hashService.hash(plainPassword);
    const user = new User(new UserId(randomUUID()), email, new HashedPassword(hashed));
    await this.userRepo.save(user);

    return this.tokenService.sign({ sub: user.id.value, email: user.email.value });
  }
}
