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
 * Gemini CLI 用のフローを実行する
 */
export async function handleGeminiFlow(
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

  // Gemini CLIを起動
  try {
    let commandText = selectedCommandData.name;
    if (option) {
      commandText += ` ${option}`;
    }

    console.log(`\n実行内容: ${commandText}`);
    console.log('対象ドキュメント一覧:');
    console.log(docsList);
    console.log('\nGemini CLIを起動しています...');

    // @ファイル参照を使用した初期クエリを作成
    let fileReferences = '';
    for (const pattern of selectedCommandData.patterns) {
      if (pattern.exists && pattern.files.length > 0) {
        for (const file of pattern.files) {
          fileReferences += `@${file} `;
        }
      }
    }

    let query = `${commandText}\n\n目的: ${selectedCommandData.description}`;

    if (Object.keys(subCommandAnswers).length > 0) {
      query += '\n\n入力内容:';
      for (const [name, answer] of Object.entries(subCommandAnswers)) {
        query += `\n- ${name}: ${answer}`;
      }
    }

    if (option) {
      query += `\n\n追加オプション: ${option}`;
    }

    const initialQuery = `${fileReferences}${query}`;

    // クエリをクリップボードにコピー
    const { execSync: execSyncForClipboard } = await import('node:child_process');
    execSyncForClipboard(`echo "${initialQuery.replace(/"/g, '\\"')}" | pbcopy`);

    console.log('Gemini CLIを対話モードで起動します...');
    console.log('クエリがクリップボードにコピーされました。Cmd+V で貼り付けてください。');
    console.log('\n--- コピーされたクエリ ---');
    console.log(initialQuery);
    console.log('--- ここまで ---\n');

    execSync('gemini', { stdio: 'inherit' });
  } catch (error) {
    logError('Gemini CLI起動中にエラーが発生しました');
    console.error(error);
  }
}
