import { ILLMProvider, ProviderConfig } from './types';
import { OpenAIProvider } from './openai-provider';

export type ProviderType = 'openai' | 'anthropic' | 'local';

/**
 * Provider factory for creating LLM provider instances
 */
export class ProviderFactory {
  private static providers: Map<string, new (config: ProviderConfig) => ILLMProvider> = new Map([
    ['openai', OpenAIProvider],
    // Add more providers here as they're implemented
    // ['anthropic', AnthropicProvider],
    // ['local', LocalProvider],
  ]);

  /**
   * Create a provider instance
   */
  static create(type: ProviderType, config: ProviderConfig = {}): ILLMProvider {
    const ProviderClass = this.providers.get(type);

    if (!ProviderClass) {
      throw new Error(`Unknown provider type: ${type}. Supported: ${this.getSupportedProviders().join(', ')}`);
    }

    return new ProviderClass(config);
  }

  /**
   * Get list of supported providers
   */
  static getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Register a custom provider
   */
  static registerProvider(name: string, providerClass: new (config: ProviderConfig) => ILLMProvider): void {
    this.providers.set(name, providerClass);
  }
}
