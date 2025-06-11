#!/usr/bin/env node

import { Command } from 'commander';
import { handleCmdCommand } from './commands/cmd.js';
import { handleDocsListCommand } from './commands/docs.js';
import { handleInitCommand } from './commands/init.js';

const program = new Command();

program.name('vcmd').description('Vibe Cmd - ドキュメント駆動開発支援ツール').version('0.0.11');

program
  .command('init')
  .description('現在のディレクトリにvibe-cmdの設定ファイルを初期化')
  .action(handleInitCommand);

const docsCommand = program.command('docs').description('ドキュメント管理');

docsCommand
  .command('list')
  .description('設定ファイルのコマンドとそのdocsファイルの一覧を表示')
  .option('-c, --command <command>', '特定のコマンドのファイル一覧のみ表示')
  .action(handleDocsListCommand);

program.command('cmd').description('コマンドを選択して実行').action(handleCmdCommand);

// Utility functions temporarily disabled
// function getStatusIcon(status: Task['status']): string { ... }
// function getPriorityColor(priority: Task['priority']) { ... }

program.parse();
