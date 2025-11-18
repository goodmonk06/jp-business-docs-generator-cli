# Integration Recipes

This document provides practical recipes for integrating jp-business-docs-generator-cli with other systems in a larger ecosystem.

## Table of Contents

1. [Programmatic Usage](#programmatic-usage)
2. [Event-Driven Integration](#event-driven-integration)
3. [Batch Processing](#batch-processing)
4. [Webhook Integration](#webhook-integration)
5. [Authentication & Authorization](#authentication--authorization)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Multi-Tenant Deployment](#multi-tenant-deployment)

---

## Programmatic Usage

### As a Library

```typescript
import { PrismaClient } from '@prisma/client';
import { DocumentService, TemplateService } from 'jp-business-docs-generator-cli/dist/lib/services';
import { OpenAIProvider } from 'jp-business-docs-generator-cli/dist/lib/providers';
import { MetricsCollector } from 'jp-business-docs-generator-cli/dist/lib/metrics';

// Initialize dependencies
const prisma = new PrismaClient();
const llmProvider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const metrics = new MetricsCollector(prisma);

// Create services
const documentService = new DocumentService(prisma, llmProvider, metrics);
const templateService = new TemplateService(prisma);

// Use services
async function generateLoanProposal() {
  const template = await templateService.getTemplateBySlug('loan-proposal');

  if (!template) {
    throw new Error('Template not found');
  }

  const document = await documentService.generateDocument({
    title: 'My Loan Proposal',
    template: template as any, // Type conversion needed
    parameters: {
      company: 'My Company Inc.',
      amount: 5000000,
      purpose: 'Expansion',
      business_type: 'Technology',
    },
    metadata: {
      author: 'John Doe',
      department: 'Finance',
      tags: ['urgent', 'expansion'],
    },
  });

  console.log(`Document generated: ${document.id}`);
  return document;
}
```

### Express.js API Wrapper

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { DocumentService } from './lib/services/document-service';
import { OpenAIProvider } from './lib/providers/openai-provider';
import { MetricsCollector } from './lib/metrics';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const provider = new OpenAIProvider();
const metrics = new MetricsCollector(prisma);
const documentService = new DocumentService(prisma, provider, metrics);

// Generate document endpoint
app.post('/api/documents/generate', async (req, res) => {
  try {
    const { templateId, parameters, title, metadata } = req.body;

    const template = await prisma.template.findUnique({ where: { id: templateId } });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const document = await documentService.generateDocument({
      title,
      templateId,
      template: template as any,
      parameters,
      metadata,
    });

    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

// List documents endpoint
app.get('/api/documents', async (req, res) => {
  const { skip, take, status } = req.query;

  const result = await documentService.listDocuments({
    skip: skip ? parseInt(skip as string) : 0,
    take: take ? parseInt(take as string) : 20,
    status: status as any,
  });

  res.json(result);
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Event-Driven Integration

### Publishing Events to Message Queue

```typescript
import { EventEmitter } from 'events';
import amqp from 'amqplib';

class DocumentEventPublisher extends EventEmitter {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async init() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('documents', 'topic', { durable: true });
  }

  async publishDocumentGenerated(document: any) {
    const event = {
      type: 'document.generated',
      timestamp: new Date().toISOString(),
      data: {
        documentId: document.id,
        templateId: document.templateId,
        title: document.title,
      },
    };

    await this.channel.publish(
      'documents',
      'document.generated',
      Buffer.from(JSON.stringify(event))
    );
  }
}

// Integration in DocumentService
class DocumentServiceWithEvents extends DocumentService {
  constructor(
    prisma: PrismaClient,
    provider: ILLMProvider,
    metrics: MetricsCollector,
    private eventPublisher: DocumentEventPublisher
  ) {
    super(prisma, provider, metrics);
  }

  async generateDocument(options: CreateDocumentOptions) {
    const document = await super.generateDocument(options);

    // Publish event
    await this.eventPublisher.publishDocumentGenerated(document);

    return document;
  }
}
```

### Consuming Events

```typescript
// Another service listening for document events
async function consumeDocumentEvents() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();

  await channel.assertExchange('documents', 'topic', { durable: true });
  const q = await channel.assertQueue('', { exclusive: true });

  await channel.bindQueue(q.queue, 'documents', 'document.#');

  channel.consume(q.queue, async (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());

      switch (event.type) {
        case 'document.generated':
          // Trigger post-generation workflow
          await sendNotificationEmail(event.data);
          await updateDashboard(event.data);
          break;

        case 'document.approved':
          // Archive to long-term storage
          await archiveDocument(event.data.documentId);
          break;
      }

      channel.ack(msg);
    }
  });
}
```

## Batch Processing

### CSV Import for Batch Generation

```typescript
import { parse } from 'csv-parse/sync';
import fs from 'fs';

async function batchGenerateFromCSV(csvPath: string, templateId: string) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true });

  // Create generation job
  const job = await prisma.generationJob.create({
    data: {
      name: `Batch from ${csvPath}`,
      status: 'PENDING',
      totalDocuments: records.length,
      inputData: { source: 'csv', filename: csvPath },
    },
  });

  // Get template
  const template = await templateService.getTemplate(templateId);
  if (!template) throw new Error('Template not found');

  // Generate documents
  for (const record of records) {
    try {
      const document = await documentService.generateDocument({
        title: `${template.name} - ${record.company}`,
        templateId,
        template: template as any,
        parameters: record,
        generationJobId: job.id,
      });

      await prisma.generationJob.update({
        where: { id: job.id },
        data: { completedCount: { increment: 1 } },
      });

      console.log(`Generated: ${document.id}`);
    } catch (error) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { failedCount: { increment: 1 } },
      });

      console.error(`Failed for ${record.company}:`, error);
    }
  }

  // Mark job complete
  await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  return job;
}
```

### Queue-Based Batch Processing

```typescript
import Bull from 'bull';

const documentQueue = new Bull('document-generation', process.env.REDIS_URL);

// Producer
async function queueBatchGeneration(requests: Array<{ template: string; params: any }>) {
  for (const request of requests) {
    await documentQueue.add('generate', request, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}

// Consumer
documentQueue.process('generate', async (job) => {
  const { template, params } = job.data;

  const templateData = await templateService.getTemplateBySlug(template);
  if (!templateData) throw new Error('Template not found');

  const document = await documentService.generateDocument({
    title: `${template} - ${params.company}`,
    template: templateData as any,
    parameters: params,
  });

  return { documentId: document.id };
});
```

## Webhook Integration

### Notifying External Systems

```typescript
import axios from 'axios';

interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
}

class WebhookNotifier {
  constructor(private config: WebhookConfig) {}

  async notify(event: string, data: any) {
    if (!this.config.events.includes(event)) return;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const signature = this.signPayload(payload);

    try {
      await axios.post(this.config.url, payload, {
        headers: {
          'X-Webhook-Signature': signature,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    } catch (error) {
      console.error('Webhook delivery failed:', error);
      // Could retry or log to dead letter queue
    }
  }

  private signPayload(payload: any): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}

// Usage
const webhookNotifier = new WebhookNotifier({
  url: 'https://your-app.com/webhooks/documents',
  events: ['document.generated', 'document.approved'],
  secret: process.env.WEBHOOK_SECRET!,
});

// After document generation
await webhookNotifier.notify('document.generated', {
  documentId: document.id,
  title: document.title,
});
```

## Authentication & Authorization

### JWT-Based API Authentication

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// Middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as User;
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Authorization
function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Protected route
app.post('/api/documents/generate', authenticate, authorize(['admin', 'user']), async (req, res) => {
  // ... generation logic
});
```

### Row-Level Security with Prisma

```typescript
// Extend Prisma Client with user context
function createPrismaClient(userId: string) {
  return new PrismaClient().$extends({
    query: {
      document: {
        async findMany({ args, query }) {
          args.where = { ...args.where, userId };
          return query(args);
        },
      },
    },
  });
}

// In request handler
app.get('/api/documents', authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  const prisma = createPrismaClient(userId);

  const documents = await prisma.document.findMany();
  // Only returns documents owned by the user

  res.json(documents);
});
```

## Monitoring & Alerts

### Prometheus Metrics

```typescript
import prometheus from 'prom-client';

const register = new prometheus.Registry();

// Metrics
const generationCounter = new prometheus.Counter({
  name: 'bizdoc_generations_total',
  help: 'Total number of document generations',
  labelNames: ['template', 'status'],
});

const generationDuration = new prometheus.Histogram({
  name: 'bizdoc_generation_duration_seconds',
  help: 'Document generation duration',
  labelNames: ['template'],
  buckets: [1, 2, 5, 10, 30, 60],
});

const generationCost = new prometheus.Counter({
  name: 'bizdoc_generation_cost_usd',
  help: 'Total cost of generations',
  labelNames: ['provider', 'model'],
});

register.registerMetric(generationCounter);
register.registerMetric(generationDuration);
register.registerMetric(generationCost);

// Record metrics during generation
async function generateWithMetrics(template: string, params: any) {
  const end = generationDuration.startTimer({ template });

  try {
    const result = await documentService.generateDocument({...});

    generationCounter.inc({ template, status: 'success' });
    generationCost.inc({ provider: result.llmProvider, model: result.llmModel }, result.cost);

    return result;
  } catch (error) {
    generationCounter.inc({ template, status: 'failure' });
    throw error;
  } finally {
    end();
  }
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Slack Alerts

```typescript
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_TOKEN);

async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'error') {
  const color = { info: '#36a64f', warning: '#ff9800', error: '#f44336' }[severity];

  await slack.chat.postMessage({
    channel: '#bizdoc-alerts',
    attachments: [
      {
        color,
        text: message,
        ts: Math.floor(Date.now() / 1000).toString(),
      },
    ],
  });
}

// Usage
documentQueue.on('failed', async (job, error) => {
  await sendSlackAlert(
    `Document generation failed: ${job.id}\nError: ${error.message}`,
    'error'
  );
});
```

## Multi-Tenant Deployment

### Tenant Isolation

```typescript
// Tenant context
interface TenantContext {
  tenantId: string;
  subdomain: string;
  config: {
    maxDocumentsPerMonth: number;
    allowedTemplates: string[];
  };
}

// Tenant-aware Prisma client
function createTenantPrismaClient(tenantId: string) {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Add tenant filter to all queries
          if (args.where) {
            args.where = { ...args.where, tenantId };
          } else {
            args.where = { tenantId };
          }

          // Add tenant ID to creates
          if (args.data && !Array.isArray(args.data)) {
            args.data = { ...args.data, tenantId };
          }

          return query(args);
        },
      },
    },
  });
}

// Middleware to extract tenant
app.use((req, res, next) => {
  const subdomain = req.hostname.split('.')[0];
  const tenant = await getTenantBySubdomain(subdomain);

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  (req as any).tenant = tenant;
  (req as any).prisma = createTenantPrismaClient(tenant.id);

  next();
});
```

## Summary

These integration recipes demonstrate how jp-business-docs-generator-cli can be integrated into larger systems:

- **Programmatic Usage**: Use as a library or wrap in an API
- **Event-Driven**: Publish/consume events for decoupled architecture
- **Batch Processing**: Handle bulk operations efficiently
- **Webhooks**: Notify external systems of events
- **Auth**: Secure with JWT and row-level security
- **Monitoring**: Track metrics and send alerts
- **Multi-Tenant**: Isolate data by tenant

For more examples, see the `examples/` directory in the repository.
