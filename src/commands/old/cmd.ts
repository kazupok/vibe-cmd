import { existsSync } from 'node:fs';
import { join } from 'node:path';
import inquirer from 'inquirer';
import { CONFIG_FILE_NAME, MESSAGES } from '../../constants/index.js';
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
} from '../../utils/console.js';
import { handleError } from '../../utils/index.js';

export async function handleCmdCommand(): Promise<void> {
  try {
    const currentDir = process.cwd();
    const configPath = join(currentDir, CONFIG_FILE_NAME);

    if (!existsSync(configPath)) {
      logError(MESSAGES.ERROR.CONFIG_NOT_FOUND);
      logWarning(MESSAGES.INFO.SUGGEST_INIT);
      return;
    }

    const { getCommandDocs } = await import('../../utils/docs.js');
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

      logChart(`${MESSAGES.INFO.EXISTING_FILES}\n`);

      let totalFiles = 0;
      for (const pattern of selectedCommandData.patterns) {
        if (pattern.exists && pattern.files.length > 0) {
          console.log(formatPatternSuccess(pattern.pattern));
          for (const file of pattern.files) {
            console.log(formatFileSuccess(file));
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
      logWarning(MESSAGES.INFO.READ_FILES_FIRST);
      logWarning(MESSAGES.INFO.SHOW_FILE_LIST);
    }
  } catch (error) {
    handleError(MESSAGES.ERROR.CMD_EXECUTION_FAILED, error);
  }
}
