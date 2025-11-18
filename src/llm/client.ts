import OpenAI from 'openai';
import { DocumentTemplate } from '../templates/types';

/**
 * LLMクライアント（OpenAI）
 */
export class LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o-mini') {
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      throw new Error('OPENAI_API_KEY環境変数が設定されていません');
    }

    this.client = new OpenAI({ apiKey: key });
    this.model = model;
  }

  /**
   * ビジネス文書を生成
   */
  async generateDocument(
    template: DocumentTemplate,
    parameters: Record<string, string | number>
  ): Promise<string> {
    const prompt = this.buildPrompt(template, parameters);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'あなたは日本のビジネス文書作成の専門家です。与えられたテンプレートと情報を基に、プロフェッショナルなビジネス文書を作成してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('文書の生成に失敗しました');
      }

      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API エラー: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(
    template: DocumentTemplate,
    parameters: Record<string, string | number>
  ): string {
    const sections = [
      '# 文書生成指示',
      '',
      '## 文書の目的',
      template.purpose,
      '',
      '## 想定読者',
      template.audience,
      '',
      '## 必須セクション',
      ...template.required_sections.map(section => `- ${section}`),
      '',
      '## 口調・スタイル',
      template.tone,
      '',
      '## 入力情報'
    ];

    // パラメータを追加
    for (const [key, value] of Object.entries(parameters)) {
      const paramDef = template.parameters.find(p => p.name === key);
      const label = paramDef?.description || key;
      sections.push(`- ${label}: ${value}`);
    }

    // 追加の指示
    if (template.additional_instructions) {
      sections.push('');
      sections.push('## 追加の指示');
      sections.push(template.additional_instructions);
    }

    sections.push('');
    sections.push('## 出力形式');
    sections.push('Markdown形式で、読みやすく整形された日本語ビジネス文書を作成してください。');

    return sections.join('\n');
  }
}
