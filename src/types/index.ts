export interface VibeCmdCommand {
  description: string;
  docs: string[];
  ignoreDocs?: string[];
}

export interface VibeCmdConfig {
  commands: Record<string, VibeCmdCommand>[];
}