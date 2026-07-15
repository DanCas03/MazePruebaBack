import { DomainException } from './domain.exception';

// Se lanza cuando un token válido apunta a un usuario inexistente (cuenta
// eliminada). El filtro AOP la mapea a 404 (USER_NOT_FOUND).
export class UserNotFoundException extends DomainException {}
