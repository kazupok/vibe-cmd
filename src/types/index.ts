export interface ProjectConfig {
  name: string;
  description: string;
  version: string;
  technologies: string[];
  goals: string[];
  team: TeamMember[];
  timeline?: Timeline;
  architecture?: ArchitectureInfo;
}

export interface TeamMember {
  name: string;
  role: string;
  email?: string;
  responsibilities: string[];
}

export interface Timeline {
  start: Date;
  end?: Date;
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
}

export interface ArchitectureInfo {
  type: string;
  components: Component[];
  dependencies: string[];
  deployment?: DeploymentInfo;
}

export interface Component {
  name: string;
  description: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'library';
  path?: string;
}

export interface DeploymentInfo {
  environment: string;
  platform: string;
  config: Record<string, unknown>;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  tags: string[];
  dependencies: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface AIContext {
  projectInfo: ProjectConfig;
  recentTasks: Task[];
  relevantKnowledge: KnowledgeItem[];
  codebaseStructure?: string[];
}

export interface VibeDocsCommand {
  description: string;
  docs: string[];
  ignoreDocs?: string[];
}

export interface VibeDocsConfig {
  commands: Record<string, VibeDocsCommand>[];
}