import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../../domain/entities/user.entity';

// Shape público del perfil del usuario autenticado (GET /auth/me). No expone el
// hash de la contraseña: el mapper decide explícitamente qué campos del dominio
// cruzan la frontera HTTP, evitando que la entidad User se filtre al cliente.
export class UserProfileResponseDto {
  @ApiProperty({ example: 'clx9z8y7x6w5' })
  id!: string;

  @ApiProperty({ example: 'player_01' })
  username!: string;

  @ApiProperty({ example: 'player@arrowmaze.com' })
  email!: string;
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
