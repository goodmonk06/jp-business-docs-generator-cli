import { describe, it, expect } from 'vitest';
import { DocumentTemplateSchema, ParameterDefinitionSchema } from '../types';

describe('Template Schemas', () => {
  describe('ParameterDefinitionSchema', () => {
    it('should validate a valid parameter definition', () => {
      const validParam = {
        name: 'company',
        description: '会社名',
        required: true,
      };

      expect(() => ParameterDefinitionSchema.parse(validParam)).not.toThrow();
    });

    it('should validate parameter with default value', () => {
      const paramWithDefault = {
        name: 'purpose',
        description: '融資の目的',
        required: false,
        default: '運転資金',
      };

      expect(() => ParameterDefinitionSchema.parse(paramWithDefault)).not.toThrow();
    });

    it('should reject parameter without required fields', () => {
      const invalidParam = {
        name: '',
        description: '',
        required: true,
      };

      expect(() => ParameterDefinitionSchema.parse(invalidParam)).toThrow();
    });
  });

  describe('DocumentTemplateSchema', () => {
    it('should validate a complete template', () => {
      const validTemplate = {
        name: 'テストテンプレート',
        purpose: 'テスト目的',
        audience: 'テスト読者',
        required_sections: ['セクション1', 'セクション2'],
        tone: '丁寧な口調',
        parameters: [
          {
            name: 'param1',
            description: 'パラメータ1',
            required: true,
          },
        ],
        additional_instructions: '追加の指示',
      };

      expect(() => DocumentTemplateSchema.parse(validTemplate)).not.toThrow();
    });

    it('should reject template with missing required fields', () => {
      const invalidTemplate = {
        name: '',
        purpose: 'テスト目的',
        audience: 'テスト読者',
        required_sections: [],
        tone: '丁寧な口調',
        parameters: [],
      };

      expect(() => DocumentTemplateSchema.parse(invalidTemplate)).toThrow();
    });

    it('should accept template without optional fields', () => {
      const minimalTemplate = {
        name: 'テストテンプレート',
        purpose: 'テスト目的',
        audience: 'テスト読者',
        required_sections: ['セクション1'],
        tone: '丁寧な口調',
        parameters: [
          {
            name: 'param1',
            description: 'パラメータ1',
            required: true,
          },
        ],
      };

      expect(() => DocumentTemplateSchema.parse(minimalTemplate)).not.toThrow();
    });
  });
});
