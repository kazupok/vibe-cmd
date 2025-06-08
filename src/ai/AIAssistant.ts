import type { AIContext, KnowledgeItem, ProjectConfig, Task } from '../types';

export interface AIProvider {
  generateResponse(prompt: string, context?: AIContext): Promise<string>;
  generateCode(description: string, context?: AIContext): Promise<string>;
  reviewCode(code: string, context?: AIContext): Promise<string>;
  suggestTasks(projectInfo: ProjectConfig): Promise<Partial<Task>[]>;
}

export class AIAssistant {
  private provider?: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider;
  }

  setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  async generateProjectSuggestions(projectInfo: ProjectConfig): Promise<{
    tasks: Partial<Task>[];
    knowledgeGaps: string[];
    improvements: string[];
  }> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }

    const tasks = await this.provider.suggestTasks(projectInfo);

    const knowledgeGaps = this.identifyKnowledgeGaps(projectInfo);
    const improvements = this.suggestImprovements(projectInfo);

    return {
      tasks,
      knowledgeGaps,
      improvements,
    };
  }

  async generateCodeSuggestion(description: string, context: AIContext): Promise<string> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }

    return this.provider.generateCode(description, context);
  }

  async reviewCode(code: string, context: AIContext): Promise<string> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }

    return this.provider.reviewCode(code, context);
  }

  async generateTaskDescription(title: string, context: AIContext): Promise<string> {
    if (!this.provider) {
      return `Task: ${title}`;
    }

    const prompt = `Generate a detailed task description for: "${title}"
    
Project context:
- Name: ${context.projectInfo.name}
- Technologies: ${context.projectInfo.technologies.join(', ')}
- Goals: ${context.projectInfo.goals.join(', ')}

Recent tasks:
${context.recentTasks.map((task) => `- ${task.title} (${task.status})`).join('\n')}

Provide a clear, actionable description with acceptance criteria.`;

    return this.provider.generateResponse(prompt, context);
  }

  async suggestKnowledgeItems(
    projectInfo: ProjectConfig,
    existingKnowledge: KnowledgeItem[]
  ): Promise<
    Array<{
      title: string;
      category: string;
      content: string;
      tags: string[];
    }>
  > {
    const suggestions: Array<{
      title: string;
      category: string;
      content: string;
      tags: string[];
    }> = [];

    const existingTitles = new Set(existingKnowledge.map((item) => item.title.toLowerCase()));

    for (const tech of projectInfo.technologies) {
      const setupTitle = `${tech} Setup Guide`;
      if (!existingTitles.has(setupTitle.toLowerCase())) {
        suggestions.push({
          title: setupTitle,
          category: 'Setup',
          content: `Setup and configuration guide for ${tech}`,
          tags: [tech.toLowerCase(), 'setup', 'configuration'],
        });
      }

      const bestPracticesTitle = `${tech} Best Practices`;
      if (!existingTitles.has(bestPracticesTitle.toLowerCase())) {
        suggestions.push({
          title: bestPracticesTitle,
          category: 'Best Practices',
          content: `Best practices and conventions for ${tech}`,
          tags: [tech.toLowerCase(), 'best-practices', 'conventions'],
        });
      }
    }

    if (!existingTitles.has('project architecture')) {
      suggestions.push({
        title: 'Project Architecture',
        category: 'Architecture',
        content: 'Overview of the project architecture and design decisions',
        tags: ['architecture', 'design', 'overview'],
      });
    }

    if (!existingTitles.has('deployment guide')) {
      suggestions.push({
        title: 'Deployment Guide',
        category: 'Operations',
        content: 'Step-by-step deployment instructions',
        tags: ['deployment', 'operations', 'guide'],
      });
    }

    return suggestions;
  }

  async generateStandupReport(tasks: Task[], teamMember: string): Promise<string> {
    const memberTasks = tasks.filter((task) => task.assignee === teamMember);

    const yesterday = memberTasks.filter(
      (task) => task.status === 'done' && this.isWithinLastDay(task.updatedAt)
    );

    const today = memberTasks.filter(
      (task) =>
        task.status === 'in-progress' || (task.status === 'todo' && task.priority === 'high')
    );

    const blockers = memberTasks.filter(
      (task) => task.dependencies.length > 0 || task.priority === 'critical'
    );

    let report = `# Standup Report - ${teamMember}\n\n`;

    report += '## Yesterday\n';
    if (yesterday.length > 0) {
      for (const task of yesterday) {
        report += `- ✅ ${task.title}\n`;
      }
    } else {
      report += '- No completed tasks\n';
    }

    report += '\n## Today\n';
    if (today.length > 0) {
      for (const task of today) {
        report += `- 🔄 ${task.title}\n`;
      }
    } else {
      report += '- No planned tasks\n';
    }

    report += '\n## Blockers\n';
    if (blockers.length > 0) {
      for (const task of blockers) {
        report += `- 🚫 ${task.title}`;
        if (task.dependencies.length > 0) {
          report += ` (depends on ${task.dependencies.length} tasks)`;
        }
        report += '\n';
      }
    } else {
      report += '- No blockers\n';
    }

    return report;
  }

  async generateProjectSummary(
    projectInfo: ProjectConfig,
    tasks: Task[],
    knowledge: KnowledgeItem[]
  ): Promise<string> {
    let summary = `# ${projectInfo.name} - Project Summary\n\n`;

    summary += `${projectInfo.description}\n\n`;

    const taskStats = this.calculateTaskStats(tasks);
    summary += '## Progress Overview\n';
    summary += `- Total Tasks: ${taskStats.total}\n`;
    summary += `- Completed: ${taskStats.completed} (${Math.round(taskStats.completionRate * 100)}%)\n`;
    summary += `- In Progress: ${taskStats.inProgress}\n`;
    summary += `- Remaining: ${taskStats.remaining}\n\n`;

    summary += '## Knowledge Base\n';
    summary += `- Total Articles: ${knowledge.length}\n`;
    const categories = [...new Set(knowledge.map((item) => item.category))];
    summary += `- Categories: ${categories.join(', ')}\n\n`;

    if (projectInfo.timeline?.milestones.length) {
      summary += '## Upcoming Milestones\n';
      const upcomingMilestones = projectInfo.timeline.milestones
        .filter((milestone) => milestone.status !== 'completed')
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 3);

      for (const milestone of upcomingMilestones) {
        summary += `- **${milestone.name}** - ${milestone.dueDate.toISOString().split('T')[0]} (${milestone.status})\n`;
      }
    }

    return summary;
  }

  private identifyKnowledgeGaps(projectInfo: ProjectConfig): string[] {
    const gaps: string[] = [];

    for (const tech of projectInfo.technologies) {
      gaps.push(`${tech} documentation and best practices`);
    }

    gaps.push('Project architecture documentation');
    gaps.push('Deployment and operations guide');
    gaps.push('Code review guidelines');
    gaps.push('Testing strategies');

    return gaps;
  }

  private suggestImprovements(projectInfo: ProjectConfig): string[] {
    const improvements: string[] = [];

    if (!projectInfo.timeline) {
      improvements.push('Add project timeline with milestones');
    }

    if (!projectInfo.architecture) {
      improvements.push('Document system architecture');
    }

    if (projectInfo.team.length === 0) {
      improvements.push('Add team member information');
    }

    if (projectInfo.goals.length === 0) {
      improvements.push('Define clear project goals');
    }

    improvements.push('Set up automated testing');
    improvements.push('Implement continuous integration');
    improvements.push('Add code quality checks');

    return improvements;
  }

  private isWithinLastDay(date: Date): boolean {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return date >= oneDayAgo;
  }

  private calculateTaskStats(tasks: Task[]): {
    total: number;
    completed: number;
    inProgress: number;
    remaining: number;
    completionRate: number;
  } {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'done').length;
    const inProgress = tasks.filter((task) => task.status === 'in-progress').length;
    const remaining = tasks.filter(
      (task) => task.status === 'todo' || task.status === 'review'
    ).length;

    return {
      total,
      completed,
      inProgress,
      remaining,
      completionRate: total > 0 ? completed / total : 0,
    };
  }
}

export class MockAIProvider implements AIProvider {
  async generateResponse(prompt: string, context?: AIContext): Promise<string> {
    return `Mock response for: ${prompt.substring(0, 100)}...`;
  }

  async generateCode(description: string, context?: AIContext): Promise<string> {
    return `// Generated code for: ${description}\n// TODO: Implement this functionality`;
  }

  async reviewCode(code: string, context?: AIContext): Promise<string> {
    return 'Code review suggestions:\n- Consider adding error handling\n- Add unit tests\n- Improve code comments';
  }

  async suggestTasks(projectInfo: ProjectConfig): Promise<Partial<Task>[]> {
    return [
      {
        title: 'Setup project documentation',
        description: 'Create comprehensive project documentation',
        status: 'todo',
        priority: 'medium',
        tags: ['documentation'],
        dependencies: [],
      },
      {
        title: 'Implement core functionality',
        description: 'Develop the main features of the application',
        status: 'todo',
        priority: 'high',
        tags: ['development'],
        dependencies: [],
      },
      {
        title: 'Setup testing framework',
        description: 'Configure automated testing',
        status: 'todo',
        priority: 'medium',
        tags: ['testing'],
        dependencies: [],
      },
    ];
  }
}
