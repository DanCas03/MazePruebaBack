export const TOKEN_SERVICE_TOKEN = 'ITokenService';

export interface ITokenService {
  sign(payload: { sub: string; email: string }): string;
}
