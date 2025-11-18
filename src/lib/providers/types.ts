import { DocumentTemplate } from '../../templates/types';

/**
 * LLM Provider interface
 */
export interface ILLMProvider {
  readonly name: string;
  readonly supportedModels: string[];

  generateDocument(
    template: DocumentTemplate,
    parameters: Record<string, string | number>,
    options?: GenerationOptions
  ): Promise<GenerationResult>;

  validateConfig(): Promise<boolean>;
  estimateCost(tokenCount: number, model: string): number;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * Generation result
 */
export interface GenerationResult {
  content: string;
  provider: string;
  model: string;
  tokenCount: number;
  cost: number;
  durationMs: number;
  metadata?: Record<string, any>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  [key: string]: any;
}
