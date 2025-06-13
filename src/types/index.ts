export interface SubCommand {
  name: string;
  question?: string;
  answers?: string[];
}

export interface VibeCmdCommand {
  description: string;
  docs: string[];
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
}

export interface DocsResult {
  commands: CommandDocs[];
  totalCommands: number;
}