# Otantist Developer Guide

**Environment Setup & Onboarding**  
**Version 2.0 — Updated February 2026**

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Project Structure](#3-project-structure)
4. [Development Workflow](#4-development-workflow)
5. [Database Management](#5-database-management)
6. [API Development](#6-api-development)
7. [Testing](#7-testing)
8. [Coding Standards](#8-coding-standards)
9. [Troubleshooting](#9-troubleshooting)
10. [Quick Reference](#10-quick-reference)

---

## 1. Prerequisites

### Required Software

| Software | Version | Notes |
|----------|---------|-------|
| Node.js | 20.x LTS | Use nvm for version management |
| npm | 10.x | Comes with Node.js |
| Docker Desktop | Latest | Required for PostgreSQL, Redis, Mailhog |
| Git | Latest | Version control |
| VS Code | Latest | Recommended editor |

### Windows-Specific Requirements

> ⚠️ **Important for Windows Users**
> 
> - Install WSL 2 (Windows Subsystem for Linux) for best Docker performance
> - Docker Desktop must be configured to use WSL 2 backend
> - Some Docker caching issues may occur on Windows (see Troubleshooting)

### Recommended VS Code Extensions

```
dbaeumer.vscode-eslint
esbenp.prettier-vscode
bradlc.vscode-tailwindcss
prisma.prisma
mikestead.dotenv
```

---

## 2. Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/otantist.git
cd otantist
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your local settings
# Most defaults work for local development
```

### Step 4: Start Docker Services

```bash
# Start PostgreSQL, Redis, and Mailhog
npm run docker:up

# Verify services are running
docker ps
```

You should see these containers:
- `otantist-postgres` on port 5432
- `otantist-redis` on port 6379
- `otantist-mailhog` on ports 1025 (SMTP) and 8025 (Web UI)

### Step 5: Initialize the Database

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed with test data
npm run db:seed
```

### Step 6: Open Prisma Studio

```bash
# In apps/api directory
npx prisma studio
```

This opens a database GUI at http://localhost:5555

> 💡 **Tip:** Use Prisma Studio instead of pgAdmin. It's simpler and already configured.

### Step 7: Start Development Servers

You need **two terminal windows**:

**Terminal 1 — API Server:**
```bash
# From root directory
npm run dev:api
```

**Terminal 2 — Web Application:**
```bash
# From root directory
npm run dev:web
```

### Step 8: Verify Everything Works

| Service | URL | What to Check |
|---------|-----|---------------|
| API | http://localhost:3001 | Should return JSON |
| Swagger Docs | http://localhost:3001/api/docs | API documentation |
| Web App | http://localhost:3000 | Next.js application |
| Mailhog | http://localhost:8025 | Email testing UI |
| Prisma Studio | http://localhost:5555 | Database GUI |

---

## 3. Project Structure

```
otantist/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # Database migrations
│   │   │   └── seed.ts         # Seed data
│   │   ├── src/
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── users/          # User management
│   │   │   ├── preferences/    # User preferences
│   │   │   ├── messaging/      # 1:1 messaging
│   │   │   ├── moderation/     # Moderation tools
│   │   │   ├── parent-dashboard/
│   │   │   ├── prisma/         # Prisma service
│   │   │   ├── common/         # Shared utilities
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── test/
│   │
│   ├── web/                    # Next.js web app
│   │   ├── app/                # App router pages
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   │
│   └── mobile/                 # React Native + Expo (Phase 2)
│       ├── app/                # Expo router
│       ├── components/
│       └── lib/
│
├── packages/
│   ├── shared/                 # Shared types & constants
│   │   └── src/
│   │       ├── types/
│   │       └── constants/
│   │
│   └── ui/                     # Shared UI components
│       └── src/
│
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── docker-compose.yml
├── package.json                # Root package.json (workspaces)
└── .env.example
```

---

## 4. Development Workflow

### Branch Naming

```
feature/OT-123-add-calm-mode
bugfix/OT-456-fix-message-queue
hotfix/OT-789-security-patch
chore/update-dependencies
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(messaging): add time boundary enforcement
fix(auth): resolve token refresh race condition
docs(api): update swagger documentation
chore(deps): upgrade nestjs to v10.3
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with meaningful commits
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Create PR with description
6. Request review
7. Squash and merge

---

## 5. Database Management

### Prisma Commands

```bash
cd apps/api

# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name add_user_preferences

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Schema Changes Workflow

1. Edit `apps/api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Prisma generates migration SQL and updates client
4. Commit both schema and migration files

### Connecting to Database Directly

**Via psql:**
```bash
psql postgresql://otantist:otantist_dev@localhost:5432/otantist_dev
```

**Via Prisma Studio (Recommended):**
```bash
cd apps/api
npx prisma studio
```

---

## 6. API Development

### Creating a New Module

```bash
cd apps/api

# Generate module scaffolding
npx nest generate module feature-name
npx nest generate controller feature-name
npx nest generate service feature-name
```

### API Documentation

Swagger UI is available at http://localhost:3001/api/docs

Use decorators to document endpoints:

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('messaging')
@Controller('messages')
export class MessagesController {
  
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  @Post()
  async sendMessage(@Body() dto: SendMessageDto) {
    // ...
  }
}
```

### Authentication

Protected routes use JWT:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get('me')
async getProfile(@Request() req) {
  return req.user;
}
```

---

## 7. Testing

### Running Tests

```bash
# All tests
npm test

# API tests only
npm test -w @otantist/api

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Structure

```
apps/api/
├── src/
│   └── auth/
│       ├── auth.service.ts
│       └── auth.service.spec.ts    # Unit test
└── test/
    ├── auth.e2e-spec.ts            # E2E test
    └── jest-e2e.json
```

### Writing Tests

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should register a new user', async () => {
    const result = await service.register({
      email: 'test@example.com',
      password: 'SecureP@ss123',
      inviteCode: 'TEST123',
      language: 'en',
    });

    expect(result.accountId).toBeDefined();
  });
});
```

---

## 8. Coding Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types on functions
- Use interfaces over types when possible

### Formatting

- Prettier handles formatting
- 2 space indentation
- Single quotes
- Trailing commas

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user-preferences.service.ts` |
| Classes | PascalCase | `UserPreferencesService` |
| Functions | camelCase | `getUserPreferences()` |
| Variables | camelCase | `userPreferences` |
| Constants | UPPER_SNAKE | `MAX_MESSAGE_LENGTH` |
| Interfaces | PascalCase | `UserPreferences` |
| Enums | PascalCase | `AccountStatus` |

### Bilingual Content

All user-facing strings must support French and English:

```typescript
// ❌ Bad
throw new BadRequestException('Invalid email');

// ✅ Good
throw new BadRequestException({
  code: 'INVALID_EMAIL',
  message_en: 'Invalid email address',
  message_fr: 'Adresse courriel invalide',
});
```

---

## 9. Troubleshooting

### Docker Issues

**Containers won't start:**
```bash
# Check logs
docker-compose logs postgres
docker-compose logs redis

# Restart containers
npm run docker:down
npm run docker:up
```

**Port already in use:**
```bash
# Windows - find process using port 5432
netstat -ano | findstr :5432

# Kill it or change port in docker-compose.yml
```

### Database Issues

**Migration fails:**
```bash
# Reset database (development only!)
cd apps/api
npx prisma migrate reset

# Or fix manually
npx prisma migrate resolve --rolled-back migration_name
```

**Prisma client out of sync:**
```bash
npx prisma generate
```

### TypeScript Compilation Errors

**Unused variables in seed.ts:**

If you see warnings about unused variables in `seed.ts`, this is expected. The seed script creates data that may not be immediately used. You can either:
- Prefix unused variables with underscore: `const _unused = ...`
- Add `// @ts-ignore` comment
- Use the variables in console.log for verification

### pgAdmin Issues

> 💡 **Recommendation:** Skip pgAdmin and use Prisma Studio instead.

If pgAdmin won't connect or has issues:
1. Don't waste time troubleshooting it
2. Use `npx prisma studio` instead (runs on http://localhost:5555)
3. Prisma Studio is simpler and already configured

### Docker Caching Issues (Windows)

> ⚠️ **Windows-Specific Issue**

If you're seeing stale data or containers not updating:

```bash
# Nuclear option - removes all data
docker-compose down -v
docker system prune -a --volumes
npm run docker:up
```

**Warning:** This deletes all Docker volumes including database data.

### Node/npm Issues

**Dependency conflicts:**
```bash
# Clear everything and reinstall
npm run clean
rm package-lock.json
npm install
```

**Wrong Node version:**
```bash
# Use nvm to switch
nvm use 20
```

---

## 10. Quick Reference

### Daily Development Commands

```bash
# Start all services
npm run docker:up
npm run dev:api      # Terminal 1
npm run dev:web      # Terminal 2
```

### Database Commands

```bash
cd apps/api
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed test data
```

### Testing Commands

```bash
npm test             # Run all tests
npm run lint         # Lint all code
```

### Docker Commands

```bash
npm run docker:up    # Start containers
npm run docker:down  # Stop containers
npm run docker:logs  # View logs
```

### Build Commands

```bash
npm run build        # Build all apps
npm run build:api    # Build API only
```

### Environment URLs

| Service | URL |
|---------|-----|
| API Server | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| Web App | http://localhost:3000 |
| Prisma Studio | http://localhost:5555 |
| Mailhog | http://localhost:8025 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Need Help?

- Check the `docs/` folder for additional documentation
- Review existing code for patterns
- Ask in the team Slack channel
- Create a GitHub issue for bugs

---

*Document Version: 2.0*  
*Updated: February 2026*  
*Happy coding! 🚀*
