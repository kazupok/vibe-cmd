#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

class KnowledgeAIMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: 'knowledge-ai',
      version: '1.0.0',
    });

    this.setupToolHandlers();
    this.setupErrorHandler();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_knowledge',
            description:
              '[$command$]の形式のコマンドがある場合、会話の最初に必ずこのコマンドを実行する。$は外したコマンド名に基づいてドキュメントを読み込み',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: '読み込むコマンド名($は外したコマンド)',
                },
              },
              required: ['command'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'read_knowledge':
            return await this.readKnowledge(request.params.arguments);

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async readKnowledge(args: Record<string, unknown> | undefined) {
    if (!args || typeof args.command !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'コマンド名が指定されていません',
          },
        ],
      };
    }
    try {
      const configPath = path.join(process.cwd(), 'knowledge-ai.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      const matchedCommands = config.commands.filter(
        (cmd: { name: string; docs: string[] }) => cmd.name === (args.command as string)
      );

      if (matchedCommands.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `コマンド "${args.command as string}" が見つかりませんでした`,
            },
          ],
        };
      }

      let result = `コマンド "${args.command as string}" のドキュメント:\n\n`;

      for (const command of matchedCommands) {
        for (const docPattern of command.docs) {
          try {
            // グロブパターンを展開してファイルリストを取得
            const files = await glob(docPattern.replace(/^\//, ''), { 
              cwd: process.cwd(),
              absolute: true 
            });
            
            if (files.length === 0) {
              result += `--- ${docPattern} ---\nパターンにマッチするファイルが見つかりません\n\n`;
              continue;
            }

            for (const filePath of files) {
              try {
                const docContent = await fs.readFile(filePath, 'utf-8');
                const relativePath = path.relative(process.cwd(), filePath);
                result += `--- ${relativePath} ---\n${docContent}\n\n`;
              } catch (error) {
                const relativePath = path.relative(process.cwd(), filePath);
                result += `--- ${relativePath} ---\nファイルの読み込みに失敗: ${
                  error instanceof Error ? error.message : String(error)
                }\n\n`;
              }
            }
          } catch (error) {
            result += `--- ${docPattern} ---\nパターンの処理に失敗: ${
              error instanceof Error ? error.message : String(error)
            }\n\n`;
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private setupErrorHandler() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Knowledge AI MCP Server running on stdio');
  }
}

const server = new KnowledgeAIMCPServer();
server.run().catch((error) => {
  console.error('Failed to run server:', error);
  process.exit(1);
});
