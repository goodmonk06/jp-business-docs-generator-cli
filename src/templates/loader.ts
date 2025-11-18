import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { DocumentTemplate, DocumentTemplateSchema } from './types';

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
    try {
      DocumentTemplateSchema.parse(template);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`テンプレートのバリデーションエラー: ${error.message}`);
      }
      throw error;
    }
  }
}
