#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { AIAssistant, MockAIProvider } from './ai/AIAssistant';
import { KnowledgeManager } from './knowledge/KnowledgeManager';
import { ProjectManager } from './project/ProjectManager';
import { TaskManager } from './tasks/TaskManager';
import { type KnowledgeItem, ProjectConfig, type Task, type TeamMember } from './types';

const program = new Command();
const projectManager = new ProjectManager();
const knowledgeManager = new KnowledgeManager();
const taskManager = new TaskManager();
const aiAssistant = new AIAssistant(new MockAIProvider());

program.name('kai').description('Knowledge AI - AI駆動開発支援ツール').version('1.0.0');

program
  .command('init')
  .description('プロジェクトを初期化')
  .action(async () => {
    console.log(chalk.blue('🚀 Knowledge AI プロジェクトを初期化しています...'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'プロジェクト名:',
        default: 'my-project',
      },
      {
        type: 'input',
        name: 'description',
        message: 'プロジェクトの説明:',
      },
      {
        type: 'input',
        name: 'version',
        message: 'バージョン:',
        default: '1.0.0',
      },
      {
        type: 'checkbox',
        name: 'technologies',
        message: '使用技術を選択:',
        choices: [
          'TypeScript',
          'JavaScript',
          'React',
          'Vue.js',
          'Node.js',
          'Python',
          'Java',
          'Go',
          'Rust',
          'Docker',
          'AWS',
          'GCP',
        ],
      },
    ]);

    try {
      await projectManager.initializeProject(answers);
      await knowledgeManager.initialize();
      await taskManager.initialize();

      console.log(chalk.green('✅ プロジェクトが正常に初期化されました！'));
      console.log(chalk.yellow('次のコマンドを試してみてください:'));
      console.log('  kai project summary - プロジェクト概要を表示');
      console.log('  kai task create - 新しいタスクを作成');
      console.log('  kai knowledge add - ナレッジを追加');
    } catch (error) {
      console.error(chalk.red('❌ 初期化に失敗しました:'), error);
    }
  });

const projectCommand = program.command('project').description('プロジェクト管理');

projectCommand
  .command('summary')
  .description('プロジェクト概要を表示')
  .action(async () => {
    try {
      const summary = await projectManager.generateProjectSummary();
      console.log(summary);
    } catch (error) {
      console.error(chalk.red('❌ 概要の取得に失敗しました:'), error);
    }
  });

projectCommand
  .command('team')
  .description('チーム管理')
  .action(async () => {
    const action = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '操作を選択:',
        choices: ['メンバー追加', 'メンバー削除', 'メンバー一覧'],
      },
    ]);

    if (action.action === 'メンバー追加') {
      const member = await inquirer.prompt([
        { type: 'input', name: 'name', message: '名前:' },
        { type: 'input', name: 'role', message: '役割:' },
        { type: 'input', name: 'email', message: 'メールアドレス (任意):' },
        {
          type: 'input',
          name: 'responsibilities',
          message: '責任範囲 (カンマ区切り):',
        },
      ]);

      const teamMember: TeamMember = {
        name: member.name,
        role: member.role,
        email: member.email || undefined,
        responsibilities: member.responsibilities.split(',').map((r: string) => r.trim()),
      };

      try {
        await projectManager.addTeamMember(teamMember);
        console.log(chalk.green(`✅ ${member.name} をチームに追加しました`));
      } catch (error) {
        console.error(chalk.red('❌ メンバー追加に失敗しました:'), error);
      }
    }
  });

const taskCommand = program.command('task').description('タスク管理');

taskCommand
  .command('create')
  .description('新しいタスクを作成')
  .action(async () => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'title', message: 'タスクタイトル:' },
      { type: 'input', name: 'description', message: '説明:' },
      {
        type: 'list',
        name: 'priority',
        message: '優先度:',
        choices: ['low', 'medium', 'high', 'critical'],
      },
      { type: 'input', name: 'assignee', message: '担当者 (任意):' },
      { type: 'input', name: 'tags', message: 'タグ (カンマ区切り):' },
    ]);

    const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: answers.title,
      description: answers.description,
      status: 'todo',
      priority: answers.priority,
      assignee: answers.assignee || undefined,
      tags: answers.tags ? answers.tags.split(',').map((tag: string) => tag.trim()) : [],
      dependencies: [],
    };

    try {
      const createdTask = await taskManager.createTask(task);
      console.log(
        chalk.green(`✅ タスク "${createdTask.title}" を作成しました (ID: ${createdTask.id})`)
      );
    } catch (error) {
      console.error(chalk.red('❌ タスク作成に失敗しました:'), error);
    }
  });

taskCommand
  .command('list')
  .description('タスク一覧を表示')
  .option('-s, --status <status>', 'ステータスでフィルタ')
  .option('-p, --priority <priority>', '優先度でフィルタ')
  .action(async (options) => {
    try {
      const filter: Parameters<typeof taskManager.getTasks>[0] = {};
      if (options.status) filter.status = options.status;
      if (options.priority) filter.priority = options.priority;

      const tasks = await taskManager.getTasks(filter);

      if (tasks.length === 0) {
        console.log(chalk.yellow('📝 タスクがありません'));
        return;
      }

      console.log(chalk.blue(`📋 タスク一覧 (${tasks.length}件)\n`));

      for (const task of tasks) {
        const statusIcon = getStatusIcon(task.status);
        const priorityColor = getPriorityColor(task.priority);

        console.log(`${statusIcon} ${chalk.bold(task.title)}`);
        console.log(`   ${priorityColor(task.priority.toUpperCase())} | ${task.status}`);
        if (task.assignee) {
          console.log(`   👤 ${task.assignee}`);
        }
        if (task.tags.length > 0) {
          console.log(`   🏷️  ${task.tags.join(', ')}`);
        }
        console.log(`   🕒 ${task.updatedAt.toISOString().split('T')[0]}`);
        console.log();
      }
    } catch (error) {
      console.error(chalk.red('❌ タスク一覧の取得に失敗しました:'), error);
    }
  });

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

aiCommand
  .command('suggest')
  .description('プロジェクトの提案を生成')
  .action(async () => {
    try {
      const projectConfig = await projectManager.loadConfig();
      if (!projectConfig) {
        console.log(
          chalk.red('❌ プロジェクト設定が見つかりません。kai init を実行してください。')
        );
        return;
      }

      console.log(chalk.blue('🤖 AI による提案を生成しています...'));

      const suggestions = await aiAssistant.generateProjectSuggestions(projectConfig);

      console.log(chalk.green('\n✨ 提案されたタスク:'));
      for (const task of suggestions.tasks) {
        console.log(`• ${task.title} (${task.priority})`);
      }

      console.log(chalk.yellow('\n📚 知識ギャップ:'));
      for (const gap of suggestions.knowledgeGaps) {
        console.log(`• ${gap}`);
      }

      console.log(chalk.cyan('\n🔧 改善提案:'));
      for (const improvement of suggestions.improvements) {
        console.log(`• ${improvement}`);
      }
    } catch (error) {
      console.error(chalk.red('❌ 提案生成に失敗しました:'), error);
    }
  });

aiCommand
  .command('standup')
  .description('スタンドアップレポートを生成')
  .option('-m, --member <member>', 'チームメンバー名')
  .action(async (options) => {
    if (!options.member) {
      console.log(chalk.red('❌ メンバー名を指定してください: --member <名前>'));
      return;
    }

    try {
      const tasks = await taskManager.getTasks();
      const report = await aiAssistant.generateStandupReport(tasks, options.member);
      console.log(report);
    } catch (error) {
      console.error(chalk.red('❌ レポート生成に失敗しました:'), error);
    }
  });

function getStatusIcon(status: Task['status']): string {
  switch (status) {
    case 'todo':
      return '📋';
    case 'in-progress':
      return '🔄';
    case 'review':
      return '👀';
    case 'done':
      return '✅';
    case 'cancelled':
      return '❌';
    default:
      return '❓';
  }
}

function getPriorityColor(priority: Task['priority']) {
  switch (priority) {
    case 'critical':
      return chalk.red.bold;
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.green;
    default:
      return chalk.gray;
  }
}

program.parse();
