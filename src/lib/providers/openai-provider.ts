import OpenAI from 'openai';
import { DocumentTemplate } from '../../templates/types';
import {
  ILLMProvider,
  GenerationOptions,
  GenerationResult,
  ProviderConfig,
} from './types';

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai';
  readonly supportedModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ];

  private client: OpenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = config;
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
    });
  }

  async generateDocument(
    template: DocumentTemplate,
    parameters: Record<string, string | number>,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = options.model || 'gpt-4o-mini';

    const prompt = this.buildPrompt(template, parameters);

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'あなたは日本のビジネス文書作成の専門家です。与えられたテンプレートと情報を基に、プロフェッショナルなビジネス文書を作成してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated');
      }

      const tokenCount = response.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;
      const cost = this.estimateCost(tokenCount, model);

      return {
        content,
        provider: this.name,
        model,
        tokenCount,
        cost,
        durationMs,
        metadata: {
          finishReason: response.choices[0]?.finish_reason,
          systemFingerprint: response.system_fingerprint,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI generation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  estimateCost(tokenCount: number, model: string): number {
    // Pricing per 1M tokens (as of Dec 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10.0 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10.0, output: 30.0 },
      'gpt-4': { input: 30.0, output: 60.0 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
    // Assuming 50/50 input/output split
    const avgCost = (modelPricing.input + modelPricing.output) / 2;
    return (tokenCount / 1000000) * avgCost;
  }

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
      '## 入力情報',
    ];

    for (const [key, value] of Object.entries(parameters)) {
      const paramDef = template.parameters.find(p => p.name === key);
      const label = paramDef?.description || key;
      sections.push(`- ${label}: ${value}`);
    }

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
