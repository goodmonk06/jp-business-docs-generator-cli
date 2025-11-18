# サンプル出力

このディレクトリには、jp-business-docs-generator-cliで生成されたサンプルドキュメントが含まれています。

## サンプルファイル

### loan-proposal-sample.md

**テンプレート:** loan-proposal（銀行融資提案書）

**使用パラメータ:**
```bash
--company "合同会社価作"
--amount 8000000
--purpose "新規事業立ち上げ資金"
--business_type "ソフトウェア開発"
--revenue 50000000
--employees 5
--years 3
```

このサンプルは、中小規模のソフトウェア開発企業が銀行融資を申請する際の提案書の例です。

## 生成方法

同様のドキュメントを生成するには:

```bash
npm run dev generate loan-proposal \
  --company "合同会社価作" \
  --amount 8000000 \
  --purpose "新規事業立ち上げ資金" \
  --business_type "ソフトウェア開発" \
  --revenue 50000000 \
  --employees 5 \
  --years 3 \
  --output "./my-proposal.md"
```

## カスタマイズ

各テンプレートは、YAMLファイルで定義されており、以下のディレクトリにあります:

```
templates/
  ├── loan-proposal.yml
  ├── gov-grant-plan.yml
  └── business-proposal.yml
```

必要に応じて、独自のテンプレートを作成することも可能です。
