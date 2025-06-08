export interface VibeFlowCommand {
  description: string;
  docs: string[];
  ignoreDocs?: string[];
}

export interface VibeFlowConfig {
  commands: Record<string, VibeFlowCommand>[];
}