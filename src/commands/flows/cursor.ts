import { execSync } from 'node:child_process';

import type { CommandDocs } from '../../types/index.js';
import { logError } from '../../utils/console.js';

/**
 * Cursor アプリを用いたフローを実行する
 */
export async function handleCursorFlow(
  selectedCommandData: CommandDocs,
  subCommandAnswers: { [key: string]: string }
): Promise<void> {
  try {
    // Cursorをアクティブにする
    execSync('osascript -e \'tell application "Cursor" to activate\'');
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Command+L でチャット開始
    execSync(
      'osascript -e \'tell application "System Events" to keystroke "l" using command down\''
    );
    await new Promise((resolve) => setTimeout(resolve, 500));

    // @ファイル参照を準備
    let fileReferences = '';
    for (const pattern of selectedCommandData.patterns) {
      if (pattern.exists && pattern.files.length > 0) {
        for (const file of pattern.files) {
          fileReferences += `@${file} `;
        }
      }
    }

    // チャットに送信するメッセージを作成
    let chatMessage = `${fileReferences}${selectedCommandData.name}\n\n目的: ${selectedCommandData.description}`;

    if (Object.keys(subCommandAnswers).length > 0) {
      chatMessage += '\n\n入力内容:';
      for (const [name, answer] of Object.entries(subCommandAnswers)) {
        chatMessage += `\n- ${name}: ${answer}`;
      }
    }

    // メッセージをクリップボードにコピー
    const { execSync: execSyncForClipboard } = await import('node:child_process');
    execSyncForClipboard(`echo "${chatMessage.replace(/"/g, '\\"')}" | pbcopy`);

    await new Promise((resolve) => setTimeout(resolve, 500));
    execSync(
      'osascript -e \'tell application "System Events" to keystroke "v" using command down\''
    );

    await new Promise((resolve) => setTimeout(resolve, 300));
    execSync('osascript -e \'tell application "System Events" to keystroke return\'');

    console.log('Cursorのチャットに以下のメッセージを送信しました:');
    console.log(chatMessage);
  } catch (error) {
    logError('Cursor操作中にエラーが発生しました');
    console.error(error);
  }
}
