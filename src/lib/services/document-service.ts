import { PrismaClient, Document, DocumentStatus } from '@prisma/client';
import { DocumentTemplate } from '../../templates/types';
import { ILLMProvider } from '../providers/types';
import { MetricsCollector } from '../metrics';
import logger from '../logger';
import { nanoid } from 'nanoid';

export interface CreateDocumentOptions {
  title: string;
  templateId?: string;
  template: DocumentTemplate;
  parameters: Record<string, string | number>;
  format?: string;
  metadata?: {
    author?: string;
    department?: string;
    tags?: string[];
  };
}

export interface UpdateDocumentOptions {
  title?: string;
  status?: DocumentStatus;
  content?: string;
  metadata?: Partial<{
    reviewer?: string;
    approver?: string;
    notes?: string;
  }>;
}

export class DocumentService {
  constructor(
    private prisma: PrismaClient,
    private llmProvider: ILLMProvider,
    private metrics: MetricsCollector
  ) {}

  /**
   * Generate and persist a new document
   */
  async generateDocument(options: CreateDocumentOptions): Promise<Document> {
    const startTime = Date.now();
    logger.info('Generating document', { title: options.title, template: options.template.name });

    try {
      // Generate content using LLM
      const result = await this.llmProvider.generateDocument(
        options.template,
        options.parameters
      );

      // Create document record
      const document = await this.prisma.document.create({
        data: {
          id: nanoid(),
          title: options.title,
          templateId: options.templateId,
          templateSnapshot: {
            name: options.template.name,
            version: '1.0.0',
          },
          parameters: options.parameters,
          content: result.content,
          format: options.format || 'markdown',
          status: 'DRAFT',
          llmProvider: result.provider,
          llmModel: result.model,
          tokenCount: result.tokenCount,
          generationTimeMs: result.durationMs,
          cost: result.cost,
          metadata: options.metadata
            ? {
                create: {
                  author: options.metadata.author,
                  department: options.metadata.department,
                  tags: options.metadata.tags || [],
                },
              }
            : undefined,
        },
        include: {
          metadata: true,
        },
      });

      // Create initial version
      await this.prisma.documentVersion.create({
        data: {
          documentId: document.id,
          version: 1,
          content: result.content,
          changelog: 'Initial version',
          createdBy: options.metadata?.author,
        },
      });

      // Record metrics
      await this.metrics.recordGeneration({
        templateId: options.templateId,
        documentId: document.id,
        provider: result.provider,
        model: result.model,
        tokenCount: result.tokenCount,
        cost: result.cost,
        durationMs: Date.now() - startTime,
        success: true,
      });

      logger.info('Document generated successfully', { documentId: document.id });
      return document;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Document generation failed', { error: errorMessage });

      await this.metrics.recordError({
        templateId: options.templateId,
        errorMessage,
      });

      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        metadata: true,
        versions: {
          orderBy: { version: 'desc' },
        },
        template: true,
      },
    });
  }

  /**
   * List documents with pagination
   */
  async listDocuments(options: {
    skip?: number;
    take?: number;
    status?: DocumentStatus;
    templateId?: string;
  } = {}): Promise<{ documents: Document[]; total: number }> {
    const where: any = {};
    if (options.status) where.status = options.status;
    if (options.templateId) where.templateId = options.templateId;

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip: options.skip || 0,
        take: options.take || 20,
        include: {
          metadata: true,
          template: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { documents, total };
  }

  /**
   * Update document
   */
  async updateDocument(id: string, options: UpdateDocumentOptions): Promise<Document> {
    const document = await this.prisma.document.update({
      where: { id },
      data: {
        title: options.title,
        status: options.status,
        content: options.content,
        metadata: options.metadata
          ? {
              update: options.metadata,
            }
          : undefined,
      },
      include: {
        metadata: true,
      },
    });

    // Create new version if content changed
    if (options.content) {
      const latestVersion = await this.prisma.documentVersion.findFirst({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      });

      await this.prisma.documentVersion.create({
        data: {
          documentId: id,
          version: (latestVersion?.version || 0) + 1,
          content: options.content,
          changelog: 'Document updated',
        },
      });
    }

    return document;
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    await this.prisma.document.delete({ where: { id } });
  }

  /**
   * Get document history
   */
  async getDocumentHistory(documentId: string) {
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Compare two document versions
   */
  async compareVersions(documentId: string, version1: number, version2: number) {
    const [v1, v2] = await Promise.all([
      this.prisma.documentVersion.findUnique({
        where: { documentId_version: { documentId, version: version1 } },
      }),
      this.prisma.documentVersion.findUnique({
        where: { documentId_version: { documentId, version: version2 } },
      }),
    ]);

    if (!v1 || !v2) {
      throw new Error('Version not found');
    }

    return {
      version1: v1,
      version2: v2,
      // In a real implementation, you might add diff logic here
    };
  }
}
