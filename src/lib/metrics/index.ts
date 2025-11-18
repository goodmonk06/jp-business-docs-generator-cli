import { PrismaClient } from '@prisma/client';
import logger from '../logger';

/**
 * Metrics collector for tracking generation performance and costs
 */
export class MetricsCollector {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Record a document generation metric
   */
  async recordGeneration(data: {
    templateId?: string;
    documentId?: string;
    provider: string;
    model: string;
    tokenCount: number;
    cost: number;
    durationMs: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.prisma.generationMetric.create({
        data: {
          metricType: 'generation',
          ...data,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to record generation metric', { error });
    }
  }

  /**
   * Record an error metric
   */
  async recordError(data: {
    templateId?: string;
    errorMessage: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.generationMetric.create({
        data: {
          metricType: 'error',
          ...data,
          success: false,
          timestamp: new Date(),
          metadata: data.metadata,
        },
      });
    } catch (error) {
      logger.error('Failed to record error metric', { error });
    }
  }

  /**
   * Get generation statistics
   */
  async getStats(period: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalGenerations: number;
    successRate: number;
    averageDuration: number;
    totalCost: number;
    totalTokens: number;
  }> {
    const since = this.getPeriodStart(period);

    const metrics = await this.prisma.generationMetric.findMany({
      where: {
        metricType: 'generation',
        timestamp: { gte: since },
      },
    });

    const totalGenerations = metrics.length;
    const successCount = metrics.filter(m => m.success).length;
    const successRate = totalGenerations > 0 ? successCount / totalGenerations : 0;
    const averageDuration = totalGenerations > 0
      ? metrics.reduce((sum, m) => sum + (m.durationMs || 0), 0) / totalGenerations
      : 0;
    const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalTokens = metrics.reduce((sum, m) => sum + (m.tokenCount || 0), 0);

    return {
      totalGenerations,
      successRate,
      averageDuration,
      totalCost,
      totalTokens,
    };
  }

  private getPeriodStart(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.setHours(0, 0, 0, 0));
    }
  }
}

/**
 * In-memory metrics for development/testing
 */
export class InMemoryMetricsCollector {
  private metrics: any[] = [];

  async recordGeneration(data: any): Promise<void> {
    this.metrics.push({ type: 'generation', ...data, timestamp: new Date() });
    logger.info('Generation metric recorded', data);
  }

  async recordError(data: any): Promise<void> {
    this.metrics.push({ type: 'error', ...data, timestamp: new Date() });
    logger.error('Error metric recorded', data);
  }

  async getStats(): Promise<any> {
    const generations = this.metrics.filter(m => m.type === 'generation');
    return {
      totalGenerations: generations.length,
      successRate: generations.filter(g => g.success).length / (generations.length || 1),
      averageDuration: generations.reduce((sum, g) => sum + (g.durationMs || 0), 0) / (generations.length || 1),
      totalCost: generations.reduce((sum, g) => sum + (g.cost || 0), 0),
      totalTokens: generations.reduce((sum, g) => sum + (g.tokenCount || 0), 0),
    };
  }

  getAll(): any[] {
    return this.metrics;
  }

  clear(): void {
    this.metrics = [];
  }
}
