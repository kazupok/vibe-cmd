import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';

export interface DocPattern {
  pattern: string;
  files: string[];
  exists: boolean;
  error?: string;
}

export interface CommandDocs {
  name: string;
  description: string;
  patterns: DocPattern[];
  totalFiles: number;
}

export interface DocsResult {
  commands: CommandDocs[];
  totalCommands: number;
}

export async function loadConfig(): Promise<any> {
  const configPath = path.join(process.cwd(), 'vibe-flow.config.json');
  const configContent = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(configContent);
}

export async function getCommandDocs(commandName?: string): Promise<DocsResult> {
  const config = await loadConfig();
  
  let commandsToProcess = config.commands;
  
  if (commandName) {
    commandsToProcess = config.commands.filter(
      (cmd: Record<string, any>) => Object.keys(cmd)[0] === commandName
    );
  }

  const commands: CommandDocs[] = [];

  for (const command of commandsToProcess) {
    const name = Object.keys(command)[0];
    const commandData = command[name];
    const patterns: DocPattern[] = [];
    let totalFiles = 0;

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

    commands.push({
      name,
      description: commandData.description || 'なし',
      patterns,
      totalFiles,
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

${loadedFiles.map(file => `- ${file}`).join('\n')}

**重要**: 上記のファイルを必ず読み込んでから作業を開始してください。
これらのファイルには "${commandName}" に関する重要な情報が含まれています。`;

  return {
    content: result,
    loadedFiles,
  };
}