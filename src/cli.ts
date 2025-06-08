#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { AIAssistant, MockAIProvider } from './ai/AIAssistant';
import { KnowledgeManager } from './knowledge/KnowledgeManager';
import { type KnowledgeItem, ProjectConfig, type Task, type TeamMember } from './types';

const program = new Command();
// const projectManager = new ProjectManager();
const knowledgeManager = new KnowledgeManager();
// const taskManager = new TaskManager();
const aiAssistant = new AIAssistant(new MockAIProvider());

program.name('kai').description('Knowledge AI - AI駆動開発支援ツール').version('1.0.0');

program
  .command('init')
  .description('プロジェクトを初期化')
  .action(async () => {
    console.log(chalk.blue('🚀 Knowledge AI プロジェクトを初期化しています...'));

    try {
      // await projectManager.initializeProject(answers);
      await knowledgeManager.initialize();
      // await taskManager.initialize();

      console.log(chalk.green('✅ プロジェクトが正常に初期化されました！'));
      console.log(chalk.yellow('次のコマンドを試してみてください:'));
      console.log('  kai knowledge add - ナレッジを追加');
    } catch (error) {
      console.error(chalk.red('❌ 初期化に失敗しました:'), error);
    }
  });

// Project and Task commands are temporarily disabled
// const projectCommand = program.command('project').description('プロジェクト管理');
// const taskCommand = program.command('task').description('タスク管理');

const knowledgeCommand = program.command('knowledge').description('ナレッジ管理');

knowledgeCommand
  .command('add')
  .description('ナレッジを追加')
  .action(async () => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'title', message: 'タイトル:' },
      { type: 'input', name: 'category', message: 'カテゴリ:' },
      { type: 'editor', name: 'content', message: '内容:' },
      { type: 'input', name: 'author', message: '作成者:' },
      { type: 'input', name: 'tags', message: 'タグ (カンマ区切り):' },
    ]);

    const knowledge: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      title: answers.title,
      category: answers.category,
      content: answers.content,
      author: answers.author,
      tags: answers.tags ? answers.tags.split(',').map((tag: string) => tag.trim()) : [],
    };

    try {
      const item = await knowledgeManager.addKnowledge(knowledge);
      console.log(chalk.green(`✅ ナレッジ "${item.title}" を追加しました (ID: ${item.id})`));
    } catch (error) {
      console.error(chalk.red('❌ ナレッジ追加に失敗しました:'), error);
    }
  });

knowledgeCommand
  .command('search')
  .description('ナレッジを検索')
  .option('-q, --query <query>', '検索クエリ')
  .option('-c, --category <category>', 'カテゴリ')
  .action(async (options) => {
    try {
      const searchQuery: any = options.query ? { text: options.query } : {};
      if (options.category) {
        searchQuery.category = options.category;
      }

      const results = await knowledgeManager.searchKnowledge(searchQuery);

      if (results.length === 0) {
        console.log(chalk.yellow('🔍 検索結果がありません'));
        return;
      }

      console.log(chalk.blue(`🔍 検索結果 (${results.length}件)\n`));

      for (const item of results) {
        console.log(`📚 ${chalk.bold(item.title)}`);
        console.log(`   📂 ${item.category} | 👤 ${item.author}`);
        console.log(`   🏷️  ${item.tags.join(', ')}`);
        console.log(`   🕒 ${item.updatedAt.toISOString().split('T')[0]}`);
        console.log(`   ${item.content.substring(0, 100)}...`);
        console.log();
      }
    } catch (error) {
      console.error(chalk.red('❌ 検索に失敗しました:'), error);
    }
  });

const aiCommand = program.command('ai').description('AI アシスタント');

// AI commands are temporarily disabled
// aiCommand.command('suggest')...
// aiCommand.command('standup')...

// Utility functions temporarily disabled
// function getStatusIcon(status: Task['status']): string { ... }
// function getPriorityColor(priority: Task['priority']) { ... }

program.parse();
