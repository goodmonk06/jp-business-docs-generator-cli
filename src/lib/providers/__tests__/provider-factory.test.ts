import { describe, it, expect } from 'vitest';
import { ProviderFactory } from '../provider-factory';
import { ILLMProvider, ProviderConfig } from '../types';

describe('ProviderFactory', () => {
  describe('create', () => {
    it('should create an OpenAI provider', () => {
      const provider = ProviderFactory.create('openai', { apiKey: 'test-key' });

      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai');
      expect(provider.supportedModels).toContain('gpt-4o-mini');
    });

    it('should throw error for unknown provider', () => {
      expect(() => {
        ProviderFactory.create('unknown' as any, {});
      }).toThrow('Unknown provider type');
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = ProviderFactory.getSupportedProviders();

      expect(providers).toContain('openai');
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  describe('registerProvider', () => {
    it('should register a custom provider', () => {
      class CustomProvider implements ILLMProvider {
        name = 'custom';
        supportedModels = ['custom-model'];

        async generateDocument() {
          return {
            content: 'test',
            provider: 'custom',
            model: 'custom-model',
            tokenCount: 10,
            cost: 0,
            durationMs: 100,
          };
        }

        async validateConfig() {
          return true;
        }

        estimateCost() {
          return 0;
        }
      }

      ProviderFactory.registerProvider('custom', CustomProvider);

      const providers = ProviderFactory.getSupportedProviders();
      expect(providers).toContain('custom');

      const provider = ProviderFactory.create('custom' as any, {});
      expect(provider.name).toBe('custom');
    });
  });
});
