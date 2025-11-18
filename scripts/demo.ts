#!/usr/bin/env ts-node

import chalk from 'chalk';
import { TemplateLoader } from '../src/templates/loader';
import { LLMClient } from '../src/llm/client';
import * as fs from 'fs';
import * as path from 'path';

async function runDemo() {
  console.log(chalk.blue.bold('\n=== jp-business-docs-generator-cli デモ ===\n'));

  // 1. テンプレート一覧の表示
  console.log(chalk.yellow('📋 利用可能なテンプレート一覧:\n'));
  const loader = new TemplateLoader();
  const templates = loader.listTemplates();
  templates.forEach(template => {
    console.log(chalk.green(`  ✓ ${template}`));
  });

  // 2. テンプレート詳細の表示
  console.log(chalk.yellow('\n📄 loan-proposal テンプレートの詳細:\n'));
  const loanTemplate = await loader.loadTemplate('loan-proposal');
  console.log(chalk.white(`  名前: ${loanTemplate.name}`));
  console.log(chalk.white(`  目的: ${loanTemplate.purpose}`));
  console.log(chalk.white(`  想定読者: ${loanTemplate.audience}`));
  console.log(chalk.white(`  必須パラメータ: ${loanTemplate.parameters.filter(p => p.required).length}個`));

  // 3. サンプルパラメータの表示
  console.log(chalk.yellow('\n⚙️  サンプルパラメータ:\n'));
  const sampleParams = {
    company: '合同会社価作',
    amount: 8000000,
    purpose: '新規事業立ち上げ資金',
    business_type: 'ソフトウェア開発',
    revenue: 50000000,
    employees: 5,
    years: 3,
  };

  Object.entries(sampleParams).forEach(([key, value]) => {
    console.log(chalk.white(`  ${key}: ${value}`));
  });

  // 4. 文書生成のシミュレーション（実際のAPIは呼ばない）
  console.log(chalk.yellow('\n🚀 文書生成プロセス:\n'));
  console.log(chalk.gray('  [1/3] テンプレート読み込み... ✓'));
  console.log(chalk.gray('  [2/3] パラメータバリデーション... ✓'));
  console.log(chalk.gray('  [3/3] プロンプト構築... ✓'));

  // 実際のAPIキーがある場合のみ生成を実行
  if (process.env.OPENAI_API_KEY) {
    console.log(chalk.yellow('\n🤖 OpenAI APIで文書を生成中...\n'));
    try {
      const client = new LLMClient();
      const document = await client.generateDocument(loanTemplate, sampleParams);

      const outputDir = path.join(__dirname, '../examples');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, 'loan-proposal-sample.md');
      fs.writeFileSync(outputPath, document, 'utf-8');

      console.log(chalk.green(`✓ 文書を生成しました: ${outputPath}\n`));
      console.log(chalk.gray('--- 生成された文書のプレビュー ---'));
      console.log(chalk.white(document.substring(0, 500) + '...'));
      console.log(chalk.gray('--- プレビュー終了 ---\n'));
    } catch (error) {
      console.error(chalk.red(`\n❌ エラー: ${error}\n`));
    }
  } else {
    console.log(chalk.yellow('\n⚠️  OPENAI_API_KEY が設定されていないため、実際の文書生成はスキップされました。'));
    console.log(chalk.gray('   API キーを設定すると、実際の文書生成を試すことができます。\n'));
  }

  console.log(chalk.blue.bold('=== デモ終了 ===\n'));
}

runDemo().catch(error => {
  console.error(chalk.red(`\nエラー: ${error}\n`));
  process.exit(1);
});
