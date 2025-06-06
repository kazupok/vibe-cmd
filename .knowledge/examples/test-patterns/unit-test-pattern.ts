// ユニットテストパターンの実装例

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Workspace } from '../entities/Workspace';
import { WorkspaceName } from '../value-objects/WorkspaceName';
import { WorkspaceSlug } from '../value-objects/WorkspaceSlug';
import { Email } from '../value-objects/Email';
import { CreateWorkspaceService } from '../services/CreateWorkspaceService';
import { InMemoryWorkspaceRepository } from '../repositories/InMemoryWorkspaceRepository';
import { InMemoryMembershipRepository } from '../repositories/InMemoryMembershipRepository';
import { MockEventBus } from './mocks/MockEventBus';

// エンティティのテスト例
describe('Workspace Entity', () => {
  describe('create', () => {
    it('should create a valid workspace', () => {
      // Arrange
      const name = 'Test Workspace';
      const slug = 'test-workspace';

      // Act
      const result = Workspace.create({ name, slug });

      // Assert
      expect(result.isSuccess()).toBe(true);
      const workspace = result.getValue();
      expect(workspace.name.value).toBe(name);
      expect(workspace.slug.value).toBe(slug);
      expect(workspace.isDeleted()).toBe(false);
    });

    it('should fail with invalid name', () => {
      // Arrange
      const name = ''; // 空の名前
      const slug = 'test-workspace';

      // Act
      const result = Workspace.create({ name, slug });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getErrorValue()).toContain('name');
    });

    it('should fail with invalid slug', () => {
      // Arrange
      const name = 'Test Workspace';
      const slug = 'Test Workspace'; // 無効な文字を含む

      // Act
      const result = Workspace.create({ name, slug });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getErrorValue()).toContain('slug');
    });
  });

  describe('updateName', () => {
    let workspace: Workspace;

    beforeEach(() => {
      const result = Workspace.create({
        name: 'Original Name',
        slug: 'original-slug'
      });
      workspace = result.getValue();
    });

    it('should update name successfully', () => {
      // Arrange
      const newName = 'Updated Name';
      const originalUpdatedAt = workspace.updatedAt;

      // Act
      const result = workspace.updateName(newName);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(workspace.name.value).toBe(newName);
      expect(workspace.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should fail with invalid name', () => {
      // Act
      const result = workspace.updateName('');

      // Assert
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('delete and restore', () => {
    let workspace: Workspace;

    beforeEach(() => {
      const result = Workspace.create({
        name: 'Test Workspace',
        slug: 'test-workspace'
      });
      workspace = result.getValue();
    });

    it('should delete workspace', () => {
      // Act
      const result = workspace.delete();

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(workspace.isDeleted()).toBe(true);
      expect(workspace.deletedAt).not.toBeNull();
    });

    it('should not delete already deleted workspace', () => {
      // Arrange
      workspace.delete();

      // Act
      const result = workspace.delete();

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getErrorValue()).toContain('already deleted');
    });

    it('should restore deleted workspace', () => {
      // Arrange
      workspace.delete();

      // Act
      const result = workspace.restore();

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(workspace.isDeleted()).toBe(false);
      expect(workspace.deletedAt).toBeNull();
    });
  });
});

// 値オブジェクトのテスト例
describe('Email Value Object', () => {
  describe('create', () => {
    it.each([
      'user@example.com',
      'test.user@company.co.jp',
      'name+tag@subdomain.example.com'
    ])('should accept valid email: %s', (validEmail) => {
      // Act
      const result = Email.create(validEmail);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe(validEmail.toLowerCase());
    });

    it.each([
      '',
      'invalid',
      '@example.com',
      'user@',
      'user@.com',
      'user@example',
      'user space@example.com'
    ])('should reject invalid email: %s', (invalidEmail) => {
      // Act
      const result = Email.create(invalidEmail);

      // Assert
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('methods', () => {
    it('should extract domain', () => {
      // Arrange
      const email = Email.create('user@example.com').getValue();

      // Act & Assert
      expect(email.getDomain()).toBe('example.com');
    });

    it('should extract local part', () => {
      // Arrange
      const email = Email.create('user@example.com').getValue();

      // Act & Assert
      expect(email.getLocalPart()).toBe('user');
    });
  });
});

// ドメインサービスのテスト例
describe('CreateWorkspaceService', () => {
  let service: CreateWorkspaceService;
  let workspaceRepo: InMemoryWorkspaceRepository;
  let membershipRepo: InMemoryMembershipRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    workspaceRepo = new InMemoryWorkspaceRepository();
    membershipRepo = new InMemoryMembershipRepository();
    eventBus = new MockEventBus();
    service = new CreateWorkspaceService(workspaceRepo, membershipRepo, eventBus);
  });

  describe('execute', () => {
    it('should create workspace with owner membership', async () => {
      // Arrange
      const params = {
        name: 'New Workspace',
        slug: 'new-workspace',
        creatorUserId: 'user-123'
      };

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result.isSuccess()).toBe(true);
      
      const workspace = result.getValue();
      expect(workspace.name.value).toBe(params.name);
      expect(workspace.slug.value).toBe(params.slug);

      // ワークスペースが保存されたか確認
      const savedWorkspace = await workspaceRepo.findById(workspace.id);
      expect(savedWorkspace).toBeTruthy();

      // メンバーシップが作成されたか確認
      const membership = await membershipRepo.findByWorkspaceAndUser(
        workspace.id.toString(),
        params.creatorUserId
      );
      expect(membership).toBeTruthy();
      expect(membership!.role.value).toBe('owner');

      // イベントが発行されたか確認
      expect(eventBus.publishedEvents).toHaveLength(1);
      expect(eventBus.publishedEvents[0].eventType).toBe('workspace.created');
    });

    it('should fail when slug already exists', async () => {
      // Arrange
      const existingWorkspace = Workspace.create({
        name: 'Existing',
        slug: 'duplicate-slug'
      }).getValue();
      await workspaceRepo.save(existingWorkspace);

      const params = {
        name: 'New Workspace',
        slug: 'duplicate-slug',
        creatorUserId: 'user-123'
      };

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getErrorValue()).toContain('already exists');
      expect(workspaceRepo.count()).toBe(1); // 新しいワークスペースは作成されない
    });
  });
});

// モックオブジェクトの例
class MockEventBus {
  publishedEvents: any[] = [];

  async publish(event: any): Promise<void> {
    this.publishedEvents.push(event);
  }

  clear(): void {
    this.publishedEvents = [];
  }
}

// スパイとスタブの使用例
describe('Service with External Dependencies', () => {
  it('should send email when inviting member', async () => {
    // Arrange
    const emailService = {
      sendInvitation: vi.fn().mockResolvedValue(undefined)
    };

    const service = new InviteMemberService(
      userRepo,
      workspaceRepo,
      membershipRepo,
      emailService,
      eventBus
    );

    // Act
    await service.execute({
      workspaceId: 'workspace-123',
      inviterUserId: 'user-123',
      inviteeEmail: 'newuser@example.com',
      role: 'editor'
    });

    // Assert
    expect(emailService.sendInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'newuser@example.com',
        workspaceName: expect.any(String),
        inviterName: expect.any(String),
        inviteLink: expect.stringContaining('https://app.matercms.com/invite/'),
        expiresAt: expect.any(Date)
      })
    );
  });
});

// テストヘルパー関数
export class TestDataBuilder {
  static aWorkspace() {
    return {
      withName(name: string) {
        this._name = name;
        return this;
      },
      withSlug(slug: string) {
        this._slug = slug;
        return this;
      },
      build() {
        return Workspace.create({
          name: this._name || 'Test Workspace',
          slug: this._slug || 'test-workspace'
        }).getValue();
      },
      _name: '',
      _slug: ''
    };
  }

  static aUser() {
    return {
      withEmail(email: string) {
        this._email = email;
        return this;
      },
      withName(name: string) {
        this._name = name;
        return this;
      },
      build() {
        return User.create({
          email: this._email || 'user@example.com',
          name: this._name || 'Test User'
        }).getValue();
      },
      _email: '',
      _name: ''
    };
  }
}

// 使用例
describe('Using Test Data Builder', () => {
  it('should create workspace with custom data', () => {
    // Arrange
    const workspace = TestDataBuilder
      .aWorkspace()
      .withName('Custom Workspace')
      .withSlug('custom-slug')
      .build();

    // Assert
    expect(workspace.name.value).toBe('Custom Workspace');
    expect(workspace.slug.value).toBe('custom-slug');
  });
});