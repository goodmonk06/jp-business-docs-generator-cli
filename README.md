# jp-business-docs-generator-cli

企画書・事業計画・銀行提出資料など日本語ビジネス文書をテンプレートから生成するCLIツール。

OpenAI APIを利用し、YAMLで定義されたテンプレートに基づいて高品質な日本語ビジネス文書を自動生成します。

## 特徴

- 📝 複数のビジネス文書テンプレート（融資提案書、補助金申請書、事業提案書など）
- 🤖 OpenAI GPTによる高品質な文書生成
- ⚙️ YAMLベースのカスタマイズ可能なテンプレート
- 💻 シンプルなCLIインターフェース
- 🎨 Markdown形式での出力

## Tech Stack

- Node.js + TypeScript
- OpenAI API (GPT-4o-mini)
- Commander.js (CLI framework)
- YAML (テンプレート管理)
- Chalk (コンソール装飾)

## インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/jp-business-docs-generator-cli.git
cd jp-business-docs-generator-cli

# 依存関係のインストール
npm install

# ビルド
npm run build
```

## 環境設定

### OpenAI APIキーの設定

OpenAI APIキーが必要です。以下のいずれかの方法で設定してください：

**方法1: 環境変数として設定**

```bash
export OPENAI_API_KEY="your_api_key_here"
```

**方法2: .envファイルを作成**

```bash
cp .env.example .env
# .envファイルを編集してAPIキーを設定
```

```
OPENAI_API_KEY=your_api_key_here
```

> OpenAI APIキーは [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) から取得できます。

## 使い方

### 基本コマンド

```bash
# 利用可能なテンプレート一覧を表示
npm run dev list

# テンプレートの詳細情報を表示
npm run dev info loan-proposal

# 文書を生成
npm run dev generate <template-name> [options]
```

### 実行例

#### 1. 銀行融資提案書の生成

```bash
npm run dev generate loan-proposal \
  --company "合同会社価作" \
  --amount 8000000 \
  --purpose "新規事業立ち上げ資金" \
  --business_type "ソフトウェア開発" \
  --revenue 50000000 \
  --employees 5 \
  --years 3
```

#### 2. 補助金申請事業計画書の生成

```bash
npm run dev generate gov-grant-plan \
  --company "株式会社イノベーション" \
  --project_name "AI活用による業務効率化システム開発" \
  --grant_type "ものづくり補助金" \
  --budget 10000000 \
  --grant_amount 6000000 \
  --period "12ヶ月" \
  --industry "情報通信業"
```

#### 3. 事業提案書の生成

```bash
npm run dev generate business-proposal \
  --company "株式会社スタートアップ" \
  --project_name "次世代ECプラットフォーム構築" \
  --target_market "中小企業向けEC市場" \
  --investment 30000000 \
  --roi_period "2年"
```

#### 4. 出力先を指定

```bash
npm run dev generate loan-proposal \
  --company "合同会社価作" \
  --amount 8000000 \
  --purpose "運転資金" \
  --business_type "コンサルティング" \
  --output "./my-proposal.md"
```

### オプション

- `-o, --output <path>`: 出力ファイルパスを指定（デフォルト: `output/<template>_<timestamp>.md`）
- `-m, --model <model>`: OpenAIモデルを指定（デフォルト: `gpt-4o-mini`）

## 利用可能なテンプレート

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

**任意パラメータ:**
- `--industry`: 業種

### 3. business-proposal（事業提案書）

新規事業やプロジェクトの社内外への提案資料。

**必須パラメータ:**
- `--company`: 提案企業名
- `--project_name`: 事業名・プロジェクト名
- `--target_market`: ターゲット市場

**任意パラメータ:**
- `--investment`: 必要投資額（円）
- `--roi_period`: 投資回収期間

## カスタムテンプレートの作成

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

## ディレクトリ構成

```
.
├── src/
│   ├── cli.ts              # CLIエントリーポイント
│   ├── templates/
│   │   ├── types.ts        # テンプレート型定義
│   │   └── loader.ts       # テンプレートローダー
│   └── llm/
│       └── client.ts       # OpenAI LLMクライアント
├── templates/
│   ├── loan-proposal.yml   # 融資提案書テンプレート
│   ├── gov-grant-plan.yml  # 補助金申請書テンプレート
│   └── business-proposal.yml # 事業提案書テンプレート
├── output/                  # 生成された文書の出力先
├── package.json
└── tsconfig.json
```

## 開発

```bash
# 開発モード（TypeScriptを直接実行）
npm run dev

# ビルド
npm run build

# ビルド後に実行
npm start

# クリーン
npm run clean
```

## トラブルシューティング

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

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。
