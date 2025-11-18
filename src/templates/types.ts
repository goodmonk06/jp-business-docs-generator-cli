/**
 * ビジネス文書テンプレートの型定義
 */
export interface DocumentTemplate {
  /** テンプレート名 */
  name: string;
  /** 文書の目的 */
  purpose: string;
  /** 想定読者 */
  audience: string;
  /** 必須セクション */
  required_sections: string[];
  /** 口調・スタイル */
  tone: string;
  /** パラメータ定義 */
  parameters: ParameterDefinition[];
  /** 追加の指示 */
  additional_instructions?: string;
}

/**
 * テンプレートパラメータの定義
 */
export interface ParameterDefinition {
  /** パラメータ名 */
  name: string;
  /** 説明 */
  description: string;
  /** 必須フラグ */
  required: boolean;
  /** デフォルト値 */
  default?: string | number;
}

/**
 * 生成リクエスト
 */
export interface GenerationRequest {
  /** テンプレート名 */
  templateName: string;
  /** パラメータ */
  parameters: Record<string, string | number>;
}
