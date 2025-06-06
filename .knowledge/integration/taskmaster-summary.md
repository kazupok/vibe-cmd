# MaterCMS Knowledge Summary for Task Master AI Integration

## Project Overview

### What is MaterCMS?
MaterCMS is a headless content management system that leverages Notion as its content backend. It provides a unified platform for managing and distributing content through modern APIs and SDKs.

### Vision & Mission
- **Vision**: "Democratization of content management" - Enable anyone to easily manage and distribute content without technical knowledge
- **Mission**: 
  1. Pursue simplicity - Liberation from complex CMS setup
  2. Provide flexibility - Content structure leveraging Notion's freedom
  3. Improve developer experience - Modern APIs and SDKs

### Key Features
1. **Notion Integration** - Secure internal integration, real-time sync, data transformation
2. **Content Delivery** - RESTful API, GraphQL API, Webhooks
3. **Developer Tools** - TypeScript SDK, CLI tools, Templates
4. **Management Features** - Workspace management, Access control, Usage management

## Technical Architecture

### Tech Stack
- **Backend**: Node.js, TypeScript, PostgreSQL
- **Frontend**: Next.js, React, Tailwind CSS
- **Infrastructure**: Docker, Kubernetes, AWS/GCP
- **Package Management**: Turborepo, pnpm

### Architecture Principles
- Domain-Driven Design (DDD)
- Microservices-oriented
- Event-driven architecture
- Result pattern for error handling
- Repository pattern for data access

### Key Technical Patterns
1. **Entity/Value Object pattern** - Clear domain modeling
2. **Factory methods** - create() for new instances, reconstitute() for existing data
3. **Result pattern** - Explicit error handling without exceptions
4. **Repository pattern** - Abstract data access layer
5. **Event-driven processing** - Asynchronous job processing

## Business Rules & Domain

### Core Business Rules
1. **Workspace Management**
   - Each organization can have multiple workspaces
   - Workspace names must be unique within organization
   - Workspace slugs must be globally unique
   - At least one Owner required per workspace

2. **Notion Integration**
   - Multiple integrations per workspace allowed
   - Internal integration approach (no OAuth)
   - Encrypted token storage
   - Minimum sync interval: 5 minutes

3. **API Management**
   - API keys issued per workspace
   - Rate limiting: 1000 req/hour default
   - Notion API: 3 req/sec limit
   - Permission-based access control

### Domain Terminology
- **Workspace**: Team work unit containing users and resources
- **Integration Token**: Authentication token for Notion API
- **Sync Job**: Task to fetch and transform Notion data
- **Data Trace**: Historical tracking of synced data
- **Membership**: User-workspace association with roles

## Development Process & Guidelines

### Branch Strategy
```
main
 └── develop
      ├── feature/issue-{number}-{description}
      ├── fix/issue-{number}-{description}
      └── chore/{description}
```

### Commit Convention
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Code Quality Standards
- Test coverage: 80%+ target
- TypeScript strict mode
- Biome for linting/formatting
- Comprehensive error handling
- Structured logging

### Security Requirements
- JWT for user authentication
- API Key for service authentication
- AES-256-GCM for data encryption
- Argon2 for password hashing
- TLS 1.3 for communication

## Performance & Optimization

### Performance Targets
- API response time: < 200ms (p95)
- Availability: 99.9%+
- Sync delay: < 5 minutes
- Initial page load: < 3 seconds

### Optimization Strategies
1. **Database**: Proper indexing, query optimization, connection pooling
2. **Caching**: Redis for session/cache, CDN for static assets
3. **Async Processing**: Job queues, batch processing
4. **API Optimization**: DataLoader for GraphQL, response compression

## External Constraints

### Notion API Limits
- Rate limit: 3 requests/second
- Page size: Max 100 items/request
- Property count: Recommended < 25
- Nesting level: Max 2 levels

### Infrastructure Limits
- PostgreSQL connections: 100 default
- Query timeout: 30 seconds
- Redis: Memory-dependent
- S3: 5TB max object size

### Compliance Requirements
- GDPR compliance for EU users
- Japanese privacy law compliance
- Data residency requirements
- Open source license compatibility

## Current Project Phase

### Phase 1: Foundation (Current)
- ✅ Basic Notion integration
- ✅ User/workspace management
- ✅ Basic API provision
- 🔄 SDK development

### Success Metrics (KPIs)
- Technical: Response time, availability, sync delay
- Business: Active workspaces, monthly API calls, SDK adoptions

## AI Development Support

### Available AI Prompts
1. **Code Generation** - Entity creation, value objects, repositories, API endpoints, tests
2. **Review Prompts** - Code review, DDD implementation, API design, security
3. **Testing Prompts** - Test case generation, test data, performance tests
4. **Debugging Support** - Error analysis, performance profiling

### Best Practices
1. **Error Handling** - Result pattern, custom error classes, structured logging
2. **Performance** - Database optimization, caching strategies, async processing
3. **Security** - Input validation, authentication/authorization, encryption
4. **Testing** - Unit tests, integration tests, E2E tests

## Summary for Task Master AI Integration

MaterCMS is a sophisticated, DDD-based headless CMS that integrates with Notion. The project follows strict architectural patterns, has comprehensive business rules, and emphasizes code quality and performance. 

For Task Master AI integration, the following aspects are particularly relevant:
1. Well-defined domain model and business rules
2. Clear development process and coding standards
3. Comprehensive testing and quality requirements
4. Performance and security constraints
5. Structured approach to error handling and logging

The project is currently in Phase 1 (Foundation) with basic features implemented and SDK development in progress. Task Master AI should help manage the complex development tasks while adhering to the established patterns and constraints.