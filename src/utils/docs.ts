import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { glob } from 'glob';
import { CONFIG_FILE_NAME, DEFAULT_VC_DIR } from '../constants/index.js';
import type { CommandDocs, DocPattern, DocsResult, VibeCmdConfig } from '../types/index.js';

export async function loadConfig(): Promise<VibeCmdConfig> {
  const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);
  const configContent = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(configContent) as VibeCmdConfig;

  // JSON Schema 検証
  const schema = {
    type: 'object',
    required: ['commands'],
    properties: {
      docsDirectory: { type: 'string' },
      commands: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            required: ['description', 'docs'],
            properties: {
              description: { type: 'string' },
              docs: {
                type: 'array',
                items: { type: 'string' },
              },
              inlineDocs: {
                type: 'array',
                items: { type: 'string' },
              },
              preCommands: {
                type: 'array',
                items: { type: 'string' },
              },
              'sub-commands': {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    question: { type: 'string' },
                    answers: {
                      type: 'array',
                      items: {
                        anyOf: [
                          { type: 'string' },
                          {
                            type: 'object',
                            required: ['label'],
                            properties: {
                              label: { type: 'string' },
                              docs: {
                                type: 'array',
                                items: { type: 'string' },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  } as const;

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(config);

  if (!valid) {
    const errors = validate.errors
      ?.map((e: ErrorObject) => `${e.instancePath} ${e.message}`)
      .join('\n');
    throw new Error(`vc.config.json スキーマエラー:\n${errors}`);
  }

  return config;
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
      'sub-commands': commandData['sub-commands'],
      inlineDocs: commandData.inlineDocs,
      preCommands: commandData.preCommands,
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
