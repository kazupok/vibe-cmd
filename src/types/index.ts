export interface SubCommand {
  name: string;
  question?: string;
  answers?: string[];
}

export interface VibeCmdCommand {
  description: string;
  docs: string[];
  /** ドキュメント本文を直接クエリに挿入するファイル一覧 */
  inlineDocs?: string[];
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
}

export interface DocsResult {
  commands: CommandDocs[];
  totalCommands: number;
}
