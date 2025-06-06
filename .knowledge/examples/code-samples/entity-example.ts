// エンティティの実装例

import { Entity } from '@/shared/base/Entity';
import { Result } from '@/shared/base/Result';
import { WorkspaceId } from '@/shared/value-objects/ids/WorkspaceId';
import { WorkspaceName } from '../value-objects/WorkspaceName';
import { WorkspaceSlug } from '../value-objects/WorkspaceSlug';
import { CreatedAt } from '@/shared/value-objects/datetime/CreatedAt';
import { UpdatedAt } from '@/shared/value-objects/datetime/UpdatedAt';

interface IWorkspaceProps {
  name: WorkspaceName;
  slug: WorkspaceSlug;
  settings?: Record<string, unknown>;
  createdAt?: CreatedAt;
  updatedAt?: UpdatedAt;
  deletedAt?: Date | null;
}

export class Workspace extends Entity<WorkspaceId> {
  private constructor(
    id: WorkspaceId,
    private props: IWorkspaceProps
  ) {
    super(id);
  }

  // ファクトリメソッド - 新規作成
  static create(props: {
    name: string;
    slug: string;
    settings?: Record<string, unknown>;
  }): Result<Workspace> {
    // 値オブジェクトの作成と検証
    const nameResult = WorkspaceName.create(props.name);
    if (nameResult.isFailure()) {
      return Result.fail<Workspace>(nameResult.getErrorValue());
    }

    const slugResult = WorkspaceSlug.create(props.slug);
    if (slugResult.isFailure()) {
      return Result.fail<Workspace>(slugResult.getErrorValue());
    }

    const workspace = new Workspace(
      WorkspaceId.create(),
      {
        name: nameResult.getValue(),
        slug: slugResult.getValue(),
        settings: props.settings || {},
        createdAt: CreatedAt.create(),
        updatedAt: UpdatedAt.create(),
        deletedAt: null
      }
    );

    return Result.ok<Workspace>(workspace);
  }

  // ファクトリメソッド - 既存データから復元
  static reconstitute(props: {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Result<Workspace> {
    const idResult = WorkspaceId.create(props.id);
    if (idResult.isFailure()) {
      return Result.fail<Workspace>(idResult.getErrorValue());
    }

    const nameResult = WorkspaceName.create(props.name);
    if (nameResult.isFailure()) {
      return Result.fail<Workspace>(nameResult.getErrorValue());
    }

    const slugResult = WorkspaceSlug.create(props.slug);
    if (slugResult.isFailure()) {
      return Result.fail<Workspace>(slugResult.getErrorValue());
    }

    const workspace = new Workspace(
      idResult.getValue(),
      {
        name: nameResult.getValue(),
        slug: slugResult.getValue(),
        settings: props.settings,
        createdAt: CreatedAt.create(props.createdAt),
        updatedAt: UpdatedAt.create(props.updatedAt),
        deletedAt: props.deletedAt
      }
    );

    return Result.ok<Workspace>(workspace);
  }

  // ビジネスロジック - 名前の更新
  updateName(name: string): Result<void> {
    const nameResult = WorkspaceName.create(name);
    if (nameResult.isFailure()) {
      return Result.fail<void>(nameResult.getErrorValue());
    }

    this.props.name = nameResult.getValue();
    this.props.updatedAt = UpdatedAt.create();
    
    return Result.ok<void>();
  }

  // ビジネスロジック - 設定の更新
  updateSettings(settings: Record<string, unknown>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.props.updatedAt = UpdatedAt.create();
  }

  // ビジネスロジック - 論理削除
  delete(): Result<void> {
    if (this.isDeleted()) {
      return Result.fail<void>('Workspace is already deleted');
    }

    this.props.deletedAt = new Date();
    this.props.updatedAt = UpdatedAt.create();
    
    return Result.ok<void>();
  }

  // ビジネスロジック - 削除の取り消し
  restore(): Result<void> {
    if (!this.isDeleted()) {
      return Result.fail<void>('Workspace is not deleted');
    }

    this.props.deletedAt = null;
    this.props.updatedAt = UpdatedAt.create();
    
    return Result.ok<void>();
  }

  // ゲッター
  get name(): WorkspaceName {
    return this.props.name;
  }

  get slug(): WorkspaceSlug {
    return this.props.slug;
  }

  get settings(): Record<string, unknown> {
    return { ...this.props.settings };
  }

  get createdAt(): Date {
    return this.props.createdAt!.value;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!.value;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // ヘルパーメソッド
  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  // シリアライズ
  toPersistence(): {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } {
    return {
      id: this.id.toString(),
      name: this.props.name.value,
      slug: this.props.slug.value,
      settings: this.props.settings || {},
      createdAt: this.props.createdAt!.value,
      updatedAt: this.props.updatedAt!.value,
      deletedAt: this.props.deletedAt
    };
  }
}