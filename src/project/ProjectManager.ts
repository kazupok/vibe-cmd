import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { ProjectConfig, TeamMember, Milestone } from '../types';

export class ProjectManager {
  private configPath: string;
  private config: ProjectConfig | null = null;

  constructor(projectRoot: string = process.cwd()) {
    this.configPath = path.join(projectRoot, 'project.yaml');
  }

  async loadConfig(): Promise<ProjectConfig | null> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const yamlContent = await fs.readFile(this.configPath, 'utf-8');
        this.config = yaml.parse(yamlContent) as ProjectConfig;
        return this.config;
      }
    } catch (error) {
      console.error('Error loading project config:', error);
    }
    return null;
  }

  async saveConfig(config: ProjectConfig): Promise<void> {
    try {
      const yamlContent = yaml.stringify(config, { indent: 2 });
      await fs.writeFile(this.configPath, yamlContent);
      this.config = config;
    } catch (error) {
      console.error('Error saving project config:', error);
      throw error;
    }
  }

  async initializeProject(projectData: Partial<ProjectConfig>): Promise<ProjectConfig> {
    const defaultConfig: ProjectConfig = {
      name: projectData.name || 'New Project',
      description: projectData.description || '',
      version: projectData.version || '1.0.0',
      technologies: projectData.technologies || [],
      goals: projectData.goals || [],
      team: projectData.team || [],
    };

    await this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  async updateProject(updates: Partial<ProjectConfig>): Promise<ProjectConfig> {
    const currentConfig = await this.loadConfig();
    if (!currentConfig) {
      throw new Error('No project configuration found. Initialize project first.');
    }

    const updatedConfig = { ...currentConfig, ...updates };
    await this.saveConfig(updatedConfig);
    return updatedConfig;
  }

  async addTeamMember(member: TeamMember): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      throw new Error('No project configuration found. Initialize project first.');
    }

    config.team = config.team || [];
    config.team.push(member);
    await this.saveConfig(config);
  }

  async removeTeamMember(memberName: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      throw new Error('No project configuration found. Initialize project first.');
    }

    config.team = config.team?.filter(member => member.name !== memberName) || [];
    await this.saveConfig(config);
  }

  async addMilestone(milestone: Milestone): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      throw new Error('No project configuration found. Initialize project first.');
    }

    config.timeline = config.timeline || {
      start: new Date(),
      milestones: [],
    };
    config.timeline.milestones.push(milestone);
    await this.saveConfig(config);
  }

  async updateMilestone(milestoneName: string, updates: Partial<Milestone>): Promise<void> {
    const config = await this.loadConfig();
    if (!config || !config.timeline) {
      throw new Error('No project timeline found.');
    }

    const milestone = config.timeline.milestones.find(m => m.name === milestoneName);
    if (!milestone) {
      throw new Error(`Milestone '${milestoneName}' not found.`);
    }

    Object.assign(milestone, updates);
    await this.saveConfig(config);
  }

  getConfig(): ProjectConfig | null {
    return this.config;
  }

  async generateProjectSummary(): Promise<string> {
    const config = await this.loadConfig();
    if (!config) {
      return 'No project configuration found.';
    }

    let summary = `# ${config.name}\n\n`;
    summary += `**Version:** ${config.version}\n`;
    summary += `**Description:** ${config.description}\n\n`;

    if (config.technologies.length > 0) {
      summary += `**Technologies:** ${config.technologies.join(', ')}\n\n`;
    }

    if (config.goals.length > 0) {
      summary += `**Goals:**\n`;
      config.goals.forEach(goal => {
        summary += `- ${goal}\n`;
      });
      summary += '\n';
    }

    if (config.team.length > 0) {
      summary += `**Team:**\n`;
      config.team.forEach(member => {
        summary += `- **${member.name}** (${member.role})\n`;
        if (member.responsibilities.length > 0) {
          summary += `  - Responsibilities: ${member.responsibilities.join(', ')}\n`;
        }
      });
      summary += '\n';
    }

    if (config.timeline?.milestones.length) {
      summary += `**Milestones:**\n`;
      config.timeline.milestones.forEach(milestone => {
        summary += `- ${milestone.name} - ${milestone.status} (Due: ${milestone.dueDate.toISOString().split('T')[0]})\n`;
      });
    }

    return summary;
  }
}