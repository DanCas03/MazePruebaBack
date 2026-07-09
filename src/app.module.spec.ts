import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/database/prisma.service';

// Smoke test de cableado de DI del AppModule completo. Complementa a los tests
// unitarios: estos aíslan cada clase con mocks y NUNCA arrancan Nest, por lo que
// un error de wiring (p.ej. inyectar un provider por un token que nadie registra)
// pasa desapercibido hasta el arranque real. Ese hueco dejó vivo el bug de
// AuthModule (JwtService inyectado por el string 'JwtService' en vez de la clase)
// desde fad9588 hasta que un smoke test manual lo destapó en back#5.
//
// compile() ejecuta los constructores de todos los providers y las factories de
// registerAsync (resolviendo el grafo de DI), pero NO invoca onModuleInit, así que
// no se abre ninguna conexión. PrismaService se sobre-escribe para no depender de
// una BD viva: este test verifica el CABLEADO, no la persistencia.
describe('AppModule (DI wiring smoke)', () => {
  const previousJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    // JwtModule.registerAsync hace getOrThrow('JWT_SECRET') al construirse.
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = previousJwtSecret;
  });

  it('should resolve the whole dependency graph without UnknownDependenciesException', async () => {
    // Arrange
    const builder = Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({});

    // Act
    const moduleRef = await builder.compile();

    // Assert
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
