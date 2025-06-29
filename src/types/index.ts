export interface SubCommand {
  name: string;
  question?: string;
  /** 回答の一覧。文字列か、label と docs を持つオブジェクト */
  answers?: (string | { label: string; docs?: string[] })[];
}

export interface VibeCmdCommand {
  description: string;
  docs: string[];
  /** ドキュメント本文を直接クエリに挿入するファイル一覧 */
  inlineDocs?: string[];
  /** Claude/Cursor 実行前にシェルで実行するコマンド */
  preCommands?: string[];
  ignoreDocs?: string[];
  'sub-commands'?: SubCommand[];
}

export interface VibeCmdConfig {
  commands: Record<string, VibeCmdCommand>[];
  docsDirectory?: string;
}

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
  'sub-commands'?: SubCommand[];
  /** ドキュメント本文を直接クエリに挿入するファイル一覧 */
  inlineDocs?: string[];
  /** Claude/Cursor 実行前にシェルで実行するコマンド */
  preCommands?: string[];
}

export interface DocsResult {
  commands: CommandDocs[];
  totalCommands: number;
}
