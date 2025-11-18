import { describe, it, expect, beforeEach } from 'vitest';
import { LLMClient } from '../client';
import { DocumentTemplate } from '../../templates/types';

describe('LLMClient', () => {
  const mockTemplate: DocumentTemplate = {
    name: 'テストテンプレート',
    purpose: 'テスト用の文書を作成する',
    audience: 'テスト読者',
    required_sections: ['セクション1', 'セクション2', 'セクション3'],
    tone: '丁寧かつフォーマルな口調',
    parameters: [
      {
        name: 'company',
        description: '会社名',
        required: true,
      },
      {
        name: 'amount',
        description: '金額',
        required: true,
      },
    ],
    additional_instructions: 'テスト用の追加指示',
  };

  describe('constructor', () => {
    it('should throw error when API key is not provided', () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => new LLMClient()).toThrow('OPENAI_API_KEY環境変数が設定されていません');

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should create instance when API key is provided', () => {
      expect(() => new LLMClient('test-api-key')).not.toThrow();
    });

    it('should use environment variable when no API key is provided', () => {
      process.env.OPENAI_API_KEY = 'env-api-key';
      expect(() => new LLMClient()).not.toThrow();
    });
  });

  describe('buildPrompt', () => {
    it('should build a proper prompt structure', () => {
      const client = new LLMClient('test-api-key');
      const parameters = {
        company: 'テスト株式会社',
        amount: 10000000,
      };

      // Access private method through type assertion for testing
      const prompt = (client as any).buildPrompt(mockTemplate, parameters);

      expect(prompt).toContain('# 文書生成指示');
      expect(prompt).toContain('## 文書の目的');
      expect(prompt).toContain(mockTemplate.purpose);
      expect(prompt).toContain('## 想定読者');
      expect(prompt).toContain(mockTemplate.audience);
      expect(prompt).toContain('## 必須セクション');
      mockTemplate.required_sections.forEach(section => {
        expect(prompt).toContain(`- ${section}`);
      });
      expect(prompt).toContain('## 口調・スタイル');
      expect(prompt).toContain(mockTemplate.tone);
      expect(prompt).toContain('## 入力情報');
      expect(prompt).toContain('会社名: テスト株式会社');
      expect(prompt).toContain('金額: 10000000');
      expect(prompt).toContain('## 追加の指示');
      expect(prompt).toContain(mockTemplate.additional_instructions);
      expect(prompt).toContain('## 出力形式');
      expect(prompt).toContain('Markdown形式');
    });

    it('should handle template without additional instructions', () => {
      const client = new LLMClient('test-api-key');
      const templateWithoutInstructions = { ...mockTemplate };
      delete templateWithoutInstructions.additional_instructions;

      const prompt = (client as any).buildPrompt(templateWithoutInstructions, {
        company: 'テスト株式会社',
      });

      expect(prompt).not.toContain('## 追加の指示');
      expect(prompt).toContain('## 出力形式');
    });
  });
});
