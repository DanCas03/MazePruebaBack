import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { PrismaService } from './prisma.service';

describe('DatabaseModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    // Arrange: build the module, overriding the real DB connection so no Postgres is needed.
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ onModuleInit: jest.fn() })
      .compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('provides PrismaService', () => {
    // Act
    const prisma = moduleRef.get<PrismaService>(PrismaService);

    // Assert
    expect(prisma).toBeDefined();
  });
});
