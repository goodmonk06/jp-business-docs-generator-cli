#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { TemplateLoader } from './templates/loader';
import { LLMClient } from './llm/client';

const program = new Command();

program
  .name('bizdoc')
  .description('日本語ビジネス文書生成CLI')
  .version('1.0.0');

/**
 * generate コマンド
 */
program
  .command('generate <template>')
  .description('指定されたテンプレートからビジネス文書を生成')
  .option('-o, --output <path>', '出力ファイルパス')
  .option('-m, --model <model>', 'OpenAI モデル名', 'gpt-4o-mini')
  .allowUnknownOption(true)
  .action(async (templateName: string, options: any, command: Command) => {
    try {
      console.log(chalk.blue(`📄 テンプレート "${templateName}" を読み込み中...`));

      // テンプレートローダー
      const loader = new TemplateLoader();
      const template = await loader.loadTemplate(templateName);

      console.log(chalk.green(`✓ テンプレート読み込み完了`));

      // パラメータを抽出（--で始まるオプション以外）
      const parameters: Record<string, string | number> = {};
      const args = process.argv.slice(3); // 'generate' と '<template>' の後の引数

      for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--') && !['--output', '--model'].includes(args[i])) {
          const key = args[i].replace('--', '');
          const value = args[i + 1];

          if (value && !value.startsWith('--')) {
            // 数値に変換できる場合は数値として扱う
            parameters[key] = isNaN(Number(value)) ? value : Number(value);
            i++; // 次の引数をスキップ
          }
        }
      }

      // 必須パラメータのチェック
      const requiredParams = template.parameters.filter(p => p.required);
      const missingParams = requiredParams.filter(p => !(p.name in parameters));

      if (missingParams.length > 0) {
        console.error(chalk.red('\n❌ 必須パラメータが不足しています:'));
        missingParams.forEach(p => {
          console.error(chalk.red(`  --${p.name}: ${p.description}`));
        });
        process.exit(1);
      }

      console.log(chalk.blue('\n🤖 文書を生成中...'));

      // LLMクライアントで文書生成
      const llmClient = new LLMClient(undefined, options.model);
      const document = await llmClient.generateDocument(template, parameters);

      console.log(chalk.green('✓ 文書生成完了\n'));

      // 出力パスを決定
      const outputPath = options.output || path.join(
        process.cwd(),
        'output',
        `${templateName}_${Date.now()}.md`
      );

      // 出力ディレクトリを作成
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // ファイルに書き込み
      fs.writeFileSync(outputPath, document, 'utf-8');

      console.log(chalk.green(`✓ 文書を保存しました: ${outputPath}\n`));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ エラー: ${error.message}\n`));
      } else {
        console.error(chalk.red('\n❌ 不明なエラーが発生しました\n'));
      }
      process.exit(1);
    }
  });

/**
 * list コマンド
 */
program
  .command('list')
  .description('利用可能なテンプレート一覧を表示')
  .action(() => {
    try {
      const loader = new TemplateLoader();
      const templates = loader.listTemplates();

      if (templates.length === 0) {
        console.log(chalk.yellow('利用可能なテンプレートがありません'));
        return;
      }

      console.log(chalk.blue('\n📋 利用可能なテンプレート:\n'));
      templates.forEach(template => {
        console.log(chalk.green(`  • ${template}`));
      });
      console.log();
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ エラー: ${error.message}\n`));
      }
      process.exit(1);
    }
  });

/**
 * info コマンド
 */
program
  .command('info <template>')
  .description('テンプレートの詳細情報を表示')
  .action(async (templateName: string) => {
    try {
      const loader = new TemplateLoader();
      const template = await loader.loadTemplate(templateName);

      console.log(chalk.blue(`\n📄 テンプレート: ${template.name}\n`));
      console.log(chalk.white(`目的: ${template.purpose}`));
      console.log(chalk.white(`想定読者: ${template.audience}`));
      console.log(chalk.white(`口調: ${template.tone}\n`));

      console.log(chalk.blue('必須セクション:'));
      template.required_sections.forEach(section => {
        console.log(chalk.white(`  • ${section}`));
      });

      console.log(chalk.blue('\nパラメータ:'));
      template.parameters.forEach(param => {
        const required = param.required ? chalk.red('*必須') : chalk.gray('任意');
        console.log(chalk.white(`  --${param.name} ${required}`));
        console.log(chalk.gray(`    ${param.description}`));
        if (param.default !== undefined) {
          console.log(chalk.gray(`    デフォルト: ${param.default}`));
        }
      });
      console.log();
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ エラー: ${error.message}\n`));
      }
      process.exit(1);
    }
  });

program.parse();
