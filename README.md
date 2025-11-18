# jp-business-docs-generator-cli

企画書・事業計画・銀行提出資料など日本語ビジネス文書をテンプレートから生成するCLIツール。

OpenAI APIを利用し、YAMLで定義されたテンプレートに基づいて高品質な日本語ビジネス文書を自動生成します。

## Overview

jp-business-docs-generator-cliは、ビジネス文書作成のプロセスを自動化・効率化するためのコマンドラインツールです。

**主な用途:**
- 銀行融資提案書の作成
- 補助金・助成金申請書の作成
- 新規事業提案書の作成
- その他、カスタムビジネス文書の生成

**特徴:**
- 📝 複数のビジネス文書テンプレート（融資提案書、補助金申請書、事業提案書など）
- 🤖 OpenAI GPT-4o-miniによる高品質な文書生成
- ⚙️ YAMLベースのカスタマイズ可能なテンプレートシステム
- 💻 シンプルで使いやすいCLIインターフェース
- 🎨 Markdown形式での出力
- ✅ zodによる堅牢なバリデーション
- 🧪 包括的なテストスイート（Vitest）
- 🐳 Docker対応

## Tech Stack

### Core
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.3+
- **CLI Framework:** Commander.js 11.x
- **LLM:** OpenAI API (GPT-4o-mini)

### Libraries
- **Validation:** zod 3.x
- **YAML Parser:** yaml 2.x
- **Console Styling:** chalk 4.x
- **Environment:** dotenv 16.x

### Development
- **Test Framework:** Vitest 1.x
- **Linter:** ESLint 8.x
- **Formatter:** Prettier 3.x
- **Type Checking:** TypeScript Compiler

## Domain Model Summary

このCLIツールは、以下の主要エンティティで構成されています：

```
DocumentTemplate (テンプレート)
├─ name: string              # テンプレート名
├─ purpose: string           # 文書の目的
├─ audience: string          # 想定読者
├─ required_sections: []     # 必須セクション
├─ tone: string              # 口調・スタイル
├─ parameters: []            # パラメータ定義
└─ additional_instructions   # 追加の指示

ParameterDefinition (パラメータ定義)
├─ name: string              # パラメータ名
├─ description: string       # 説明
├─ required: boolean         # 必須フラグ
└─ default?: string|number   # デフォルト値

GenerationRequest (生成リクエスト)
├─ templateName: string      # 使用するテンプレート
└─ parameters: Record        # パラメータ値
```

### 処理フロー

```
1. Template Load → 2. Validation → 3. Prompt Build → 4. LLM Generation → 5. Output
```

## Getting Started

### Requirements

- **Node.js:** 20.x 以上
- **npm:** 10.x 以上
- **OpenAI API Key:** GPT-4o-mini へのアクセス権

### Setup Steps

#### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/jp-business-docs-generator-cli.git
cd jp-business-docs-generator-cli
```

#### 2. 依存関係のインストール

```bash
npm install
```

#### 3. 環境変数の設定

```bash
# .env.example をコピー
cp .env.example .env

# .envファイルを編集してAPIキーを設定
# OPENAI_API_KEY=your_openai_api_key_here
```

> OpenAI APIキーは [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) から取得できます。

#### 4. ビルド

```bash
npm run build
```

#### 5. 動作確認

```bash
# テンプレート一覧表示
npm run dev list

# デモを実行
npm run demo
```

### Docker を使用する場合

```bash
# イメージをビルド
docker build -t bizdoc-cli .

# テンプレート一覧を表示
docker run --rm bizdoc-cli list

# 環境変数でAPIキーを渡して文書を生成
docker run --rm \
  -e OPENAI_API_KEY=your_key \
  -v $(pwd)/output:/app/output \
  bizdoc-cli generate loan-proposal \
    --company "サンプル株式会社" \
    --amount 10000000 \
    --purpose "運転資金" \
    --business_type "IT" \
    --output /app/output/proposal.md
```

## Example Flow

### 垂直スライス: 融資提案書の生成

完全なエンドツーエンドフローの例を示します。

#### ステップ 1: テンプレートの確認

```bash
$ npm run dev info loan-proposal

📄 テンプレート: 銀行融資提案書

目的: 銀行や金融機関に対して、事業資金の融資を依頼するための提案書を作成する
想定読者: 銀行の融資担当者、審査部門
口調: 丁寧かつフォーマルな口調。数値データを明確に示し、信頼性を重視する。

必須セクション:
  • 企業概要
  • 融資の目的
  • 資金使途
  • 返済計画
  ...

パラメータ:
  --company *必須
    会社名
  --amount *必須
    融資希望額（円）
  ...
```

#### ステップ 2: パラメータを指定して生成

```bash
$ npm run dev generate loan-proposal \
  --company "合同会社価作" \
  --amount 8000000 \
  --purpose "新規事業立ち上げ資金" \
  --business_type "ソフトウェア開発" \
  --revenue 50000000 \
  --employees 5 \
  --years 3

📄 テンプレート "loan-proposal" を読み込み中...
✓ テンプレート読み込み完了

🤖 文書を生成中...
✓ 文書生成完了

✓ 文書を保存しました: /home/user/jp-business-docs-generator-cli/output/loan-proposal_1700123456789.md
```

#### ステップ 3: 生成された文書の確認

```bash
$ cat output/loan-proposal_*.md

# 銀行融資提案書

**提出日:** 2024年11月18日
**申請企業:** 合同会社価作

## 企業概要
...
```

完全なサンプル出力は [`examples/loan-proposal-sample.md`](examples/loan-proposal-sample.md) をご覧ください。

## Available Scripts

```bash
# 開発
npm run dev [command]        # TypeScriptを直接実行
npm run demo                 # デモスクリプトを実行

# ビルド
npm run build                # TypeScriptをコンパイル
npm start [command]          # ビルド済みコードを実行
npm run clean                # ビルド成果物を削除

# テスト
npm test                     # テストを実行
npm run test:watch           # ウォッチモードでテスト
npm run test:coverage        # カバレッジレポート生成

# コード品質
npm run lint                 # ESLintでコードチェック
npm run lint:fix             # ESLintで自動修正
npm run format               # Prettierでフォーマット
npm run format:check         # フォーマットチェック
npm run typecheck            # 型チェック（ビルドなし）
```

## Commands

### list

利用可能なテンプレート一覧を表示

```bash
npm run dev list
```

### info <template>

指定したテンプレートの詳細情報を表示

```bash
npm run dev info loan-proposal
```

### generate <template> [options]

テンプレートから文書を生成

```bash
npm run dev generate <template-name> \
  --param1 value1 \
  --param2 value2 \
  [--output <path>] \
  [--model <model-name>]
```

**共通オプション:**
- `-o, --output <path>`: 出力ファイルパス（デフォルト: `output/<template>_<timestamp>.md`）
- `-m, --model <model>`: OpenAIモデル（デフォルト: `gpt-4o-mini`）

## Available Templates

### 1. loan-proposal（銀行融資提案書）

銀行や金融機関への融資申請に使用する提案書。

**必須パラメータ:**
- `--company`: 会社名
- `--amount`: 融資希望額（円）
- `--purpose`: 融資の目的
- `--business_type`: 事業内容

**任意パラメータ:**
- `--revenue`: 年間売上高（円）
- `--employees`: 従業員数
- `--years`: 創業年数

### 2. gov-grant-plan（補助金申請事業計画書）

政府・自治体の補助金や助成金申請用の事業計画書。

**必須パラメータ:**
- `--company`: 事業者名
- `--project_name`: 事業名
- `--grant_type`: 補助金の種類
- `--budget`: 総事業費（円）
- `--grant_amount`: 補助金申請額（円）
- `--period`: 事業実施期間

### 3. business-proposal（事業提案書）

新規事業やプロジェクトの社内外への提案資料。

**必須パラメータ:**
- `--company`: 提案企業名
- `--project_name`: 事業名・プロジェクト名
- `--target_market`: ターゲット市場

## Custom Templates

`templates/` ディレクトリにYAMLファイルを追加することで、独自のテンプレートを作成できます。

### テンプレートの構造

```yaml
name: テンプレート名
purpose: 文書の目的
audience: 想定読者
required_sections:
  - セクション1
  - セクション2
tone: 口調・スタイル
parameters:
  - name: param1
    description: パラメータの説明
    required: true
  - name: param2
    description: パラメータの説明
    required: false
    default: デフォルト値
additional_instructions: |
  追加の指示
```

## Testing

```bash
# 全テストを実行
npm test

# ウォッチモードで実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

**テストの構成:**
- `src/templates/__tests__/`: テンプレートローダーとスキーマのテスト
- `src/llm/__tests__/`: LLMクライアントのテスト

## Directory Structure

```
.
├── src/
│   ├── cli.ts                          # CLIエントリーポイント
│   ├── templates/
│   │   ├── types.ts                    # テンプレート型定義とzodスキーマ
│   │   ├── loader.ts                   # テンプレートローダー
│   │   └── __tests__/                  # テンプレート関連のテスト
│   └── llm/
│       ├── client.ts                   # OpenAI LLMクライアント
│       └── __tests__/                  # LLM関連のテスト
├── templates/
│   ├── loan-proposal.yml               # 融資提案書テンプレート
│   ├── gov-grant-plan.yml              # 補助金申請書テンプレート
│   └── business-proposal.yml           # 事業提案書テンプレート
├── examples/
│   ├── loan-proposal-sample.md         # サンプル出力
│   └── README.md                       # サンプルの説明
├── scripts/
│   └── demo.ts                         # デモスクリプト
├── output/                             # 生成された文書の出力先
├── dist/                               # ビルド成果物
├── Dockerfile                          # Docker設定
├── docker-compose.yml                  # Docker Compose設定
├── vitest.config.ts                    # テスト設定
├── .eslintrc.json                      # ESLint設定
├── .prettierrc                         # Prettier設定
├── package.json
└── tsconfig.json
```

## Troubleshooting

### APIキーエラー

```
❌ エラー: OPENAI_API_KEY環境変数が設定されていません
```

→ 環境変数 `OPENAI_API_KEY` が設定されているか確認してください。

### テンプレートが見つからない

```
❌ エラー: テンプレートが見つかりません: xxx
```

→ `npm run dev list` で利用可能なテンプレート一覧を確認してください。

### 必須パラメータ不足

```
❌ 必須パラメータが不足しています
```

→ `npm run dev info <template-name>` でテンプレートの詳細と必須パラメータを確認してください。

### バリデーションエラー

```
❌ テンプレートのバリデーションエラー
```

→ YAMLテンプレートの構造を確認してください。すべての必須フィールドが正しく定義されているか確認してください。

## Future Extensions

このプロジェクトは今後、以下の機能拡張を予定しています：

### 短期的な拡張
- [ ] **追加テンプレート**: 契約書、議事録、報告書など
- [ ] **多言語対応**: 英語・中国語などのビジネス文書生成
- [ ] **PDFエクスポート**: Markdown → PDF変換機能
- [ ] **インタラクティブモード**: 対話形式でのパラメータ入力
- [ ] **テンプレートバリデータ**: カスタムテンプレートの検証ツール

### 中期的な拡張
- [ ] **Webインターフェース**: ブラウザベースのGUI
- [ ] **テンプレートマーケットプレイス**: コミュニティテンプレートの共有
- [ ] **バージョン管理**: 生成された文書の履歴管理
- [ ] **複数LLM対応**: Claude、Geminiなど他のLLMへの対応
- [ ] **プラグインシステム**: カスタム機能の追加を容易にする仕組み

### 長期的な拡張
- [ ] **AIアシスタント**: 文書作成のガイダンス機能
- [ ] **データ分析**: 生成された文書の品質分析
- [ ] **エンタープライズ機能**: チーム管理、権限管理、監査ログ
- [ ] **統合**: Google Docs、Microsoft Word、Notion等との連携

## Contributing

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

### 開発ワークフロー

1. フォークしてブランチを作成
2. 変更を実装
3. テストを追加/更新
4. `npm run lint:fix` と `npm run format` を実行
5. `npm test` が全て通ることを確認
6. プルリクエストを作成

## License

MIT

---

**Made with ❤️ for Japanese business professionals**
