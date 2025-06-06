import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Task } from '../types';

export class TaskManager {
  private tasksDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.tasksDir = path.join(projectRoot, '.tasks');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tasksDir, { recursive: true });
      await fs.mkdir(path.join(this.tasksDir, 'active'), { recursive: true });
      await fs.mkdir(path.join(this.tasksDir, 'completed'), { recursive: true });
    } catch (error) {
      console.error('Error initializing tasks directory:', error);
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await this.initialize();

    const task: Task = {
      ...taskData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveTask(task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.status && updates.status !== task.status) {
      await this.moveTask(task, updatedTask);
    } else {
      await this.saveTask(updatedTask);
    }

    return updatedTask;
  }

  async getTask(id: string): Promise<Task | null> {
    const activeTask = await this.loadTaskFromDir('active', id);
    if (activeTask) return activeTask;

    const completedTask = await this.loadTaskFromDir('completed', id);
    return completedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }

    const dir = this.getTaskDir(task);
    const filePath = path.join(this.tasksDir, dir, `${id}.json`);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting task ${id}:`, error);
      throw error;
    }
  }

  async getTasks(filter?: {
    status?: Task['status'] | Task['status'][];
    priority?: Task['priority'];
    assignee?: string;
    tags?: string[];
  }): Promise<Task[]> {
    const activeTasks = await this.loadTasksFromDir('active');
    const completedTasks = await this.loadTasksFromDir('completed');
    let allTasks = [...activeTasks, ...completedTasks];

    if (filter) {
      allTasks = allTasks.filter(task => {
        if (filter.status) {
          const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
          if (!statuses.includes(task.status)) return false;
        }

        if (filter.priority && task.priority !== filter.priority) {
          return false;
        }

        if (filter.assignee && task.assignee !== filter.assignee) {
          return false;
        }

        if (filter.tags && filter.tags.length > 0) {
          const hasMatchingTag = filter.tags.some(tag => task.tags.includes(tag));
          if (!hasMatchingTag) return false;
        }

        return true;
      });
    }

    return allTasks.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    return this.getTasks({ status });
  }

  async getTasksByAssignee(assignee: string): Promise<Task[]> {
    return this.getTasks({ assignee });
  }

  async addDependency(taskId: string, dependencyId: string): Promise<void> {
    const task = await this.getTask(taskId);
    const dependency = await this.getTask(dependencyId);
    
    if (!task) {
      throw new Error(`Task with id '${taskId}' not found.`);
    }
    
    if (!dependency) {
      throw new Error(`Dependency task with id '${dependencyId}' not found.`);
    }

    if (!task.dependencies.includes(dependencyId)) {
      task.dependencies.push(dependencyId);
      task.updatedAt = new Date();
      await this.saveTask(task);
    }
  }

  async removeDependency(taskId: string, dependencyId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task with id '${taskId}' not found.`);
    }

    task.dependencies = task.dependencies.filter(id => id !== dependencyId);
    task.updatedAt = new Date();
    await this.saveTask(task);
  }

  async getBlockedTasks(): Promise<Task[]> {
    const tasks = await this.getTasks({ status: ['todo', 'in-progress'] });
    const blockedTasks: Task[] = [];

    for (const task of tasks) {
      if (task.dependencies.length > 0) {
        const dependencies = await Promise.all(
          task.dependencies.map(depId => this.getTask(depId))
        );
        
        const hasIncompleteDependencies = dependencies.some(dep => 
          dep && dep.status !== 'done' && dep.status !== 'cancelled'
        );
        
        if (hasIncompleteDependencies) {
          blockedTasks.push(task);
        }
      }
    }

    return blockedTasks;
  }

  async getTaskStats(): Promise<{
    total: number;
    byStatus: Record<Task['status'], number>;
    byPriority: Record<Task['priority'], number>;
    averageCompletionTime?: number;
  }> {
    const tasks = await this.getTasks();
    
    const stats = {
      total: tasks.length,
      byStatus: {
        todo: 0,
        'in-progress': 0,
        review: 0,
        done: 0,
        cancelled: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };

    let totalCompletionTime = 0;
    let completedTasksCount = 0;

    for (const task of tasks) {
      stats.byStatus[task.status]++;
      stats.byPriority[task.priority]++;

      if (task.status === 'done') {
        const completionTime = task.updatedAt.getTime() - task.createdAt.getTime();
        totalCompletionTime += completionTime;
        completedTasksCount++;
      }
    }

    const result: typeof stats & { averageCompletionTime?: number } = stats;
    
    if (completedTasksCount > 0) {
      result.averageCompletionTime = totalCompletionTime / completedTasksCount;
    }

    return result;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTaskDir(task: Task): string {
    return task.status === 'done' || task.status === 'cancelled' ? 'completed' : 'active';
  }

  private async saveTask(task: Task): Promise<void> {
    const dir = this.getTaskDir(task);
    const filePath = path.join(this.tasksDir, dir, `${task.id}.json`);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(task, null, 2));
    } catch (error) {
      console.error(`Error saving task ${task.id}:`, error);
      throw error;
    }
  }

  private async moveTask(oldTask: Task, newTask: Task): Promise<void> {
    const oldDir = this.getTaskDir(oldTask);
    const newDir = this.getTaskDir(newTask);

    if (oldDir !== newDir) {
      const oldPath = path.join(this.tasksDir, oldDir, `${oldTask.id}.json`);
      
      try {
        await fs.unlink(oldPath);
      } catch (error) {
        console.error(`Error removing old task file:`, error);
      }
    }

    await this.saveTask(newTask);
  }

  private async loadTaskFromDir(dir: string, id: string): Promise<Task | null> {
    try {
      const filePath = path.join(this.tasksDir, dir, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const task = JSON.parse(content) as Task;
      
      task.createdAt = new Date(task.createdAt);
      task.updatedAt = new Date(task.updatedAt);
      
      if (task.dueDate) {
        task.dueDate = new Date(task.dueDate);
      }
      
      return task;
    } catch (error) {
      return null;
    }
  }

  private async loadTasksFromDir(dir: string): Promise<Task[]> {
    try {
      const dirPath = path.join(this.tasksDir, dir);
      const files = await fs.readdir(dirPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const tasks: Task[] = [];
      for (const file of jsonFiles) {
        const id = path.basename(file, '.json');
        const task = await this.loadTaskFromDir(dir, id);
        if (task) {
          tasks.push(task);
        }
      }

      return tasks;
    } catch (error) {
      return [];
    }
  }
}