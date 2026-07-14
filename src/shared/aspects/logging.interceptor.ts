import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { ILoggerService } from '../../application/ports/i-logger.service';
import { LOGGER_SERVICE_TOKEN } from '../../application/ports/i-logger.service';

// AOP: intercepta cada request/response HTTP sin tocar la lógica de negocio.
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(LOGGER_SERVICE_TOKEN) private readonly logger: ILoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    const { method, url } = req;
    const start = Date.now();
    this.logger.log(`→ ${method} ${url}`, LoggingInterceptor.name);

    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `← ${method} ${url} (${Date.now() - start}ms)`,
            LoggingInterceptor.name,
          ),
        ),
      );
  }
}
