# NestJS Best Practices

This comprehensive guide outlines best practices for developing, testing, and deploying NestJS applications.

## Project Structure and Organization

### Directory Structure

Organize by feature rather than technical role:

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── common/                          # Shared code across features
│   ├── decorators/                  # Custom decorators
│   ├── filters/                     # Global exception filters
│   ├── guards/                      # Shared guards
│   ├── interceptors/                # Shared interceptors
│   ├── pipes/                       # Shared pipes
│   ├── dto/                         # Shared DTOs
│   └── utils/                       # Utility functions
├── config/                          # Configuration modules
│   ├── config.module.ts             # Environment configuration
│   └── config.service.ts            # Access configuration values
├── database/                        # Database setup
│   ├── database.module.ts           # Database connection module
│   ├── migrations/                  # TypeORM migrations
│   └── typeorm.config.ts            # TypeORM configuration
└── modules/                         # Feature modules
    ├── auth/                        # Authentication module
    │   ├── auth.module.ts           # Auth module definition
    │   ├── auth.controller.ts       # Auth API endpoints
    │   ├── auth.service.ts          # Auth business logic
    │   ├── dto/                     # Auth-related DTOs
    │   ├── entities/                # Auth-related entities
    │   ├── guards/                  # Auth guards
    │   └── strategies/              # Passport strategies
    └── users/                       # Users module
        ├── users.module.ts          # Users module definition
        ├── users.controller.ts      # User API endpoints
        ├── users.service.ts         # User business logic
        ├── dto/                     # User-related DTOs
        └── entities/                # User-related entities
```

### File Organization Best Practices

- Place controllers, services, and related files at the root of the feature module directory, not in subdirectories
- Keep file names consistent: `feature-name.type.ts` (e.g., `users.controller.ts`, `users.service.ts`)
- Follow NestJS naming conventions: PascalCase for classes, camelCase for methods/properties
- Create index files for cleaner imports
- Group related entities together
- Use dedicated DTO classes for request/response data structures
- Separate domain logic from infrastructure concerns

## Module Architecture

- Create dedicated modules for each feature area
- Use shared modules for common functionality
- Apply `@Global()` decorator sparingly for truly application-wide services
- Import only necessary modules in each feature module
- Implement clean module interfaces with well-defined public APIs
- Expose necessary providers through module exports

## Dependency Injection

- Use constructor-based dependency injection
- Define provider tokens as constants in separate files
- Use factory providers for complex provider creation with dependencies
- Leverage async providers with `useFactory` for configuration-dependent initialization
- Prefer interfaces with custom providers for better testability
- Use proper injection scopes (default, request, transient) based on requirements

## Architecture Patterns

- Follow the controller-service-repository pattern
- Keep controllers thin - they should only handle HTTP/request concerns
- Implement robust business logic in services
- Use repositories for data access abstraction
- Apply DTOs for data validation and transformation
- Separate command and query responsibilities (CQRS where appropriate)
- Use pipes for input validation (especially `ValidationPipe`)
- Handle errors with appropriate filters and consistent responses

## Authentication & Authorization

### Cookie-Based JWT Authentication Implementation

#### Required Dependencies

```bash
npm install --save @nestjs/jwt passport-jwt cookie-parser
npm install --save-dev @types/passport-jwt @types/cookie-parser
```

#### Auth Module Configuration

```typescript
// auth.module.ts
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { 
        expiresIn: '7d',  // Adjust based on security requirements
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

#### JWT Strategy Implementation

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

#### Cookie Parser Setup in Main

```typescript
// main.ts
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // ... other configuration
  await app.listen(3000);
}
bootstrap();
```

#### Auth Service Implementation

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: any, response: Response) {
    const payload = { username: user.username, sub: user.userId };
    const token = this.jwtService.sign(payload);
    
    response.cookie('Authentication', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return { success: true };
  }

  logout(response: Response) {
    response.clearCookie('Authentication');
    return { success: true };
  }
}
```

#### Route Protection with Guards

```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// protected.controller.ts
@Controller('profile')
export class ProfileController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Request() req) {
    return req.user;
  }
}
```

### Authorization Best Practices

- Use Guards for route protection
- Implement role-based access control (RBAC) with custom guards
- Extract common auth logic to dedicated services
- Apply proper security headers and cookie settings
- Follow OAuth2/OpenID Connect standards for third-party auth
- Use metadata and decorators for role-based permissions

## Database and TypeORM Best Practices

### Database Module Setup

```typescript
// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfig } from './typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => 
        typeOrmConfig(configService),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
```

### TypeORM Configuration

```typescript
// src/database/typeorm.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  // Get DATABASE_URL if available, otherwise use individual connection params
  const databaseUrl = configService.get<string>('DATABASE_URL');
  
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
      migrations: [join(__dirname, './migrations/*{.ts,.js}')],
      migrationsTableName: 'migrations',
      logging: configService.get('DB_LOGGING', 'false') === 'true',
      synchronize: false, // ALWAYS false in production
    };
  }
  
  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', 'nestjs'),
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, './migrations/*{.ts,.js}')],
    migrationsTableName: 'migrations',
    logging: configService.get('DB_LOGGING', 'false') === 'true',
    synchronize: false, // ALWAYS false in production
  };
};
```

### Migration Scripts with Cross-Env

Add these to package.json:

```json
"scripts": {
  "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/database/typeorm.config.ts",
  "migration:generate": "cross-env DATABASE_URL=postgres://postgres:password@localhost:5432/dbname npm run typeorm -- migration:generate ./src/database/migrations/$npm_config_name",
  "migration:create": "npm run typeorm -- migration:create ./src/database/migrations/$npm_config_name",
  "migration:run": "npx typeorm -d dist/database/typeorm.config.js migration:run",
  "migration:run:local": "cross-env DATABASE_URL=postgres://postgres:password@localhost:5432/dbname npm run typeorm -- migration:run",
  "migration:revert": "npm run typeorm -- migration:revert",
  "migration:revert:local": "cross-env DATABASE_URL=postgres://postgres:password@localhost:5432/dbname npm run typeorm -- migration:revert"
}
```

Install cross-env:

```bash
npm install --save-dev cross-env
```

### Important Database Migration Rules

1. **ALWAYS use the project-provided npm scripts to generate migrations**
   - Use `npm run migration:generate --name=MigrationName` to generate migrations
   - Never create migration files manually

2. **NEVER run migrations directly on the local database**
   - Use Docker instead, with the appropriate command: `npm run docker:dev`
   - Let Docker handle migrations automatically through the entrypoint script

3. **Always check the generated migration file**
   - Review the SQL statements that will be executed
   - Ensure that the up and down methods properly handle the changes

4. **Keep migration files small and focused**
   - One migration per logical change to the database schema
   - Use clear, descriptive names for migration files

5. **Test migrations in both directions**
   - Make sure both the up and down methods work correctly
   - Ensure data integrity is maintained during migrations

### Entity Best Practices

- Use decorators to define column types, constraints, and relationships
- Implement proper cascade options
- Use proper indexing for performance
- Define clear relationships between entities
- Use TypeORM listeners for entity events when appropriate
- Create base entities for common fields (id, timestamps)
- Never use synchronize in production environments

## CORS and Security Configuration

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // Security middleware
  app.use(helmet());
  app.use(cookieParser());
  
  // Configure CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Important for cookies
    allowedHeaders: 'Content-Type, Accept, Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

## Dockerization Best Practices

### Multi-Stage Dockerfile

```dockerfile
# Base stage for dependencies
FROM node:18-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build stage
FROM base as build
RUN npm run build

# Production stage
FROM node:18-alpine as production
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/entrypoint.sh ./
COPY --from=build /app/wait-for-it.sh ./

# Only install production dependencies
RUN npm ci --omit=dev

# Add wait-for-it script to wait for database
RUN chmod +x ./wait-for-it.sh
RUN chmod +x ./entrypoint.sh

# Expose application port
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
```

### Development vs Production Docker Setup

Use docker-compose.override.yml for development-specific configurations:

#### Base docker-compose.yml (Production)

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      target: production
    depends_on:
      - db
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:postgres@db:5432/nestjs
      - JWT_SECRET=your_secret_key
    ports:
      - '3000:3000'
  
  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=nestjs
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  pgdata:
```

#### docker-compose.override.yml (Development)

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      target: base
    command: npm run start:dev
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DB_LOGGING=true
```

This override file will automatically be used with `docker-compose up`:

- Uses the base image with all dependencies
- Mounts the local directory to enable hot reloading
- Runs the dev server instead of production
- Enables database query logging

To run development environment:

```bash
docker-compose up
```

To run production environment (ignoring override):

```bash
docker-compose -f docker-compose.yml up
```

### Entrypoint Script for Migrations

```bash
#!/bin/sh
# entrypoint.sh

echo "Waiting for database to be ready..."
/app/wait-for-it.sh $DB_HOST $DB_PORT -t 60

echo "Running migrations..."
npm run migration:run

echo "Starting application..."
npm run start:prod
```

### Wait-For-It Script

```bash
#!/bin/sh
# wait-for-it.sh

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

until nc -z "$host" "$port"; do
  >&2 echo "Database is unavailable - sleeping"
  sleep 1
done

>&2 echo "Database is up - executing command"
exec $cmd
```

## Testing Best Practices

### Unit Testing

- Use the NestJS Testing Module (`@nestjs/testing`) to create test environments
- Test each component in isolation (controllers, services, etc.)
- Mock dependencies using Jest's mocking capabilities
- Use the `Test.createTestingModule()` pattern for consistency
- Test the business logic, not the framework features
- Create separate test files for each component (e.g., `users.service.spec.ts`)
- Mock external services and database repositories
- Use `jest.spyOn()` to verify method calls and mock return values
- Test both success and error scenarios

```typescript
// Example unit test for a service
describe('UsersService', () => {
  let service: UsersService;
  let repository: MockType<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should find a user by id', async () => {
    const user = { id: 1, name: 'Test User' };
    repository.findOneBy.mockReturnValue(user);
    
    expect(await service.findOne(1)).toEqual(user);
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });
});
```

### Integration Testing

- Test the interaction between multiple components
- Use the actual module configuration with `imports` array
- Override specific providers when needed with `overrideProvider()`
- For database testing, use test databases or in-memory alternatives
- Test complete request-response flows

### End-to-End (E2E) Testing

- Create a dedicated `/test` folder for E2E tests
- Use Supertest to simulate HTTP requests
- Initialize the full application with `moduleRef.createNestApplication()`
- Configure the E2E app the same way as the production app (pipes, guards, etc.)
- Test complete API endpoints with request/response validation
- Clean up test data after tests complete
- Group related API tests by feature/domain

## Advanced Patterns

- Use CQRS pattern with `CommandBus` for complex applications
- Implement event-driven architecture with event emitters
- Use interceptors for cross-cutting concerns
- Apply custom exceptions for domain-specific error handling
- Implement custom decorators for common metadata
- Use proper logging with context
- Implement health checks for infrastructure monitoring