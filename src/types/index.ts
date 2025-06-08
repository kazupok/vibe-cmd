export interface VibeDocsCommand {
  description: string;
  docs: string[];
  ignoreDocs?: string[];
}

export interface VibeDocsConfig {
  commands: Record<string, VibeDocsCommand>[];
}