#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { glob } from 'glob';

class KnowledgeAIMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: 'vibe-cmd-mcp',
      version: '0.0.1',
    });

    this.setupToolHandlers();
    this.setupErrorHandler();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_docs',
            description:
              '[:command-name]の形式のコマンドがある場合、会話の最初に必ずこのコマンドを実行する。コロンは外したコマンド名に基づいてドキュメントを読み込み',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: '読み込むコマンド名(:コロンは外したコマンド名)',
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
          case 'read_docs':
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
      const { readCommandFiles } = await import('./utils/docs.js');
      const { content, loadedFiles } = await readCommandFiles(args.command as string);

      const fileListText =
        loadedFiles.length > 0
          ? `\n読み込まれたファイル一覧 (${loadedFiles.length}個):\n${loadedFiles.map((f) => `- ${f}`).join('\n')}\n\n`
          : '\n読み込まれたファイルはありません\n\n';

      const finalResult = `${fileListText}${content}\n**重要**: 読み込まれたファイルの内容を必ず確認してください。\n\n**指示**: 以下のファイルリストを確認し、必要に応じて個別にファイルを読み込んでください:\n${loadedFiles.map((f) => `- ${f}`).join('\n')}`;

      return {
        content: [
          {
            type: 'text',
            text: finalResult,
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
