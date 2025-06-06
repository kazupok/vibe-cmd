// 統合テストパターンの実装例

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { app } from '../app';
import { CreateWorkspaceUseCase } from '../usecases/CreateWorkspaceUseCase';
import { PostgresWorkspaceRepository } from '../repositories/PostgresWorkspaceRepository';
import { PostgresMembershipRepository } from '../repositories/PostgresMembershipRepository';
import { RabbitMQEventBus } from '../infrastructure/RabbitMQEventBus';
import { testDbConnection } from './helpers/database';

// データベース統合テスト
describe('PostgresWorkspaceRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: PostgresWorkspaceRepository;

  beforeEach(async () => {
    // テスト用データベースに接続
    prisma = await testDbConnection.connect();
    
    // テストデータをクリーン
    await prisma.workspaceMembership.deleteMany();
    await prisma.workspace.deleteMany();
    
    repository = new PostgresWorkspaceRepository(prisma);
  });

  afterEach(async () => {
    await testDbConnection.disconnect();
  });

  describe('findBySlug', () => {
    it('should find workspace by slug', async () => {
      // Arrange
      const workspaceData = {
        id: 'workspace-123',
        name: 'Test Workspace',
        slug: 'test-workspace',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      await prisma.workspace.create({ data: workspaceData });

      // Act
      const slugResult = WorkspaceSlug.create('test-workspace');
      const workspace = await repository.findBySlug(slugResult.getValue());

      // Assert
      expect(workspace).toBeTruthy();
      expect(workspace!.name.value).toBe('Test Workspace');
      expect(workspace!.slug.value).toBe('test-workspace');
    });

    it('should not find deleted workspace', async () => {
      // Arrange
      const workspaceData = {
        id: 'workspace-123',
        name: 'Deleted Workspace',
        slug: 'deleted-workspace',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date() // 削除済み
      };

      await prisma.workspace.create({ data: workspaceData });

      // Act
      const slugResult = WorkspaceSlug.create('deleted-workspace');
      const workspace = await repository.findBySlug(slugResult.getValue());

      // Assert
      expect(workspace).toBeNull();
    });
  });

  describe('save', () => {
    it('should save new workspace', async () => {
      // Arrange
      const workspace = Workspace.create({
        name: 'New Workspace',
        slug: 'new-workspace',
        settings: { theme: 'dark' }
      }).getValue();

      // Act
      await repository.save(workspace);

      // Assert
      const saved = await prisma.workspace.findUnique({
        where: { id: workspace.id.toString() }
      });

      expect(saved).toBeTruthy();
      expect(saved!.name).toBe('New Workspace');
      expect(saved!.settings).toEqual({ theme: 'dark' });
    });

    it('should update existing workspace', async () => {
      // Arrange
      const workspace = Workspace.create({
        name: 'Original Name',
        slug: 'original-slug'
      }).getValue();

      await repository.save(workspace);

      // Act
      workspace.updateName('Updated Name');
      await repository.save(workspace);

      // Assert
      const updated = await prisma.workspace.findUnique({
        where: { id: workspace.id.toString() }
      });

      expect(updated!.name).toBe('Updated Name');
      expect(updated!.updatedAt).toBeAfter(updated!.createdAt);
    });
  });
});

// API統合テスト
describe('Workspace API Integration Tests', () => {
  let authToken: string;

  beforeEach(async () => {
    // テストユーザーでログイン
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  describe('POST /api/v1/workspaces', () => {
    it('should create workspace successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'API Test Workspace',
          slug: 'api-test-workspace'
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        data: {
          type: 'workspace',
          attributes: {
            name: 'API Test Workspace',
            slug: 'api-test-workspace'
          }
        }
      });
    });

    it('should return 422 for invalid data', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // 空の名前
          slug: 'test workspace' // 無効なslug
        });

      // Assert
      expect(response.status).toBe(422);
      expect(response.body.errors).toHaveLength(2);
      expect(response.body.errors[0].source.pointer).toContain('name');
      expect(response.body.errors[1].source.pointer).toContain('slug');
    });

    it('should return 401 without authentication', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/workspaces')
        .send({
          name: 'Test Workspace',
          slug: 'test-workspace'
        });

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/workspaces/:id', () => {
    let workspaceId: string;

    beforeEach(async () => {
      // テストワークスペースを作成
      const createResponse = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Get Test Workspace',
          slug: 'get-test-workspace'
        });

      workspaceId = createResponse.body.data.id;
    });

    it('should get workspace by id', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v1/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(workspaceId);
    });

    it('should return 404 for non-existent workspace', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/workspaces/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(404);
    });
  });
});

// メッセージング統合テスト
describe('Event Bus Integration Tests', () => {
  let eventBus: RabbitMQEventBus;
  let receivedEvents: any[] = [];

  beforeEach(async () => {
    eventBus = new RabbitMQEventBus({
      url: process.env.RABBITMQ_TEST_URL || 'amqp://localhost:5672'
    });

    await eventBus.connect();

    // イベントハンドラーを登録
    await eventBus.subscribe('workspace.created', async (event) => {
      receivedEvents.push(event);
    });
  });

  afterEach(async () => {
    await eventBus.disconnect();
    receivedEvents = [];
  });

  it('should publish and receive events', async () => {
    // Arrange
    const event = {
      eventType: 'workspace.created',
      aggregateId: 'workspace-123',
      eventData: {
        workspaceId: 'workspace-123',
        name: 'Test Workspace'
      },
      occurredAt: new Date()
    };

    // Act
    await eventBus.publish(event);

    // 非同期処理を待つ
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toMatchObject({
      eventType: 'workspace.created',
      aggregateId: 'workspace-123'
    });
  });
});

// End-to-End テスト
describe('Workspace Creation E2E Test', () => {
  it('should create workspace and send invitation emails', async () => {
    // Arrange
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@example.com',
        password: 'password123'
      });

    const authToken = loginResponse.body.data.token;

    // Act - ワークスペースを作成
    const createResponse = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Workspace',
        slug: 'e2e-test-workspace',
        initialMembers: [
          { email: 'member1@example.com', role: 'editor' },
          { email: 'member2@example.com', role: 'viewer' }
        ]
      });

    expect(createResponse.status).toBe(201);
    const workspaceId = createResponse.body.data.id;

    // Assert - メンバーシップが作成されたか確認
    const membersResponse = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(membersResponse.status).toBe(200);
    expect(membersResponse.body.data).toHaveLength(1); // Ownerのみ（招待はまだ承認されていない）

    // Assert - 招待が送信されたか確認
    const invitationsResponse = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/invitations`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(invitationsResponse.status).toBe(200);
    expect(invitationsResponse.body.data).toHaveLength(2);
  });
});

// テストヘルパー
export class IntegrationTestHelper {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createTestUser(data: {
    email: string;
    name: string;
    password: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: hashedPassword
      }
    });
  }

  async createTestWorkspace(data: {
    name: string;
    slug: string;
    ownerId: string;
  }) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        slug: data.slug,
        settings: {}
      }
    });

    await this.prisma.workspaceMembership.create({
      data: {
        workspaceId: workspace.id,
        userId: data.ownerId,
        role: 'owner',
        status: 'active'
      }
    });

    return workspace;
  }

  async cleanupTestData() {
    // 依存関係の順序で削除
    await this.prisma.apiUsage.deleteMany();
    await this.prisma.apiCredential.deleteMany();
    await this.prisma.notionDataTrace.deleteMany();
    await this.prisma.syncJob.deleteMany();
    await this.prisma.databaseConfiguration.deleteMany();
    await this.prisma.notionIntegration.deleteMany();
    await this.prisma.workspaceMembership.deleteMany();
    await this.prisma.workspace.deleteMany();
    await this.prisma.user.deleteMany();
  }
}

// データベーストランザクションテスト
describe('Transaction Rollback Tests', () => {
  it('should rollback on error', async () => {
    const prisma = new PrismaClient();
    const unitOfWork = new PostgresUnitOfWork(prisma);

    try {
      await unitOfWork.beginTransaction();

      // ワークスペースを作成
      const workspace = Workspace.create({
        name: 'Transaction Test',
        slug: 'transaction-test'
      }).getValue();

      await unitOfWork.workspaceRepository.save(workspace);

      // エラーを発生させる
      throw new Error('Simulated error');

      await unitOfWork.commit();
    } catch (error) {
      await unitOfWork.rollback();
    }

    // ワークスペースが作成されていないことを確認
    const count = await prisma.workspace.count({
      where: { slug: 'transaction-test' }
    });

    expect(count).toBe(0);
  });
});