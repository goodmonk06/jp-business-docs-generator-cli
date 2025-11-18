import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { DocumentTemplate } from './types';

/**
 * テンプレートローダー
 */
export class TemplateLoader {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../../templates');
  }

  /**
   * テンプレートを読み込む
   */
  async loadTemplate(templateName: string): Promise<DocumentTemplate> {
    const templatePath = path.join(this.templatesDir, `${templateName}.yml`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`テンプレートが見つかりません: ${templateName}`);
    }

    const content = fs.readFileSync(templatePath, 'utf-8');
    const template = yaml.parse(content) as DocumentTemplate;

    // バリデーション
    this.validateTemplate(template);

    return template;
  }

  /**
   * 利用可能なテンプレート一覧を取得
   */
  listTemplates(): string[] {
    if (!fs.existsSync(this.templatesDir)) {
      return [];
    }

    const files = fs.readdirSync(this.templatesDir);
    return files
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map(file => file.replace(/\.(yml|yaml)$/, ''));
  }

  /**
   * テンプレートのバリデーション
   */
  private validateTemplate(template: DocumentTemplate): void {
    if (!template.name) {
      throw new Error('テンプレート名が必要です');
    }
    if (!template.purpose) {
      throw new Error('目的が必要です');
    }
    if (!template.audience) {
      throw new Error('想定読者が必要です');
    }
    if (!Array.isArray(template.required_sections) || template.required_sections.length === 0) {
      throw new Error('必須セクションが必要です');
    }
    if (!template.tone) {
      throw new Error('口調が必要です');
    }
    if (!Array.isArray(template.parameters)) {
      throw new Error('パラメータ定義が必要です');
    }
  }
}
