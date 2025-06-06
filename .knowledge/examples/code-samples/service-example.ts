// ドメインサービスの実装例

import { Result } from '@/shared/base/Result';
import { Workspace } from '../entities/Workspace';
import { User } from '../entities/User';
import { WorkspaceMembership } from '../entities/WorkspaceMembership';
import { IWorkspaceRepository } from '../repositories/IWorkspaceRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { IWorkspaceMembershipRepository } from '../repositories/IWorkspaceMembershipRepository';
import { UserRole } from '../value-objects/UserRole';
import { Email } from '../value-objects/Email';
import { IEmailService } from '../services/IEmailService';
import { IEventBus } from '../services/IEventBus';

// ドメインサービス - ワークスペース作成
export class CreateWorkspaceService {
  constructor(
    private workspaceRepo: IWorkspaceRepository,
    private membershipRepo: IWorkspaceMembershipRepository,
    private eventBus: IEventBus
  ) {}

  async execute(params: {
    name: string;
    slug: string;
    creatorUserId: string;
  }): Promise<Result<Workspace>> {
    // ワークスペースの作成
    const workspaceResult = Workspace.create({
      name: params.name,
      slug: params.slug
    });

    if (workspaceResult.isFailure()) {
      return Result.fail<Workspace>(workspaceResult.getErrorValue());
    }

    const workspace = workspaceResult.getValue();

    // Slugの重複チェック
    const existingWorkspace = await this.workspaceRepo.findBySlug(workspace.slug);
    if (existingWorkspace) {
      return Result.fail<Workspace>('Workspace slug already exists');
    }

    // ワークスペースを保存
    await this.workspaceRepo.save(workspace);

    // 作成者をOwnerとして追加
    const membershipResult = WorkspaceMembership.create({
      workspaceId: workspace.id.toString(),
      userId: params.creatorUserId,
      role: UserRole.OWNER.value,
      status: 'active'
    });

    if (membershipResult.isSuccess()) {
      await this.membershipRepo.save(membershipResult.getValue());
    }

    // イベントを発行
    await this.eventBus.publish({
      eventType: 'workspace.created',
      aggregateId: workspace.id.toString(),
      eventData: {
        workspaceId: workspace.id.toString(),
        name: workspace.name.value,
        slug: workspace.slug.value,
        creatorUserId: params.creatorUserId
      },
      occurredAt: new Date()
    });

    return Result.ok<Workspace>(workspace);
  }
}

// ドメインサービス - メンバー招待
export class InviteMemberService {
  constructor(
    private userRepo: IUserRepository,
    private workspaceRepo: IWorkspaceRepository,
    private membershipRepo: IWorkspaceMembershipRepository,
    private emailService: IEmailService,
    private eventBus: IEventBus
  ) {}

  async execute(params: {
    workspaceId: string;
    inviterUserId: string;
    inviteeEmail: string;
    role: string;
  }): Promise<Result<void>> {
    // メールアドレスの検証
    const emailResult = Email.create(params.inviteeEmail);
    if (emailResult.isFailure()) {
      return Result.fail<void>(emailResult.getErrorValue());
    }

    // ロールの検証
    const roleResult = UserRole.create(params.role);
    if (roleResult.isFailure()) {
      return Result.fail<void>(roleResult.getErrorValue());
    }

    // 招待者の権限確認
    const inviterMembership = await this.membershipRepo.findByWorkspaceAndUser(
      params.workspaceId,
      params.inviterUserId
    );

    if (!inviterMembership || !inviterMembership.isActive()) {
      return Result.fail<void>('Inviter is not an active member of the workspace');
    }

    const inviterRole = UserRole.create(inviterMembership.role.value);
    const targetRole = roleResult.getValue();

    if (!inviterRole.getValue().canManageRole(targetRole)) {
      return Result.fail<void>('Insufficient permissions to invite with this role');
    }

    // 既存メンバーのチェック
    const inviteeUser = await this.userRepo.findByEmail(emailResult.getValue());
    if (inviteeUser) {
      const existingMembership = await this.membershipRepo.findByWorkspaceAndUser(
        params.workspaceId,
        inviteeUser.id.toString()
      );

      if (existingMembership && existingMembership.isActive()) {
        return Result.fail<void>('User is already a member of this workspace');
      }
    }

    // 招待トークンの生成
    const inviteToken = this.generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

    // 招待情報の保存
    const invitation = {
      workspaceId: params.workspaceId,
      inviterUserId: params.inviterUserId,
      inviteeEmail: params.inviteeEmail,
      role: params.role,
      token: inviteToken,
      expiresAt: expiresAt,
      status: 'pending'
    };

    // TODO: 招待をデータベースに保存

    // 招待メールの送信
    const workspace = await this.workspaceRepo.findById(params.workspaceId);
    const inviter = await this.userRepo.findById(params.inviterUserId);

    await this.emailService.sendInvitation({
      to: params.inviteeEmail,
      workspaceName: workspace!.name.value,
      inviterName: inviter!.name.value,
      inviteLink: `https://app.matercms.com/invite/${inviteToken}`,
      expiresAt: expiresAt
    });

    // イベントを発行
    await this.eventBus.publish({
      eventType: 'member.invited',
      aggregateId: params.workspaceId,
      eventData: {
        workspaceId: params.workspaceId,
        inviterUserId: params.inviterUserId,
        inviteeEmail: params.inviteeEmail,
        role: params.role
      },
      occurredAt: new Date()
    });

    return Result.ok<void>();
  }

  private generateInviteToken(): string {
    return Buffer.from(crypto.randomBytes(32)).toString('base64url');
  }
}

// アプリケーションサービス - 複数のドメインサービスを調整
export class WorkspaceApplicationService {
  constructor(
    private createWorkspaceService: CreateWorkspaceService,
    private inviteMemberService: InviteMemberService,
    private workspaceRepo: IWorkspaceRepository,
    private unitOfWork: IUnitOfWork
  ) {}

  async createWorkspaceWithInitialMembers(params: {
    name: string;
    slug: string;
    creatorUserId: string;
    initialMembers: Array<{
      email: string;
      role: string;
    }>;
  }): Promise<Result<{ workspaceId: string }>> {
    await this.unitOfWork.beginTransaction();

    try {
      // ワークスペースを作成
      const createResult = await this.createWorkspaceService.execute({
        name: params.name,
        slug: params.slug,
        creatorUserId: params.creatorUserId
      });

      if (createResult.isFailure()) {
        await this.unitOfWork.rollback();
        return Result.fail<{ workspaceId: string }>(createResult.getErrorValue());
      }

      const workspace = createResult.getValue();

      // 初期メンバーを招待
      for (const member of params.initialMembers) {
        const inviteResult = await this.inviteMemberService.execute({
          workspaceId: workspace.id.toString(),
          inviterUserId: params.creatorUserId,
          inviteeEmail: member.email,
          role: member.role
        });

        if (inviteResult.isFailure()) {
          // 招待の失敗は警告として扱い、処理を続行
          console.warn(`Failed to invite ${member.email}: ${inviteResult.getErrorValue()}`);
        }
      }

      await this.unitOfWork.commit();

      return Result.ok({ workspaceId: workspace.id.toString() });
    } catch (error) {
      await this.unitOfWork.rollback();
      return Result.fail<{ workspaceId: string }>(`Failed to create workspace: ${error.message}`);
    }
  }
}

// ポリシーサービス - 複雑なビジネスルールをカプセル化
export class WorkspaceDeletionPolicy {
  async canDelete(
    workspace: Workspace,
    requesterId: string,
    membershipRepo: IWorkspaceMembershipRepository
  ): Promise<Result<void>> {
    // 既に削除されている場合
    if (workspace.isDeleted()) {
      return Result.fail<void>('Workspace is already deleted');
    }

    // リクエスターの権限確認
    const membership = await membershipRepo.findByWorkspaceAndUser(
      workspace.id.toString(),
      requesterId
    );

    if (!membership || !membership.isActive()) {
      return Result.fail<void>('User is not a member of this workspace');
    }

    if (!membership.role.equals(UserRole.OWNER)) {
      return Result.fail<void>('Only owners can delete workspaces');
    }

    // アクティブな統合があるかチェック
    // TODO: 統合リポジトリから確認

    // 実行中の同期ジョブがあるかチェック
    // TODO: 同期ジョブリポジトリから確認

    return Result.ok<void>();
  }
}

// インターフェース定義
export interface IEmailService {
  sendInvitation(params: {
    to: string;
    workspaceName: string;
    inviterName: string;
    inviteLink: string;
    expiresAt: Date;
  }): Promise<void>;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}

interface DomainEvent {
  eventType: string;
  aggregateId: string;
  eventData: any;
  occurredAt: Date;
}