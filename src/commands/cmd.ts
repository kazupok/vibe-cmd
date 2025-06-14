import { existsSync } from 'node:fs';
import { join } from 'node:path';
import inquirer from 'inquirer';
import { execSync } from 'node:child_process';
import { CONFIG_FILE_NAME, MESSAGES } from '../constants/index.js';
import type { SubCommand, CommandDocs } from '../types/index.js';
import { 
  logError, 
  logWarning, 
  logChart, 
  formatSelectedCommand, 
  formatDescription, 
  formatPatternSuccess, 
  formatFileSuccess, 
  formatPatternError, 
  formatPatternWarning 
} from '../utils/console.js';
import { handleError } from '../utils/index.js';

export async function handleCmdCommand(): Promise<void> {
  try {
    const currentDir = process.cwd();
    const configPath = join(currentDir, CONFIG_FILE_NAME);

    if (!existsSync(configPath)) {
      logError(MESSAGES.ERROR.CONFIG_NOT_FOUND);
      logWarning(MESSAGES.INFO.SUGGEST_INIT);
      return;
    }

    const { getCommandDocs } = await import('../utils/docs.js');
    const docsResult = await getCommandDocs();

    if (docsResult.commands.length === 0) {
      logWarning(MESSAGES.ERROR.NO_COMMANDS_DEFINED);
      return;
    }

    const commandChoices = docsResult.commands.map((command) => ({
      name: `${command.name} - ${command.description}`,
      value: command.name,
      short: command.name,
    }));

    const { selectedCommand } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCommand',
        message: MESSAGES.INFO.SELECT_COMMAND,
        choices: commandChoices,
      },
    ]);

    const selectedCommandData = docsResult.commands.find((cmd) => cmd.name === selectedCommand);

    if (selectedCommandData) {
      console.log(formatSelectedCommand(selectedCommand));
      console.log(formatDescription(selectedCommandData.description));

      // サブコマンドを順番に実行（存在する場合）
      const subCommandAnswers: { [key: string]: string } = {};
      
      if (selectedCommandData['sub-commands'] && selectedCommandData['sub-commands'].length > 0) {
        for (const subCommand of selectedCommandData['sub-commands']) {
          console.log(`\n📝 ${subCommand.name}`);
          
          // 質問がある場合は回答を求める
          if (subCommand.question) {
            if (subCommand.answers && subCommand.answers.length > 0) {
              // 選択式
              const { answer } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'answer',
                  message: subCommand.question,
                  choices: subCommand.answers,
                },
              ]);
              subCommandAnswers[subCommand.name] = answer;
            } else {
              // 入力式
              const { answer } = await inquirer.prompt([
                {
                  type: 'input',
                  name: 'answer',
                  message: subCommand.question,
                },
              ]);
              subCommandAnswers[subCommand.name] = answer;
            }
          }
        }
      }

      // claude or cursor選択
      const { assistantChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'assistantChoice',
          message: 'どのアシスタントを使用しますか？',
          choices: [
            { name: 'Claude', value: 'claude' },
            { name: 'Cursor', value: 'cursor' }
          ],
        },
      ]);

      if (assistantChoice === 'claude') {
        await handleClaudeFlow(selectedCommandData, subCommandAnswers);
      } else {
        await handleCursorFlow(selectedCommandData, subCommandAnswers);
      }
    }
  } catch (error) {
    handleError(MESSAGES.ERROR.CMD_EXECUTION_FAILED, error);
  }
}

async function handleClaudeFlow(selectedCommandData: CommandDocs, subCommandAnswers: { [key: string]: string }): Promise<void> {
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
  
  // Claude Codeを起動
  try {
    let commandText = selectedCommandData.name;
    if (option) {
      commandText += ` ${option}`;
    }
    
    console.log(`\n実行内容: ${commandText}`);
    console.log('対象ドキュメント一覧:');
    console.log(docsList);
    console.log('\nClaude Codeを起動しています...');
    
    // @ファイル参照を使用した初期クエリを作成
    let fileReferences = '';
    for (const pattern of selectedCommandData.patterns) {
      if (pattern.exists && pattern.files.length > 0) {
        for (const file of pattern.files) {
          fileReferences += `@${file} `;
        }
      }
    }
    
    // サブコマンドと回答を含むクエリを構築
    let query = `${commandText}\n\n目的: ${selectedCommandData.description}`;
    
    // サブコマンドの回答を追加
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
    execSync(`claude "${initialQuery}"`, { stdio: 'inherit' });
    
  } catch (error) {
    logError('Claude Code起動中にエラーが発生しました');
    console.error(error);
  }
}

async function handleCursorFlow(selectedCommandData: CommandDocs, subCommandAnswers: { [key: string]: string }): Promise<void> {
  try {
    // Cursorをアクティブにする
    execSync('osascript -e \'tell application "Cursor" to activate\'');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Command+L でチャット開始
    execSync('osascript -e \'tell application "System Events" to keystroke "l" using command down\'');
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
    
    // サブコマンドの回答を追加
    if (Object.keys(subCommandAnswers).length > 0) {
      chatMessage += '\n\n入力内容:';
      for (const [name, answer] of Object.entries(subCommandAnswers)) {
        chatMessage += `\n- ${name}: ${answer}`;
      }
    }
    
    // メッセージをクリップボードにコピー
    const { execSync: execSyncForClipboard } = await import('node:child_process');
    execSyncForClipboard(`echo "${chatMessage.replace(/"/g, '\\"')}" | pbcopy`);
    
    // 少し待機してからペースト
    await new Promise(resolve => setTimeout(resolve, 500));
    execSync('osascript -e \'tell application "System Events" to keystroke "v" using command down\'');
    
    // Enterキーを押して送信
    await new Promise(resolve => setTimeout(resolve, 300));
    execSync('osascript -e \'tell application "System Events" to keystroke return\'');
    
    console.log('Cursorのチャットに以下のメッセージを送信しました:');
    console.log(chatMessage);
    
  } catch (error) {
    logError('Cursor操作中にエラーが発生しました');
    console.error(error);
  }
}