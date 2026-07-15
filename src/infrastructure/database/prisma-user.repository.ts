import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { IUserRepository } from '../../application/ports/i-user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';

// Adapter: implementa IUserRepository usando Prisma como ORM.
// Mapea entre el record de persistencia y la entidad de dominio User.
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UserId): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id: id.value },
    });
    return record ? PrismaUserRepository.toDomain(record) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    return record ? PrismaUserRepository.toDomain(record) : null;
  }

  async findByUsername(username: Username): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { username: username.value },
    });
    return record ? PrismaUserRepository.toDomain(record) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id.value,
        email: user.email.value,
        username: user.username.value,
        password: user.password.value,
      },
    });
  }

  private static toDomain(record: {
    id: string;
    email: string;
    username: string;
    password: string;
  }): User {
    return new User(
      new UserId(record.id),
      new Email(record.email),
      new Username(record.username),
      new HashedPassword(record.password),
    );
  }
}
