import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';
import { CONFIG_FILE_NAME, DEFAULT_VC_DIR } from '../constants/index.js';
import type { CommandDocs, DocPattern, DocsResult, VibeCmdConfig } from '../types/index.js';

export async function loadConfig(): Promise<VibeCmdConfig> {
  const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);
  const configContent = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(configContent);
}

export function getDocsDirectory(config?: VibeCmdConfig): string {
  return config?.docsDirectory || DEFAULT_VC_DIR;
}

export async function getCommandDocs(commandName?: string): Promise<DocsResult> {
  const config = await loadConfig();

  let commandsToProcess = config.commands;

  if (commandName) {
    commandsToProcess = config.commands.filter(
      (cmd: Record<string, unknown>) => Object.keys(cmd)[0] === commandName
    );
  }

  const commands: CommandDocs[] = [];

  for (const command of commandsToProcess) {
    const name = Object.keys(command)[0];
    const commandData = command[name];
    const patterns: DocPattern[] = [];
    let totalFiles = 0;

    // 1. 通常の docs を処理
    for (const docPattern of commandData.docs) {
      try {
        const files = await glob(docPattern.replace(/^\//, ''), {
          cwd: process.cwd(),
          absolute: false,
        });

        patterns.push({
          pattern: docPattern,
          files,
          exists: files.length > 0,
        });

        totalFiles += files.length;
      } catch (error) {
        patterns.push({
          pattern: docPattern,
          files: [],
          exists: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 2. inlineDocs を処理（内容をクエリ先頭へ結合する用）
    const inlineDocsPatterns: DocPattern[] = [];
    const inlineFiles: string[] = [];

    if (Array.isArray(commandData.inlineDocs)) {
      for (const inlinePattern of commandData.inlineDocs) {
        try {
          const files = await glob(inlinePattern.replace(/^\//, ''), {
            cwd: process.cwd(),
            absolute: false,
          });

          inlineDocsPatterns.push({
            pattern: inlinePattern,
            files,
            exists: files.length > 0,
          });

          inlineFiles.push(...files);
        } catch (error) {
          inlineDocsPatterns.push({
            pattern: inlinePattern,
            files: [],
            exists: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // inlineDocs は patterns の先頭に追加して順序を保証
    const allPatterns: DocPattern[] = [...inlineDocsPatterns, ...patterns];

    commands.push({
      name,
      description: commandData.description || 'なし',
      patterns: allPatterns,
      totalFiles,
      'sub-commands': commandData['sub-commands'],
      inlineDocs: inlineFiles,
    });
  }

  return {
    commands,
    totalCommands: commands.length,
  };
}

export async function readCommandFiles(commandName: string): Promise<{
  content: string;
  loadedFiles: string[];
}> {
  const docsResult = await getCommandDocs(commandName);

  if (docsResult.commands.length === 0) {
    throw new Error(`コマンド "${commandName}" が見つかりませんでした`);
  }

  const loadedFiles: string[] = [];

  for (const command of docsResult.commands) {
    for (const pattern of command.patterns) {
      if (!pattern.exists) {
        continue;
      }

      for (const filePath of pattern.files) {
        loadedFiles.push(filePath);
      }
    }
  }

  const result = `コマンド "${commandName}" に関連するファイル (${loadedFiles.length}個):

${loadedFiles.map((file) => `- ${file}`).join('\n')}

**重要**: 上記のファイルを必ず読み込んでから作業を開始してください。
これらのファイルには "${commandName}" に関する重要な情報が含まれています。`;

  return {
    content: result,
    loadedFiles,
  };
}
