#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

program.name('vcmd').description('Vibe Cmd - ドキュメント駆動開発支援ツール').version('0.0.6');

// __dirname を ES Modules で取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// プロジェクトのルートディレクトリを取得
const projectRoot = resolve(__dirname, '..');

function copyDirectory(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

program
  .command('init')
  .description('現在のディレクトリにvibe-cmdの設定ファイルを初期化')
  .action(async () => {
    try {
      const currentDir = process.cwd();
      const configSource = join(projectRoot, 'vibe-cmd.config.json');
      const vibeCmdDirSource = join(projectRoot, '.vibe-cmd');

      const configDest = join(currentDir, 'vibe-cmd.config.json');
      const vibeCmdDirDest = join(currentDir, '.vibe-cmd');

      // vibe-cmd.config.json をコピー
      if (existsSync(configSource)) {
        copyFileSync(configSource, configDest);
        console.log(chalk.green('✅ vibe-cmd.config.json をコピーしました'));
      } else {
        console.log(chalk.yellow('⚠️  vibe-cmd.config.json が見つかりませんでした'));
      }

      // .vibe-cmd ディレクトリをコピー
      if (existsSync(vibeCmdDirSource)) {
        copyDirectory(vibeCmdDirSource, vibeCmdDirDest);
        console.log(chalk.green('✅ .vibe-cmd ディレクトリをコピーしました'));
      } else {
        console.log(chalk.yellow('⚠️  .vibe-cmd ディレクトリが見つかりませんでした'));
      }

      console.log(chalk.blue('\n🎉 vibe-cmdの初期化が完了しました！'));
      console.log(chalk.gray('以下のファイルが作成されました:'));
      console.log(chalk.gray(`  - ${configDest}`));
      console.log(chalk.gray(`  - ${vibeCmdDirDest}/`));
    } catch (error) {
      console.error(chalk.red('❌ 初期化に失敗しました:'), error);
    }
  });

const docsCommand = program.command('docs').description('ドキュメント管理');

docsCommand
  .command('list')
  .description('設定ファイルのコマンドとそのdocsファイルの一覧を表示')
  .option('-c, --command <command>', '特定のコマンドのファイル一覧のみ表示')
  .action(async (options) => {
    try {
      const { getCommandDocs } = await import('./utils/docs.js');

      const docsResult = await getCommandDocs(options.command);

      if (options.command) {
        // 特定のコマンドのファイル一覧を表示
        if (docsResult.commands.length === 0) {
          console.log(chalk.yellow(`⚠️  コマンド "${options.command}" が見つかりませんでした`));
          return;
        }

        console.log(chalk.blue(`📋 コマンド "${options.command}" のドキュメントファイル一覧:\n`));

        for (const command of docsResult.commands) {
          console.log(chalk.bold(`📁 ${command.name}`));
          console.log(`   説明: ${command.description}`);
          console.log('   ファイル一覧:');

          for (const pattern of command.patterns) {
            if (pattern.error) {
              console.log(chalk.red(`     ❌ ${pattern.pattern} (エラー: ${pattern.error})`));
            } else if (!pattern.exists) {
              console.log(chalk.red(`     ❌ ${pattern.pattern} (マッチするファイルなし)`));
            } else {
              console.log(chalk.green(`     ✅ ${pattern.pattern}`));
              for (const file of pattern.files) {
                console.log(`       - ${file}`);
              }
            }
          }
          console.log();
        }
      } else {
        // 全コマンドの概要表示
        console.log(chalk.blue('📋 利用可能なコマンド一覧:\n'));

        for (const command of docsResult.commands) {
          console.log(`📁 ${chalk.bold(command.name)}`);
          console.log(`   説明: ${command.description}`);
          console.log(`   ドキュメント数: ${command.totalFiles}個`);
          console.log();
        }

        console.log(chalk.yellow('特定のコマンドの詳細を見るには:'));
        console.log('  vcmd docs list --command <コマンド名>');
      }
    } catch (error) {
      console.error(chalk.red('❌ ドキュメント一覧の取得に失敗しました:'), error);
    }
  });

// Utility functions temporarily disabled
// function getStatusIcon(status: Task['status']): string { ... }
// function getPriorityColor(priority: Task['priority']) { ... }

program.parse();
