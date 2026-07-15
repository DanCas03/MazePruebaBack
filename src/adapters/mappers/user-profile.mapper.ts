import type { User } from '../../domain/entities/user.entity';

// Shape público del perfil del usuario autenticado (GET /auth/me). No expone el
// hash de la contraseña: el mapper decide explícitamente qué campos del dominio
// cruzan la frontera HTTP, evitando que la entidad User se filtre al cliente.
export interface UserProfileResponseDto {
  id: string;
  username: string;
  email: string;
}

export class UserProfileMapper {
  static toDto(user: User): UserProfileResponseDto {
    return {
      id: user.id.value,
      username: user.username.value,
      email: user.email.value,
    };
  }
}
