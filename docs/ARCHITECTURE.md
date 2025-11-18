# Architecture Documentation

## Overview

jp-business-docs-generator-cli is built with a layered architecture that separates concerns and enables extensibility.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                             │
│  (Commander.js - User Interface & Command Routing)          │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  • DocumentService    • TemplateService                      │
│  • JobService (future)                                       │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                             │
│  • Entities (Document, Template, Job)                        │
│  • Business Rules & Validation (zod schemas)                 │
│  • Events (future event system)                              │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                         │
│  ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│  │  Providers   │   Storage    │    Cache     │  Metrics  │ │
│  │  (LLM APIs)  │  (Prisma DB) │   (Redis)    │  (Logger) │ │
│  └──────────────┴──────────────┴──────────────┴───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI Layer (`src/cli.ts`)

**Responsibility:** User interface and command routing

**Commands:**
- `generate <template>` - Generate a document
- `list` - List available templates
- `info <template>` - Show template details

**Future Commands:**
- `template create` - Interactive template creation
- `template validate` - Validate template structure
- `history` - View generation history
- `batch generate` - Batch generation from CSV/JSON

### 2. Service Layer (`src/lib/services/`)

**Responsibility:** Business logic orchestration

#### DocumentService
- `generateDocument()` - Generate and persist documents
- `getDocument(id)` - Retrieve document by ID
- `listDocuments()` - List with pagination and filtering
- `updateDocument(id)` - Update document and create version
- `getDocumentHistory()` - Retrieve version history
- `compareVersions()` - Compare two versions

#### TemplateService
- `createTemplate()` - Create new template in database
- `getTemplate(id)` - Retrieve template
- `listTemplates()` - List with filtering
- `updateTemplate(id)` - Update and version template
- `listCategories()` - Get template categories

### 3. Domain Layer

#### Entities
Defined in Prisma schema:
- **Template** - Document template definition
- **TemplateCategory** - Template organization
- **TemplateVersion** - Template version history
- **Document** - Generated document
- **DocumentMetadata** - Extended document metadata
- **DocumentVersion** - Document version history
- **GenerationJob** - Batch generation tracking
- **GenerationMetric** - Analytics and monitoring
- **LLMCache** - Response caching
- **Configuration** - System configuration

#### Validation
- zod schemas in `src/templates/types.ts`
- Runtime validation for all inputs
- Type-safe parameter handling

### 4. Infrastructure Layer

#### Providers (`src/lib/providers/`)

**ILLMProvider Interface:**
```typescript
interface ILLMProvider {
  name: string;
  supportedModels: string[];
  generateDocument(template, parameters, options): Promise<GenerationResult>;
  validateConfig(): Promise<boolean>;
  estimateCost(tokenCount, model): number;
}
```

**Implementations:**
- `OpenAIProvider` - OpenAI GPT models
- (Future: `AnthropicProvider`, `LocalProvider`)

**Factory Pattern:**
```typescript
const provider = ProviderFactory.create('openai', { apiKey });
```

#### Storage

**Prisma ORM:**
- PostgreSQL database
- Type-safe queries
- Migrations via Prisma Migrate
- Comprehensive schema with relationships

**File System:**
- YAML templates in `templates/`
- Generated outputs in `output/`
- Logs in `logs/`

#### Caching

**Database-backed Cache:**
- `LLMCache` table for response caching
- TTL-based expiration
- Hit count tracking

**Redis (Future):**
- Hot cache for frequently accessed data
- Session storage
- Job queue

#### Metrics & Logging

**Winston Logger:**
```typescript
logger.info('Message', { context });
logger.error('Error', { error });
```

**MetricsCollector:**
- Records generation metrics
- Tracks costs and performance
- Provides statistics API

## Data Flow

### Document Generation Flow

```
1. CLI Command
   └─> bizdoc generate loan-proposal --company "X" --amount 1000000

2. CLI Parser (Commander)
   └─> Extract template name and parameters

3. Template Loading
   ├─> File-based: TemplateLoader reads YAML
   └─> DB-based: TemplateService.getTemplateBySlug()

4. Validation
   └─> zod schemas validate template structure and parameters

5. Provider Selection
   └─> ProviderFactory creates appropriate LLM provider

6. Document Generation
   ├─> Provider builds prompt from template + parameters
   ├─> LLM API call
   └─> Response parsing

7. Persistence
   ├─> DocumentService.generateDocument()
   ├─> Save to database
   ├─> Create initial version
   └─> Write to file system

8. Metrics Recording
   ├─> Token count
   ├─> Cost
   ├─> Duration
   └─> Success/failure

9. Output
   └─> Display path to generated document
```

## Extension Points

### 1. Custom LLM Providers

```typescript
class CustomProvider implements ILLMProvider {
  // Implement interface
}

ProviderFactory.registerProvider('custom', CustomProvider);
```

### 2. Output Formatters (Future)

```typescript
interface IOutputFormatter {
  format(content: string): Promise<Buffer>;
  extension: string;
}

// Implementations: MarkdownFormatter, PDFFormatter, DOCXFormatter
```

### 3. Event System (Future)

```typescript
interface DomainEvent {
  type: string;
  timestamp: Date;
  payload: any;
}

// Events:
// - DocumentGenerationStarted
// - DocumentGenerationCompleted
// - DocumentGenerationFailed
// - TemplateCreated
// - TemplateValidated
```

### 4. Plugin System (Future)

```typescript
interface Plugin {
  name: string;
  version: string;
  hooks: {
    beforeGeneration?: (context) => Promise<void>;
    afterGeneration?: (context) => Promise<void>;
    onError?: (error) => Promise<void>;
  };
}
```

## Database Schema

See `prisma/schema.prisma` for complete schema.

**Key Relationships:**
```
TemplateCategory
  └─> hasMany: Template

Template
  ├─> belongsTo: TemplateCategory
  ├─> hasMany: Document
  └─> hasMany: TemplateVersion

Document
  ├─> belongsTo: Template
  ├─> hasOne: DocumentMetadata
  ├─> hasMany: DocumentVersion
  └─> belongsTo: GenerationJob (optional)

GenerationJob
  └─> hasMany: Document
```

## Security Considerations

1. **API Keys:** Stored in environment variables, never committed
2. **Input Validation:** All inputs validated with zod
3. **SQL Injection:** Prevented by Prisma's parameterized queries
4. **Rate Limiting:** (Future) Implemented at service layer
5. **Audit Logging:** All operations logged with Winston

## Performance Optimization

1. **Caching:** LLM responses cached to reduce API calls
2. **Pagination:** Large lists paginated to reduce memory usage
3. **Lazy Loading:** Relationships loaded only when needed
4. **Connection Pooling:** Prisma manages database connections
5. **Indexing:** Database indices on frequently queried fields

## Error Handling

**Error Hierarchy:**
```
AppError (base)
├─> ValidationError
├─> NotFoundError
├─> LLMProviderError
├─> DatabaseError
└─> ConfigurationError
```

All errors logged and returned with appropriate HTTP status codes (if API layer added).

## Testing Strategy

1. **Unit Tests:** Individual functions and classes
2. **Integration Tests:** Service layer with database
3. **E2E Tests:** Complete flows from CLI to output
4. **Performance Tests:** Load testing for batch operations

## Deployment

**Docker Compose:**
- Multi-container setup
- PostgreSQL for persistence
- Redis for caching
- Application container

**Environment Variables:**
```
DATABASE_URL - PostgreSQL connection string
REDIS_URL - Redis connection string
OPENAI_API_KEY - OpenAI API key
LOG_LEVEL - Logging level (debug, info, warn, error)
```

## Future Roadmap

See `docs/PHASE3_OVERVIEW.md` for detailed roadmap.

**Priorities:**
1. Enhanced CLI commands (template management, history, batch)
2. Output format adapters (PDF, DOCX)
3. API layer for programmatic access
4. Web UI (optional)
5. Advanced analytics dashboard
6. Multi-language support
7. Template marketplace

## References

- [Domain Model](./PHASE3_OVERVIEW.md#domain-expansion-new-entities--relationships)
- [Integration Recipes](./INTEGRATION_RECIPES.md)
- [Prisma Schema](../prisma/schema.prisma)
- [README](../README.md)
