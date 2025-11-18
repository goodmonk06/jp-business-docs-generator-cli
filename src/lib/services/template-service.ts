import { PrismaClient, Template } from '@prisma/client';
import { DocumentTemplateSchema } from '../../templates/types';
import logger from '../logger';
import { nanoid } from 'nanoid';

export interface CreateTemplateOptions {
  name: string;
  slug: string;
  purpose: string;
  audience: string;
  requiredSections: string[];
  tone: string;
  parameters: any[];
  additionalInstructions?: string;
  categoryId?: string;
  tags?: string[];
  isPublic?: boolean;
}

export class TemplateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new template
   */
  async createTemplate(options: CreateTemplateOptions): Promise<Template> {
    // Validate template structure
    const templateData = {
      name: options.name,
      purpose: options.purpose,
      audience: options.audience,
      required_sections: options.requiredSections,
      tone: options.tone,
      parameters: options.parameters,
      additional_instructions: options.additionalInstructions,
    };

    DocumentTemplateSchema.parse(templateData);

    logger.info('Creating template', { name: options.name });

    const template = await this.prisma.template.create({
      data: {
        id: nanoid(),
        name: options.name,
        slug: options.slug,
        version: '1.0.0',
        purpose: options.purpose,
        audience: options.audience,
        requiredSections: options.requiredSections,
        tone: options.tone,
        parameters: options.parameters,
        additionalInstructions: options.additionalInstructions,
        categoryId: options.categoryId,
        tags: options.tags || [],
        isPublic: options.isPublic ?? false,
        isActive: true,
      },
    });

    // Create initial version
    await this.prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: '1.0.0',
        content: templateData,
        changelog: 'Initial version',
      },
    });

    logger.info('Template created', { templateId: template.id });
    return template;
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<Template | null> {
    return this.prisma.template.findUnique({
      where: { id },
      include: {
        category: true,
        documents: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get template by slug
   */
  async getTemplateBySlug(slug: string): Promise<Template | null> {
    return this.prisma.template.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });
  }

  /**
   * List templates
   */
  async listTemplates(options: {
    categoryId?: string;
    isPublic?: boolean;
    isActive?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  } = {}): Promise<{ templates: Template[]; total: number }> {
    const where: any = {};

    if (options.categoryId) where.categoryId = options.categoryId;
    if (options.isPublic !== undefined) where.isPublic = options.isPublic;
    if (options.isActive !== undefined) where.isActive = options.isActive;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { purpose: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip: options.skip || 0,
        take: options.take || 20,
        include: {
          category: true,
          _count: {
            select: { documents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.template.count({ where }),
    ]);

    return { templates, total };
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    updates: Partial<CreateTemplateOptions>
  ): Promise<Template> {
    const currentTemplate = await this.prisma.template.findUnique({ where: { id } });

    if (!currentTemplate) {
      throw new Error('Template not found');
    }

    const template = await this.prisma.template.update({
      where: { id },
      data: {
        name: updates.name,
        purpose: updates.purpose,
        audience: updates.audience,
        requiredSections: updates.requiredSections,
        tone: updates.tone,
        parameters: updates.parameters,
        additionalInstructions: updates.additionalInstructions,
        categoryId: updates.categoryId,
        tags: updates.tags,
        isPublic: updates.isPublic,
      },
    });

    // Create new version
    const latestVersion = await this.prisma.templateVersion.findFirst({
      where: { templateId: id },
      orderBy: { version: 'desc' },
    });

    const versionNumber = latestVersion
      ? this.incrementVersion(latestVersion.version)
      : '1.0.1';

    await this.prisma.templateVersion.create({
      data: {
        templateId: id,
        version: versionNumber,
        content: {
          name: template.name,
          purpose: template.purpose,
          audience: template.audience,
          required_sections: template.requiredSections,
          tone: template.tone,
          parameters: template.parameters,
        },
        changelog: 'Template updated',
      },
    });

    return template;
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.prisma.template.delete({ where: { id } });
  }

  /**
   * Get template categories
   */
  async listCategories() {
    return this.prisma.templateCategory.findMany({
      include: {
        _count: {
          select: { templates: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }
}
