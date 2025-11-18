import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateLoader } from '../loader';
import * as path from 'path';

describe('TemplateLoader', () => {
  let loader: TemplateLoader;
  const templatesDir = path.join(__dirname, '../../../templates');

  beforeEach(() => {
    loader = new TemplateLoader(templatesDir);
  });

  describe('listTemplates', () => {
    it('should list available templates', () => {
      const templates = loader.listTemplates();

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toContain('loan-proposal');
      expect(templates).toContain('gov-grant-plan');
      expect(templates).toContain('business-proposal');
    });
  });

  describe('loadTemplate', () => {
    it('should load a valid template', async () => {
      const template = await loader.loadTemplate('loan-proposal');

      expect(template).toBeDefined();
      expect(template.name).toBe('銀行融資提案書');
      expect(template.purpose).toBeTruthy();
      expect(template.audience).toBeTruthy();
      expect(template.required_sections).toBeInstanceOf(Array);
      expect(template.required_sections.length).toBeGreaterThan(0);
      expect(template.tone).toBeTruthy();
      expect(template.parameters).toBeInstanceOf(Array);
      expect(template.parameters.length).toBeGreaterThan(0);
    });

    it('should validate template structure', async () => {
      const template = await loader.loadTemplate('loan-proposal');

      // Check parameter structure
      const requiredParams = template.parameters.filter(p => p.required);
      expect(requiredParams.length).toBeGreaterThan(0);

      requiredParams.forEach(param => {
        expect(param.name).toBeTruthy();
        expect(param.description).toBeTruthy();
        expect(typeof param.required).toBe('boolean');
      });
    });

    it('should throw error for non-existent template', async () => {
      await expect(loader.loadTemplate('non-existent-template')).rejects.toThrow(
        'テンプレートが見つかりません'
      );
    });
  });
});
