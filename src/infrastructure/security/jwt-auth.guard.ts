import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard: delega en la estrategia 'jwt' de Passport para proteger rutas.
// Extender AuthGuard('jwt') permite reutilizar el mecanismo de Passport
// sin duplicar la lógica de validación del token (OCP).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
