// リポジトリパターンの実装例

import { Workspace } from '../entities/Workspace';
import { WorkspaceId } from '@/shared/value-objects/ids/WorkspaceId';
import { WorkspaceSlug } from '../value-objects/WorkspaceSlug';
import { Result } from '@/shared/base/Result';
import { IWorkspaceRepository } from '../repositories/IWorkspaceRepository';

// インターフェース定義（ドメイン層）
export interface IWorkspaceRepository {
  findById(id: WorkspaceId): Promise<Workspace | null>;
  findBySlug(slug: WorkspaceSlug): Promise<Workspace | null>;
  findByUserId(userId: string): Promise<Workspace[]>;
  save(workspace: Workspace): Promise<void>;
  delete(id: WorkspaceId): Promise<void>;
}

// 実装（インフラストラクチャ層）
export class PostgresWorkspaceRepository implements IWorkspaceRepository {
  constructor(private db: any) {} // 実際にはPrismaClientなど

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    try {
      const data = await this.db.workspace.findUnique({
        where: { id: id.toString() }
      });

      if (!data) {
        return null;
      }

      const workspaceResult = Workspace.reconstitute({
        id: data.id,
        name: data.name,
        slug: data.slug,
        settings: data.settings,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt
      });

      if (workspaceResult.isFailure()) {
        throw new Error(`Failed to reconstitute workspace: ${workspaceResult.getErrorValue()}`);
      }

      return workspaceResult.getValue();
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async findBySlug(slug: WorkspaceSlug): Promise<Workspace | null> {
    try {
      const data = await this.db.workspace.findUnique({
        where: { 
          slug: slug.value,
          deletedAt: null
        }
      });

      if (!data) {
        return null;
      }

      const workspaceResult = Workspace.reconstitute({
        id: data.id,
        name: data.name,
        slug: data.slug,
        settings: data.settings,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt
      });

      if (workspaceResult.isFailure()) {
        throw new Error(`Failed to reconstitute workspace: ${workspaceResult.getErrorValue()}`);
      }

      return workspaceResult.getValue();
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async findByUserId(userId: string): Promise<Workspace[]> {
    try {
      const data = await this.db.workspace.findMany({
        where: {
          memberships: {
            some: {
              userId: userId,
              status: 'active'
            }
          },
          deletedAt: null
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      const workspaces: Workspace[] = [];

      for (const item of data) {
        const workspaceResult = Workspace.reconstitute({
          id: item.id,
          name: item.name,
          slug: item.slug,
          settings: item.settings,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt
        });

        if (workspaceResult.isSuccess()) {
          workspaces.push(workspaceResult.getValue());
        }
      }

      return workspaces;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async save(workspace: Workspace): Promise<void> {
    try {
      const data = workspace.toPersistence();

      await this.db.workspace.upsert({
        where: { id: data.id },
        update: {
          name: data.name,
          slug: data.slug,
          settings: data.settings,
          updatedAt: data.updatedAt,
          deletedAt: data.deletedAt
        },
        create: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          settings: data.settings,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          deletedAt: data.deletedAt
        }
      });
    } catch (error) {
      throw new Error(`Failed to save workspace: ${error.message}`);
    }
  }

  async delete(id: WorkspaceId): Promise<void> {
    try {
      await this.db.workspace.update({
        where: { id: id.toString() },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }
  }
}

// インメモリ実装（テスト用）
export class InMemoryWorkspaceRepository implements IWorkspaceRepository {
  private workspaces: Map<string, Workspace> = new Map();

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    return this.workspaces.get(id.toString()) || null;
  }

  async findBySlug(slug: WorkspaceSlug): Promise<Workspace | null> {
    for (const workspace of this.workspaces.values()) {
      if (workspace.slug.equals(slug) && !workspace.isDeleted()) {
        return workspace;
      }
    }
    return null;
  }

  async findByUserId(userId: string): Promise<Workspace[]> {
    // この実装では、メンバーシップは別で管理される想定
    return Array.from(this.workspaces.values())
      .filter(w => !w.isDeleted())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async save(workspace: Workspace): Promise<void> {
    this.workspaces.set(workspace.id.toString(), workspace);
  }

  async delete(id: WorkspaceId): Promise<void> {
    const workspace = this.workspaces.get(id.toString());
    if (workspace) {
      workspace.delete();
      this.workspaces.set(id.toString(), workspace);
    }
  }

  // テスト用ヘルパーメソッド
  clear(): void {
    this.workspaces.clear();
  }

  count(): number {
    return this.workspaces.size;
  }
}

// Unit of Workパターンの実装例
export interface IUnitOfWork {
  workspaceRepository: IWorkspaceRepository;
  userRepository: IUserRepository;
  membershipRepository: IMembershipRepository;
  
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export class PostgresUnitOfWork implements IUnitOfWork {
  private transaction: any;
  
  constructor(
    private db: any,
    public workspaceRepository: IWorkspaceRepository,
    public userRepository: IUserRepository,
    public membershipRepository: IMembershipRepository
  ) {}

  async beginTransaction(): Promise<void> {
    this.transaction = await this.db.$transaction.start();
  }

  async commit(): Promise<void> {
    if (!this.transaction) {
      throw new Error('No transaction started');
    }
    await this.transaction.commit();
    this.transaction = null;
  }

  async rollback(): Promise<void> {
    if (!this.transaction) {
      throw new Error('No transaction started');
    }
    await this.transaction.rollback();
    this.transaction = null;
  }
}

// 仕様パターンの実装例
export abstract class Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<T> extends Specification<T> {
  constructor(private spec: Specification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

// 仕様の実装例
export class ActiveWorkspaceSpecification extends Specification<Workspace> {
  isSatisfiedBy(workspace: Workspace): boolean {
    return !workspace.isDeleted();
  }
}

export class WorkspaceWithNameSpecification extends Specification<Workspace> {
  constructor(private namePattern: string) {
    super();
  }

  isSatisfiedBy(workspace: Workspace): boolean {
    return workspace.name.value.toLowerCase().includes(this.namePattern.toLowerCase());
  }
}