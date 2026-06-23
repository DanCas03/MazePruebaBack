import type { IUserRepository } from '../ports/i-user.repository';
import type { IHashService } from '../ports/i-hash.service';
import type { ITokenService } from '../ports/i-token.service';
import { Email } from '../../domain/value-objects/email.vo';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';

// Command pattern: encapsulates the "login user" operation with all its dependencies
// injected via constructor (DIP — depends on ports, not concrete implementations).
export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(rawEmail: string, plainPassword: string): Promise<string> {
    const email = new Email(rawEmail);
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new InvalidCredentialsException('Invalid email or password');

    const valid = await this.hashService.compare(plainPassword, user.password.value);
    if (!valid) throw new InvalidCredentialsException('Invalid email or password');

    return this.tokenService.sign({ sub: user.id.value, email: user.email.value });
  }
}
