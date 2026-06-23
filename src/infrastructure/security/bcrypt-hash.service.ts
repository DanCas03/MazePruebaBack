import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { IHashService } from '../../application/ports/i-hash.service';

// Adapter: adapta bcryptjs al puerto IHashService (DIP — la capa application
// depende de IHashService; esta clase inyecta bcrypt sin exponer el detalle).
@Injectable()
export class BcryptHashService implements IHashService {
  private readonly saltRounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
