export const CONFIG_FILE_NAME = 'vc.config.json';
export const CLAUDE_MD_FILE_NAME = 'CLAUDE.md';
export const CURSOR_RULES_DIR = '.cursor/rules';
export const CURSOR_RULES_FILE = 'vibe-cmd.mdc';
export const DEFAULT_VC_DIR = '.vc';

export const MESSAGES = {
  ERROR: {
    CONFIG_NOT_FOUND: 'vc.config.json が見つかりません',
    COMMAND_NOT_FOUND: (commandName: string) => `コマンド "${commandName}" が見つかりませんでした`,
    NO_COMMANDS_DEFINED: '設定ファイルにコマンドが定義されていません',
    INIT_FAILED: '初期化に失敗しました:',
    CMD_EXECUTION_FAILED: 'コマンド実行に失敗しました:',
    DOCS_LIST_FAILED: 'ドキュメント一覧の取得に失敗しました:',
    CONFIG_LOAD_FAILED: '設定ファイルの読み込みに失敗しました:',
  },
  INFO: {
    SUGGEST_INIT: 'vc init を実行して設定ファイルを作成してください',
    SELECT_COMMAND: '実行するコマンドを選択してください:',
    SELECTED_COMMAND: (commandName: string) => `選択されたコマンド: ${commandName}`,
    DESCRIPTION: (description: string) => `説明: ${description}`,
    EXISTING_FILES: '実際に存在するファイル一覧:',
    TOTAL_FILES: (count: number) => `合計ファイル数: ${count}個`,
    READ_FILES_FIRST: '上記のファイルを必ず読み込んでから作業を開始してください。',
    SHOW_FILE_LIST: '読み込み完了したファイル名をリストで表示してください。',
    COMMAND_LIST: '利用可能なコマンド一覧:',
    DOC_COUNT: (count: number) => `ドキュメント数: ${count}個`,
    DETAIL_COMMAND: '特定のコマンドの詳細を見るには:',
    DETAIL_USAGE: 'vc docs list --command <コマンド名>',
  },
  SUCCESS: {
    CONFIG_COPIED: 'vc.config.json をコピーしました',
    DIR_COPIED: 'ドキュメントディレクトリをコピーしました',
    CLAUDE_MD_UPDATED: 'CLAUDE.md にコマンド指示を追加しました',
    CLAUDE_MD_CREATED: 'CLAUDE.md を作成しました',
    CURSOR_RULES_UPDATED: '.cursor/rules/vibe-cmd.mdc にコマンド指示を追加しました',
    CURSOR_RULES_CREATED: '.cursor/rules/vibe-cmd.mdc を作成しました',
    INIT_COMPLETED: 'vcの初期化が完了しました！',
  },
  WARNING: {
    CONFIG_NOT_FOUND_IN_SOURCE: 'vc.config.json が見つかりませんでした',
    DIR_NOT_FOUND_IN_SOURCE: 'ドキュメントディレクトリが見つかりませんでした',
    CLAUDE_MD_ALREADY_EXISTS: 'CLAUDE.md には既にコマンド指示が含まれています',
    CURSOR_RULES_ALREADY_EXISTS: '.cursor/rules/vibe-cmd.mdc には既にコマンド指示が含まれています',
    NO_MATCHING_FILES: (pattern: string) => `${pattern} (マッチするファイルなし)`,
    PATTERN_ERROR: (pattern: string, error: string) => `${pattern} (エラー: ${error})`,
  },
} as const;

export const ICONS = {
  ERROR: '❌',
  SUCCESS: '✅',
  WARNING: '⚠️',
  INFO: '💡',
  FOLDER: '📁',
  LIST: '📋',
  CHART: '📊',
  CELEBRATION: '🎉',
} as const;

export const VCMD_COMMAND_INSTRUCTION = `

<!-- vibe-cmd によって追加された指示 -->
「:」と入力があった場合は以下を実行すること：

\`\`\`
vc
\`\`\`

上記コマンド実行後、選択画面が表示されるので：
1. 「:」のみの場合：ユーザーに選択してもらう
2. 「:タスク名」の形式の場合：「:」以降の文字列に一致するコマンドがあれば自動選択する

<!-- vibe-cmd によって追加された指示 ここまで -->
`;

export const CLAUDE_MD_TEMPLATE = (instruction: string) => `# Claude Code 用指示
${instruction}`;

export const CURSOR_RULES_TEMPLATE = (instruction: string) => `---
description: 
globs: 
alwaysApply: true
---

# Cursor 用 vibe-cmd 指示
${instruction}`;