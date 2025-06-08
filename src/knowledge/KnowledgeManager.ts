import * as path from 'node:path';
import * as fs from 'fs-extra';
import { glob } from 'glob';
import type { KnowledgeItem, VibeDocsConfig, VibeDocsCommand } from '../types';

export class KnowledgeManager {
  private knowledgeDir: string;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.knowledgeDir = path.join(projectRoot, '.knowledge');
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.knowledgeDir);
    await fs.ensureDir(path.join(this.knowledgeDir, 'items'));
    await fs.ensureDir(path.join(this.knowledgeDir, 'categories'));
  }

  async addKnowledge(
    knowledge: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<KnowledgeItem> {
    await this.initialize();

    const item: KnowledgeItem = {
      ...knowledge,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    const filePath = path.join(this.knowledgeDir, 'items', `${item.id}.json`);
    await fs.writeJson(filePath, item, { spaces: 2 });

    await this.updateCategoryIndex(item.category, item.id);
    await this.updateTagsIndex(item.tags, item.id);

    return item;
  }

  async updateKnowledge(
    id: string,
    updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt' | 'version'>>
  ): Promise<KnowledgeItem> {
    const item = await this.getKnowledge(id);
    if (!item) {
      throw new Error(`Knowledge item with id '${id}' not found.`);
    }

    const updatedItem: KnowledgeItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
      version: item.version + 1,
    };

    const filePath = path.join(this.knowledgeDir, 'items', `${id}.json`);
    await fs.writeJson(filePath, updatedItem, { spaces: 2 });

    if (updates.category && updates.category !== item.category) {
      await this.updateCategoryIndex(item.category, id, 'remove');
      await this.updateCategoryIndex(updates.category, id);
    }

    if (updates.tags) {
      await this.updateTagsIndex(item.tags, id, 'remove');
      await this.updateTagsIndex(updates.tags, id);
    }

    return updatedItem;
  }

  async getKnowledge(id: string): Promise<KnowledgeItem | null> {
    try {
      const filePath = path.join(this.knowledgeDir, 'items', `${id}.json`);
      if (await fs.pathExists(filePath)) {
        const item = (await fs.readJson(filePath)) as KnowledgeItem;
        item.createdAt = new Date(item.createdAt);
        item.updatedAt = new Date(item.updatedAt);
        return item;
      }
    } catch (error) {
      console.error(`Error reading knowledge item ${id}:`, error);
    }
    return null;
  }

  async deleteKnowledge(id: string): Promise<void> {
    const item = await this.getKnowledge(id);
    if (!item) {
      throw new Error(`Knowledge item with id '${id}' not found.`);
    }

    const filePath = path.join(this.knowledgeDir, 'items', `${id}.json`);
    await fs.remove(filePath);

    await this.updateCategoryIndex(item.category, id, 'remove');
    await this.updateTagsIndex(item.tags, id, 'remove');
  }

  async searchKnowledge(query: {
    text?: string;
    category?: string;
    tags?: string[];
    author?: string;
  }): Promise<KnowledgeItem[]> {
    const allItems = await this.getAllKnowledge();

    return allItems.filter((item) => {
      if (query.text) {
        const searchText = query.text.toLowerCase();
        const matchesText =
          item.title.toLowerCase().includes(searchText) ||
          item.content.toLowerCase().includes(searchText);
        if (!matchesText) return false;
      }

      if (query.category && item.category !== query.category) {
        return false;
      }

      if (query.tags && query.tags.length > 0) {
        const hasMatchingTag = query.tags.some((tag) => item.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      if (query.author && item.author !== query.author) {
        return false;
      }

      return true;
    });
  }

  async getAllKnowledge(): Promise<KnowledgeItem[]> {
    try {
      await this.initialize();
      const itemsDir = path.join(this.knowledgeDir, 'items');
      const files = await fs.readdir(itemsDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      const items: KnowledgeItem[] = [];
      for (const file of jsonFiles) {
        const id = path.basename(file, '.json');
        const item = await this.getKnowledge(id);
        if (item) {
          items.push(item);
        }
      }

      return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting all knowledge:', error);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const categoriesPath = path.join(this.knowledgeDir, 'categories', 'index.json');
      if (await fs.pathExists(categoriesPath)) {
        const categories = (await fs.readJson(categoriesPath)) as Record<string, string[]>;
        return Object.keys(categories);
      }
    } catch (error) {
      console.error('Error getting categories:', error);
    }
    return [];
  }

  async getTags(): Promise<string[]> {
    try {
      const tagsPath = path.join(this.knowledgeDir, 'tags', 'index.json');
      if (await fs.pathExists(tagsPath)) {
        const tags = (await fs.readJson(tagsPath)) as Record<string, string[]>;
        return Object.keys(tags);
      }
    } catch (error) {
      console.error('Error getting tags:', error);
    }
    return [];
  }

  async exportKnowledge(format: 'json' | 'markdown' = 'json'): Promise<string> {
    const allItems = await this.getAllKnowledge();

    if (format === 'json') {
      return JSON.stringify(allItems, null, 2);
    }

    let markdown = '# Knowledge Base\n\n';
    const categories = new Map<string, KnowledgeItem[]>();

    for (const item of allItems) {
      if (!categories.has(item.category)) {
        categories.set(item.category, []);
      }
      categories.get(item.category)?.push(item);
    }

    for (const [category, items] of categories) {
      markdown += `## ${category}\n\n`;
      for (const item of items) {
        markdown += `### ${item.title}\n\n`;
        markdown += `**Author:** ${item.author}\n`;
        markdown += `**Tags:** ${item.tags.join(', ')}\n`;
        markdown += `**Last Updated:** ${item.updatedAt.toISOString().split('T')[0]}\n\n`;
        markdown += `${item.content}\n\n---\n\n`;
      }
    }

    return markdown;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async updateCategoryIndex(
    category: string,
    itemId: string,
    action: 'add' | 'remove' = 'add'
  ): Promise<void> {
    const categoriesPath = path.join(this.knowledgeDir, 'categories', 'index.json');
    let categories: Record<string, string[]> = {};

    if (await fs.pathExists(categoriesPath)) {
      categories = await fs.readJson(categoriesPath);
    }

    if (action === 'add') {
      if (!categories[category]) {
        categories[category] = [];
      }
      if (!categories[category].includes(itemId)) {
        categories[category].push(itemId);
      }
    } else {
      if (categories[category]) {
        categories[category] = categories[category].filter((id) => id !== itemId);
        if (categories[category].length === 0) {
          delete categories[category];
        }
      }
    }

    await fs.ensureDir(path.dirname(categoriesPath));
    await fs.writeJson(categoriesPath, categories, { spaces: 2 });
  }

  private async updateTagsIndex(
    tags: string[],
    itemId: string,
    action: 'add' | 'remove' = 'add'
  ): Promise<void> {
    const tagsPath = path.join(this.knowledgeDir, 'tags', 'index.json');
    let tagsIndex: Record<string, string[]> = {};

    if (await fs.pathExists(tagsPath)) {
      tagsIndex = await fs.readJson(tagsPath);
    }

    for (const tag of tags) {
      if (action === 'add') {
        if (!tagsIndex[tag]) {
          tagsIndex[tag] = [];
        }
        if (!tagsIndex[tag].includes(itemId)) {
          tagsIndex[tag].push(itemId);
        }
      } else {
        if (tagsIndex[tag]) {
          tagsIndex[tag] = tagsIndex[tag].filter((id) => id !== itemId);
          if (tagsIndex[tag].length === 0) {
            delete tagsIndex[tag];
          }
        }
      }
    }

    await fs.ensureDir(path.dirname(tagsPath));
    await fs.writeJson(tagsPath, tagsIndex, { spaces: 2 });
  }

  async loadVibeDocsConfig(): Promise<VibeDocsConfig | null> {
    try {
      const configPath = path.join(this.projectRoot, 'vibe-docs.config.json');
      if (await fs.pathExists(configPath)) {
        return await fs.readJson(configPath);
      }
    } catch (error) {
      console.error('Error loading vibe-docs config:', error);
    }
    return null;
  }

  async getCommandDocs(commandName: string): Promise<string[]> {
    const config = await this.loadVibeDocsConfig();
    if (!config) {
      return [];
    }

    // 各コマンドの配列から指定されたコマンドを検索
    for (const commandGroup of config.commands) {
      if (commandGroup[commandName]) {
        const command = commandGroup[commandName];
        const allDocs = await this.expandGlobPatterns(command.docs);
        const ignoredDocs = command.ignoreDocs ? await this.expandGlobPatterns(command.ignoreDocs) : [];
        
        // ignoredDocsを除外
        return allDocs.filter(doc => !ignoredDocs.includes(doc));
      }
    }

    return [];
  }

  private async expandGlobPatterns(patterns: string[]): Promise<string[]> {
    const expandedFiles: string[] = [];

    for (const pattern of patterns) {
      const absolutePattern = path.resolve(this.projectRoot, pattern);
      try {
        const files = await glob(absolutePattern, { 
          nodir: true,
          absolute: false 
        });
        expandedFiles.push(...files.map(file => path.relative(this.projectRoot, file)));
      } catch (error) {
        console.error(`Error expanding glob pattern ${pattern}:`, error);
      }
    }

    return [...new Set(expandedFiles)]; // 重複除去
  }

  async readCommandDocuments(commandName: string): Promise<{ path: string; content: string }[]> {
    const docPaths = await this.getCommandDocs(commandName);
    const documents: { path: string; content: string }[] = [];

    for (const docPath of docPaths) {
      try {
        const absolutePath = path.resolve(this.projectRoot, docPath);
        if (await fs.pathExists(absolutePath)) {
          const content = await fs.readFile(absolutePath, 'utf-8');
          documents.push({ path: docPath, content });
        }
      } catch (error) {
        console.error(`Error reading document ${docPath}:`, error);
      }
    }

    return documents;
  }
}
