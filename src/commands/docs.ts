import { MESSAGES } from '../constants/index.js';
import { 
  logWarning, 
  logList, 
  logBold, 
  logError, 
  formatPatternError, 
  formatPatternWarning 
} from '../utils/console.js';
import { handleError } from '../utils/index.js';

export async function handleDocsListCommand(options: { command?: string }): Promise<void> {
  try {
    const { getCommandDocs } = await import('../utils/docs.js');

    const docsResult = await getCommandDocs(options.command);

    if (options.command) {
      // 特定のコマンドのファイル一覧を表示
      if (docsResult.commands.length === 0) {
        logWarning(MESSAGES.ERROR.COMMAND_NOT_FOUND(options.command));
        return;
      }

      logList(`コマンド "${options.command}" のドキュメントファイル一覧:\n`);

      for (const command of docsResult.commands) {
        logBold(`📁 ${command.name}`);
        console.log(`   説明: ${command.description}`);
        console.log('   ファイル一覧:');

        for (const pattern of command.patterns) {
          if (pattern.error) {
            console.log(`     ${formatPatternError(pattern.pattern, pattern.error)}`);
          } else if (!pattern.exists) {
            console.log(`     ${formatPatternWarning(pattern.pattern)}`);
          } else {
            console.log(`     ✅ ${pattern.pattern}`);
            for (const file of pattern.files) {
              console.log(`       - ${file}`);
            }
          }
        }
        console.log();
      }
    } else {
      // 全コマンドの概要表示
      logList(`${MESSAGES.INFO.COMMAND_LIST}\n`);

      for (const command of docsResult.commands) {
        logBold(`📁 ${command.name}`);
        console.log(`   説明: ${command.description}`);
        console.log(`   ${MESSAGES.INFO.DOC_COUNT(command.totalFiles)}`);
        console.log();
      }

      logWarning(MESSAGES.INFO.DETAIL_COMMAND);
      console.log(`  ${MESSAGES.INFO.DETAIL_USAGE}`);
    }
  } catch (error) {
    handleError(MESSAGES.ERROR.DOCS_LIST_FAILED, error);
  }
}