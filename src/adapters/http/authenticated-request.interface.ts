import type { Request } from 'express';

// Contrato del request autenticado: `req.user` es poblado por JwtStrategy
// (infrastructure/security/jwt.strategy.ts) tras validar el bearer token.
// Compartido por todos los controladores protegidos con JwtAuthGuard.
export interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string };
}
