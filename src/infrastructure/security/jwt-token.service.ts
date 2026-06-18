import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ITokenService } from '../../application/ports/i-token.service';

// Adapter: adapta @nestjs/jwt al puerto ITokenService (DIP — la capa application
// depende de ITokenService; esta clase delega en JwtService sin exponer el detalle).
@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload);
  }
}
