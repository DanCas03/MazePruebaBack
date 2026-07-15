import type { IUserRepository } from '../ports/i-user.repository';
import type { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';

// Command pattern: encapsula el caso de uso "resolver el usuario autenticado".
// Recibe el `userId` extraído del JWT (JwtStrategy) y devuelve la entidad de
// dominio para que el adapter la mapee a su DTO público. Depende solo del puerto
// IUserRepository (DIP). El JWT no transporta el username; por eso hace falta
// resolverlo contra la fuente de verdad.
export class GetCurrentUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepo.findById(new UserId(userId));
    if (!user) {
      throw new UserNotFoundException(`User '${userId}' not found`);
    }
    return user;
  }
}
