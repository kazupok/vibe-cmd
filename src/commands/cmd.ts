import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { glob } from 'glob';
import inquirer from 'inquirer';
import { CONFIG_FILE_NAME, MESSAGES } from '../constants/index.js';
import type { CommandDocs, SubCommand } from '../types/index.js';
import {
  formatDescription,
  formatFileSuccess,
  formatPatternError,
  formatPatternSuccess,
  formatPatternWarning,
  formatSelectedCommand,
  logChart,
  logError,
  logWarning,
} from '../utils/console.js';
import { handleError } from '../utils/index.js';
import { handleClaudeFlow } from './flows/claude.js';
import { handleCursorFlow } from './flows/cursor.js';
import { handleGeminiFlow } from './flows/gemini.js';

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

      const additionalDocsPatterns: string[] = [];

      if (selectedCommandData['sub-commands'] && selectedCommandData['sub-commands'].length > 0) {
        for (const subCommand of selectedCommandData['sub-commands']) {
          console.log(`\n📝 ${subCommand.name}`);

          // 質問がある場合は回答を求める
          if (subCommand.question) {
            if (subCommand.answers && subCommand.answers.length > 0) {
              // 選択式
              const answerChoices = subCommand.answers.map((ans) =>
                typeof ans === 'string' ? { label: ans } : ans
              );

              const { answer } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'answer',
                  message: subCommand.question,
                  choices: answerChoices.map((c) => ({ name: c.label, value: c })),
                },
              ]);

              subCommandAnswers[subCommand.name] = (answer as { label: string }).label;

              if ((answer as { docs?: string[] }).docs) {
                additionalDocsPatterns.push(...((answer as { docs?: string[] }).docs ?? []));
              }
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

      // sub-command の選択により追加された docs を patterns に追加
      if (additionalDocsPatterns.length > 0) {
        for (const pattern of additionalDocsPatterns) {
          try {
            const files = await glob(pattern.replace(/^\//, ''), {
              cwd: process.cwd(),
              absolute: false,
            });

            selectedCommandData.patterns.push({
              pattern,
              files,
              exists: files.length > 0,
            });
          } catch (error) {
            selectedCommandData.patterns.push({
              pattern,
              files: [],
              exists: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // preCommands の実行
      if (selectedCommandData.preCommands && selectedCommandData.preCommands.length > 0) {
        console.log('\n⚙️  事前コマンドを実行します...');
        for (const cmd of selectedCommandData.preCommands) {
          try {
            console.log(`$ ${cmd}`);
            execSync(cmd, { stdio: 'inherit' });
          } catch (error) {
            logError(`事前コマンド \"${cmd}\" の実行に失敗しました`);
            throw error;
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
            { name: 'Gemini', value: 'gemini' },
            { name: 'Cursor', value: 'cursor' },
          ],
        },
      ]);

      if (assistantChoice === 'claude') {
        await handleClaudeFlow(selectedCommandData, subCommandAnswers);
      } else if (assistantChoice === 'gemini') {
        await handleGeminiFlow(selectedCommandData, subCommandAnswers);
      } else {
        await handleCursorFlow(selectedCommandData, subCommandAnswers);
      }
    }
  } catch (error) {
    handleError(MESSAGES.ERROR.CMD_EXECUTION_FAILED, error);
  }
}
