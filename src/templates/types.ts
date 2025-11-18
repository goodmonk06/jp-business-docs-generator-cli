import { z } from 'zod';

/**
 * パラメータ定義のスキーマ
 */
export const ParameterDefinitionSchema = z.object({
  name: z.string().min(1, 'パラメータ名は必須です'),
  description: z.string().min(1, '説明は必須です'),
  required: z.boolean(),
  default: z.union([z.string(), z.number()]).optional(),
});

/**
 * ビジネス文書テンプレートのスキーマ
 */
export const DocumentTemplateSchema = z.object({
  name: z.string().min(1, 'テンプレート名は必須です'),
  purpose: z.string().min(1, '目的は必須です'),
  audience: z.string().min(1, '想定読者は必須です'),
  required_sections: z.array(z.string()).min(1, '必須セクションが必要です'),
  tone: z.string().min(1, '口調は必須です'),
  parameters: z.array(ParameterDefinitionSchema),
  additional_instructions: z.string().optional(),
});

/**
 * 生成リクエストのスキーマ
 */
export const GenerationRequestSchema = z.object({
  templateName: z.string().min(1, 'テンプレート名は必須です'),
  parameters: z.record(z.union([z.string(), z.number()])),
});

/**
 * ビジネス文書テンプレートの型定義
 */
export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;

/**
 * テンプレートパラメータの定義
 */
export type ParameterDefinition = z.infer<typeof ParameterDefinitionSchema>;

/**
 * 生成リクエスト
 */
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
