import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Composición compartida entre el bootstrap (main.ts) y las pruebas e2e:
// ambas superficies aplican exactamente la misma configuración global
// (pipes + OpenAPI), de modo que lo que las e2e verifican es lo que
// producción sirve — sin riesgo de drift entre ambas.
export function configureApp(app: INestApplication): void {
  // CORS abierto: el front web (Docker, navegador en localhost:8080) llama a
  // la API desde otro origen y sin estas cabeceras el navegador bloquea toda
  // petición. El origen '*' no habilita CSRF aquí: el JWT viaja por header
  // Authorization (nunca cookies), que un tercero no puede forjar cross-site.
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle('Arrow Maze API')
    .setDescription(
      'REST API for the Arrow Maze mobile puzzle: JWT auth, curated levels ' +
        '(arrow-path wire contract), score leaderboard and player progress. ' +
        'Domain errors follow the uniform body { statusCode, code, message }.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, openApiConfig);
  // UI en /api; el JSON del documento queda en /api-json (default de Nest).
  SwaggerModule.setup('api', app, document);
}
