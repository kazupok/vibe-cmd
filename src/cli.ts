#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
const program = new Command();

program.name('vd').description('Vibe Docs - ドキュメント駆動開発支援ツール').version('1.0.0');


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
        console.log('  vd docs list --command <コマンド名>');
      }
    } catch (error) {
      console.error(chalk.red('❌ ドキュメント一覧の取得に失敗しました:'), error);
    }
  });

// Utility functions temporarily disabled
// function getStatusIcon(status: Task['status']): string { ... }
// function getPriorityColor(priority: Task['priority']) { ... }

program.parse();
