# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 3 - Major Expansion (2024-11-18)

#### Added

**Database & Persistence:**
- Prisma ORM integration with PostgreSQL
- Comprehensive database schema with 11 models:
  - `Template` - Database-backed templates
  - `TemplateCategory` - Template organization
  - `TemplateVersion` - Template version history
  - `Document` - Generated documents with full metadata
  - `DocumentMetadata` - Extended document information
  - `DocumentVersion` - Document version tracking
  - `GenerationJob` - Batch generation tracking
  - `GenerationMetric` - Analytics and performance metrics
  - `LLMCache` - Response caching for cost optimization
  - `Configuration` - System configuration storage
- Database migrations via Prisma Migrate
- Comprehensive seed script with realistic sample data
- Database scripts: `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:studio`, `db:reset`

**Provider Abstraction Layer:**
- `ILLMProvider` interface for pluggable LLM backends
- `OpenAIProvider` implementation with:
  - Support for GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-4, GPT-3.5-turbo
  - Accurate cost estimation
  - Configuration validation
  - Error handling with retries
- `ProviderFactory` for easy provider instantiation
- Custom provider registration system

**Domain Services:**
- `DocumentService` - Full document lifecycle management:
  - Generate documents with LLM
  - CRUD operations
  - Version management
  - History tracking
  - Pagination & filtering
- `TemplateService` - Template management:
  - Create/update/delete templates
  - Template versioning
  - Category management
  - Search and filtering

**Infrastructure:**
- Winston logger with file and console transports
- `MetricsCollector` for tracking:
  - Generation performance
  - Token usage
  - Costs
  - Success/failure rates
- In-memory metrics collector for testing

**Templates:**
- 4 additional professional templates:
  - Project Proposal (プロジェクト提案書)
  - Partnership Proposal (業務提携提案書)
  - Market Research Report (市場調査報告書)
  - Confidentiality Agreement / NDA (秘密保持契約書)
- Total: 7 production-ready templates

**Docker & Environment:**
- PostgreSQL 16 service in docker-compose
- Redis 7 service for caching (optional)
- Health checks for all services
- Volume persistence
- Updated `.env.example` with all configuration options

**Documentation:**
- `docs/PHASE3_OVERVIEW.md` - Phase 3 implementation plan and roadmap
- `docs/ARCHITECTURE.md` - Comprehensive architecture documentation
- `docs/INTEGRATION_RECIPES.md` - Practical integration patterns
- Inline code documentation improvements

**Testing:**
- Comprehensive unit tests for `DocumentService`
- Unit tests for `ProviderFactory`
- Test coverage for provider abstraction
- Mock implementations for testing

**Dependencies:**
- `@prisma/client` ^5.7.1 - Database ORM
- `prisma` ^5.7.1 - Database toolkit
- `inquirer` ^8.2.6 - Interactive prompts (for future CLI enhancements)
- `csv-parse` ^5.5.3 - CSV parsing for batch operations
- `winston` ^3.11.0 - Logging
- `date-fns` ^3.0.6 - Date utilities
- `nanoid` ^3.3.7 - ID generation

#### Changed

- LLM client refactored into provider abstraction
- Docker Compose now includes PostgreSQL and Redis
- Environment configuration expanded with database and cache settings
- Package.json scripts enhanced with database management commands

#### Phase 2 - Production Ready (2024-11-18)

#### Added
- Comprehensive test suite with Vitest (15+ tests)
- zod validation for all data structures
- ESLint + Prettier for code quality
- Docker support with multi-stage builds
- Demo script (`npm run demo`)
- Example outputs in `examples/` directory
- Enhanced README with Phase 2 structure

#### Phase 1 - Initial Implementation (2024-11-18)

#### Added
- Initial CLI implementation with Commander.js
- OpenAI API integration for document generation
- YAML-based template system
- Three initial templates:
  - Bank Loan Proposal (銀行融資提案書)
  - Government Grant Plan (補助金申請事業計画書)
  - Business Proposal (事業提案書)
- Basic commands: `generate`, `list`, `info`
- TypeScript compilation and type safety
- Basic README and documentation

## Version History

### [1.0.0] - 2024-11-18

Initial release with Phase 1, 2, and 3 implementations.

## Upgrade Guide

### Migrating to Phase 3

If you were using Phase 2 or earlier:

1. **Database Setup:**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env and set DATABASE_URL

   # Run migrations
   npm run db:push

   # Seed sample data (optional)
   npm run db:seed
   ```

2. **Code Changes:**
   - Import from new provider system:
     ```typescript
     // Old
     import { LLMClient } from './llm/client';

     // New
     import { ProviderFactory } from './lib/providers/provider-factory';
     const provider = ProviderFactory.create('openai', { apiKey });
     ```

3. **Docker:**
   - Update docker-compose.yml to include PostgreSQL and Redis
   - Set environment variables in docker-compose

### Breaking Changes

#### Phase 3
- `LLMClient` class moved to `OpenAIProvider`
- New provider abstraction requires updating imports
- Database now required for full functionality (file-based templates still work)

#### Future Breaking Changes
None planned. We maintain backwards compatibility where possible.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/jp-business-docs-generator-cli/issues)
- 💬 [Discussions](https://github.com/yourusername/jp-business-docs-generator-cli/discussions)
