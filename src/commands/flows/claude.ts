import { execSync } from 'node:child_process';
import inquirer from 'inquirer';

import { MESSAGES } from '../../constants/index.js';
import type { CommandDocs } from '../../types/index.js';
import {
  formatFileSuccess,
  formatPatternError,
  formatPatternSuccess,
  formatPatternWarning,
  logChart,
  logError,
} from '../../utils/console.js';

/**
 * Claude Code 用のフローを実行する
 *
 * 1. option の入力を受け取る
 * 2. 対象ファイルの一覧を表示
 * 3. Claude Code を起動し、初期プロンプトを送信する
 */
export async function handleClaudeFlow(
  selectedCommandData: CommandDocs,
  subCommandAnswers: { [key: string]: string }
): Promise<void> {
  // option入力
  const { option } = await inquirer.prompt([
    {
      type: 'input',
      name: 'option',
      message: 'オプション (追加の指示があれば入力):',
      default: '',
    },
  ]);

  logChart(`${MESSAGES.INFO.EXISTING_FILES}\n`);

  let totalFiles = 0;
  let docsList = '';

  // 対象ファイル一覧を表示
  for (const pattern of selectedCommandData.patterns) {
    if (pattern.exists && pattern.files.length > 0) {
      console.log(formatPatternSuccess(pattern.pattern));
      for (const file of pattern.files) {
        console.log(formatFileSuccess(file));
        docsList += `${file}\n`;
        totalFiles++;
      }
      console.log();
    } else if (pattern.error) {
      console.log(formatPatternError(pattern.pattern, pattern.error));
    } else {
      console.log(formatPatternWarning(pattern.pattern));
    }
  }

  logChart(`${MESSAGES.INFO.TOTAL_FILES(totalFiles)}\n`);

  // Claude Codeを起動
  try {
    // ログ用のコマンド表示は option を含む
    const commandTextForLog = option
      ? `${selectedCommandData.name} ${option}`
      : selectedCommandData.name;

    console.log(`\n実行内容: ${commandTextForLog}`);
    console.log('対象ドキュメント一覧:');
    console.log(docsList);
    console.log('\nClaude Codeを対話モードで起動しています...');

    // @ファイル参照を使用した初期クエリを作成
    let fileReferences = '';
    for (const pattern of selectedCommandData.patterns) {
      if (pattern.exists && pattern.files.length > 0) {
        for (const file of pattern.files) {
          fileReferences += `@${file} `;
        }
      }
    }

    // サブコマンドの回答を含むクエリを構築（コピー内容には option を含めない）
    let query = `${selectedCommandData.name}\n\n目的: ${selectedCommandData.description}`;

    if (Object.keys(subCommandAnswers).length > 0) {
      query += '\n\n入力内容:';
      for (const [name, answer] of Object.entries(subCommandAnswers)) {
        query += `\n- ${name}: ${answer}`;
      }
    }

    const initialQuery = `${fileReferences}${query}`;

    // クエリをクリップボードにコピー
    const { execSync: execSyncForClipboard } = await import('node:child_process');
    execSyncForClipboard(`echo "${initialQuery.replace(/"/g, '\\"')}" | pbcopy`);

    console.log('クエリがクリップボードにコピーされました。Cmd+V で貼り付けてください。');
    console.log('\n--- コピーされたクエリ ---');
    console.log(initialQuery);
    console.log('--- ここまで ---\n');

    // 対話モードで起動 (option はコマンドにのみ付与)
    const execCommand = option ? `claude ${option}` : 'claude';
    execSync(execCommand, { stdio: 'inherit' });
  } catch (error) {
    logError('Claude Code起動中にエラーが発生しました');
    console.error(error);
  }
}
