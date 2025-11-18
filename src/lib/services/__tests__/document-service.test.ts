import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentService } from '../document-service';
import { ILLMProvider, GenerationResult } from '../../providers/types';
import { DocumentTemplate } from '../../../templates/types';

// Mock Prisma Client
const mockPrisma = {
  document: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  documentVersion: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
} as any;

// Mock LLM Provider
class MockLLMProvider implements ILLMProvider {
  name = 'mock';
  supportedModels = ['mock-model'];

  async generateDocument(): Promise<GenerationResult> {
    return {
      content: '# Test Document\n\nGenerated content',
      provider: 'mock',
      model: 'mock-model',
      tokenCount: 100,
      cost: 0.01,
      durationMs: 1000,
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  estimateCost(tokenCount: number): number {
    return tokenCount * 0.0001;
  }
}

// Mock Metrics
const mockMetrics = {
  recordGeneration: vi.fn(),
  recordError: vi.fn(),
} as any;

describe('DocumentService', () => {
  let service: DocumentService;
  let mockProvider: MockLLMProvider;

  const mockTemplate: DocumentTemplate = {
    name: 'Test Template',
    purpose: 'Testing',
    audience: 'Developers',
    required_sections: ['Section 1', 'Section 2'],
    tone: 'Professional',
    parameters: [
      { name: 'param1', description: 'Parameter 1', required: true },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = new MockLLMProvider();
    service = new DocumentService(mockPrisma, mockProvider, mockMetrics);
  });

  describe('generateDocument', () => {
    it('should generate and persist a document', async () => {
      const mockDocument = {
        id: 'doc-123',
        title: 'Test Document',
        content: '# Test',
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.document.create.mockResolvedValue(mockDocument);
      mockPrisma.documentVersion.create.mockResolvedValue({});

      const result = await service.generateDocument({
        title: 'Test Document',
        template: mockTemplate,
        parameters: { param1: 'value1' },
      });

      expect(result).toEqual(mockDocument);
      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test Document',
            content: expect.stringContaining('Generated content'),
            status: 'DRAFT',
          }),
        })
      );

      expect(mockPrisma.documentVersion.create).toHaveBeenCalled();
      expect(mockMetrics.recordGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          tokenCount: 100,
          cost: 0.01,
        })
      );
    });

    it('should handle generation errors', async () => {
      mockProvider.generateDocument = vi.fn().mockRejectedValue(new Error('LLM error'));

      await expect(
        service.generateDocument({
          title: 'Test',
          template: mockTemplate,
          parameters: {},
        })
      ).rejects.toThrow('LLM error');

      expect(mockMetrics.recordError).toHaveBeenCalled();
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const mockDocument = {
        id: 'doc-123',
        title: 'Test',
        metadata: {},
        versions: [],
      };

      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);

      const result = await service.getDocument('doc-123');

      expect(result).toEqual(mockDocument);
      expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        include: expect.any(Object),
      });
    });

    it('should return null for non-existent document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      const result = await service.getDocument('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listDocuments', () => {
    it('should list documents with pagination', async () => {
      const mockDocuments = [{ id: '1' }, { id: '2' }];

      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
      mockPrisma.document.count.mockResolvedValue(10);

      const result = await service.listDocuments({ skip: 0, take: 20 });

      expect(result).toEqual({
        documents: mockDocuments,
        total: 10,
      });

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should filter by status', async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      await service.listDocuments({ status: 'APPROVED' });

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
          }),
        })
      );
    });
  });

  describe('updateDocument', () => {
    it('should update document and create new version', async () => {
      const updatedDoc = { id: 'doc-1', title: 'Updated Title' };

      mockPrisma.document.update.mockResolvedValue(updatedDoc);
      mockPrisma.documentVersion.findFirst.mockResolvedValue({ version: 1 });
      mockPrisma.documentVersion.create.mockResolvedValue({});

      const result = await service.updateDocument('doc-1', {
        title: 'Updated Title',
        content: 'New content',
      });

      expect(result).toEqual(updatedDoc);
      expect(mockPrisma.documentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
            content: 'New content',
          }),
        })
      );
    });
  });

  describe('getDocumentHistory', () => {
    it('should retrieve document version history', async () => {
      const mockVersions = [
        { version: 2, changelog: 'Update 2' },
        { version: 1, changelog: 'Initial' },
      ];

      mockPrisma.documentVersion.findMany.mockResolvedValue(mockVersions);

      const result = await service.getDocumentHistory('doc-1');

      expect(result).toEqual(mockVersions);
      expect(mockPrisma.documentVersion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentId: 'doc-1' },
          orderBy: { version: 'desc' },
        })
      );
    });
  });
});
