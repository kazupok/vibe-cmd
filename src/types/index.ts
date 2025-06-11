export interface VibeCmdCommand {
  description: string;
  docs: string[];
  ignoreDocs?: string[];
}

export interface VibeCmdConfig {
  commands: Record<string, VibeCmdCommand>[];
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
}

export interface DocsResult {
  commands: CommandDocs[];
  totalCommands: number;
}