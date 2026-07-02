# Chatverse Backend - AI Coding Agent Instructions

## 🏗️ Architecture Overview

**Chatverse** is a Node.js/TypeScript backend for an AI chatbot platform with vector-enhanced responses. The system uses a **feature-based modular architecture** with clear separation of concerns.

### Core Components

- **Features**: Modular business domains (`agent`, `chat`, `source`, `user`, `vector`, `provider_model`)
- **Database**: PostgreSQL with Knex.js ORM, normalized schema with audit fields
- **AI Integration**: Multi-provider support (Anthropic, Google, Groq, OpenAI) via Vercel's AI SDK
- **Vector Search**: Pinecone for semantic search with user-agent namespace isolation
- **Authentication**: JWT-based with schema-level multi-tenancy
- **Background Jobs**: BullMQ/Redis for training and processing tasks

### Key Architectural Patterns

#### 1. Feature Module Structure

Each feature follows this consistent pattern:

```
features/[feature-name]/
├── [feature-name].controller.ts    # Request handlers
├── [feature-name].service.ts       # Business logic
├── [feature-name].route.ts         # Route definitions
├── [feature-name].dto.ts           # Data transfer objects
├── [feature-name].interface.ts     # TypeScript interfaces
├── [feature-name].schema.ts        # Database schema
└── [feature-name].yaml             # API documentation
```

#### 2. Database Design Patterns

- **Normalized Schema**: Separate tables for different source types (file_sources, text_sources, etc.)
- **Audit Fields**: `created_by`, `updated_by`, `created_at`, `updated_at` on all tables
- **Soft Deletes**: `is_deleted` boolean with `deleted_by`, `deleted_at` fields
- **Centralized Audit**: Main `sources` table contains audit info for performance

#### 3. Controller-Service Pattern

```typescript
// Controller: Handles HTTP requests/responses
class UserController {
  public userService = new UserService();

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: UserDto = req.body;
      const user = await this.userService.register(userData);
      const userResponse = { ...user };
      delete userResponse.password; // Remove sensitive data
      res.status(201).json({ data: userResponse, message: "Success" });
    } catch (error) {
      next(error);
    }
  };
}

// Service: Contains business logic and database operations
class UserService {
  public async register(data: UserDto): Promise<IUser> {
    const existingUser = await knex("users")
      .where({ email: data.email })
      .first();
    if (existingUser) throw new HttpException(409, "Email exists");

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [result] = await knex("users")
      .insert({ ...data, password: hashedPassword })
      .returning("*");
    return result;
  }
}
```

## 🔐 Authentication & Security

### JWT Authentication with Multi-Tenancy

- **Token Format**: `Authorization: Bearer <token> <schema>`
- **Schema Isolation**: Each request sets PostgreSQL search_path for tenant isolation
- **Exempt Routes**: `/users/register`, `/users/login`, `/health`, `/api-docs`

### Security Features

- **Password Encryption**: bcrypt with salt
- **API Key Storage**: Encrypted with individual salts in database
- **Rate Limiting**: Global middleware with configurable limits
- **Input Validation**: class-validator decorators on DTOs
- **SQL Injection Protection**: Parameterized queries via Knex.js

## 🤖 AI Integration Patterns

### Multi-Provider Architecture

```typescript
// src/features/provider_model/providers.ts
export const languageModels = {
  "groq-llama3-8b": groq("llama3-8b-8192"),
  "anthropic-claude-3": anthropic("claude-3-sonnet-20240229"),
  "openai-gpt-4": openai("gpt-4"),
  // ... more models
};
```

### Agent-Based Chat Flow

1. **Agent Validation**: Check if agent is active and belongs to user
2. **Session Management**: Create/get chat session with proper isolation
3. **Context Retrieval**: Search Pinecone vectors for relevant context
4. **AI Response**: Stream response using selected model and temperature
5. **Message Persistence**: Save both user and AI messages to database

### Vector Search Integration

- **Namespace Pattern**: `user_{userId}_agent_{agentId}` for isolation
- **Context Optimization**: Top 3 results with score > 0.15, max 2000 chars
- **Caching**: 2-minute cache for vector availability checks

## 📊 Database Patterns

### Transaction Management

```typescript
return await knex.transaction(async (trx) => {
  const [sourceResult] = await trx("sources")
    .insert(sourceData)
    .returning("id");
  await trx("database_sources").insert({
    source_id: sourceResult.id,
    ...databaseSpecificData,
  });
  return await this.getDatabaseSourceById(sourceResult.id);
});
```

### Query Optimization

- **Joins**: Use explicit joins instead of nested queries
- **Indexing**: Foreign keys and commonly filtered columns are indexed
- **Connection Pooling**: Min 1, max 5 connections configured

## 🔄 Development Workflow

### Build & Run Commands

```bash
npm run dev          # Development with nodemon
npm run build        # TypeScript compilation
npm start           # Production server
npm run lint        # ESLint checking
npm run test        # Jest test execution
```

### Database Operations

```bash
npm run migrate     # Run all migrations
npm run migrate:drop # Reset database
npm run seed        # Populate with test data
```

### Testing Approach

- **Integration Tests**: Full API flow testing via test scripts
- **Manual Testing**: Comprehensive test scripts in `/scripts/` directory
- **Environment**: Tests run against development database

## 📁 File Organization Conventions

### Source Types Hierarchy

```
sources (base table)
├── file_sources
├── text_sources
├── website_sources
├── database_sources
└── qa_sources
```

### Route Structure

- **Base Routes**: `/api/v1/sources` - CRUD operations
- **Specialized Routes**: `/api/v1/sources/database` - Type-specific operations
- **Agent-Scoped**: `/api/v1/sources/agent/:agentId` - Agent-specific queries

### Utility Organization

- **Database**: Connection, schema definitions, seeds
- **External Services**: Pinecone, Redis, AWS S3, email
- **Shared Logic**: JWT, validation, logging, file upload

## 🚀 Performance Optimizations

### Caching Strategies

- **Agent Data**: 5-minute in-memory cache for agent configurations
- **Vector Availability**: 2-minute cache for namespace existence checks
- **Session Data**: Database-backed with efficient queries

### Query Optimization

- **Pagination**: Implemented where large datasets expected
- **Selective Fields**: Only return necessary data in API responses
- **Batch Operations**: Use transactions for multi-table operations

### Background Processing

- **Training Jobs**: BullMQ queues for vector embedding generation
- **File Processing**: Asynchronous processing for uploads
- **Cleanup Tasks**: Periodic removal of old sessions/logs

## 🧪 Testing & Validation

### Test Script Patterns

```typescript
// scripts/test-chat-comprehensive.ts
async function testAgentChat() {
  // 1. Login and get token
  // 2. Create/select agent
  // 3. Send chat message
  // 4. Validate response structure
  // 5. Check database persistence
}
```

### Validation Rules

- **DTOs**: class-validator decorators for input validation
- **Environment**: envalid for required environment variables
- **Database**: Foreign key constraints and NOT NULL where appropriate

## 🔧 Common Development Tasks

### Adding a New Feature

1. Create feature directory structure
2. Define database schema with audit fields
3. Implement service layer with business logic
4. Create controller with error handling
5. Add routes with validation middleware
6. Update API documentation (YAML)
7. Add comprehensive test scripts

### Adding a New AI Provider

1. Add model configuration to `providers.ts`
2. Update provider_model schema if needed
3. Test integration with existing chat flow
4. Update API documentation

### Database Schema Changes

1. Create migration script in `/database/`
2. Update corresponding schema file
3. Test with `npm run migrate`
4. Update TypeScript interfaces
5. Run existing tests to ensure no breaking changes

## ⚠️ Critical Patterns to Follow

### Error Handling

```typescript
// Always use HttpException for API errors
throw new HttpException(400, "Validation failed");

// Never expose internal errors to clients
catch (error) {
  if (error instanceof HttpException) throw error;
  throw new HttpException(500, `Operation failed: ${error.message}`);
}
```

### Database Operations

- **Always use transactions** for multi-table operations
- **Include audit fields** in all inserts/updates
- **Use soft deletes** instead of hard deletes
- **Validate foreign keys** before operations

### Security Practices

- **Never log sensitive data** (passwords, API keys)
- **Validate all inputs** using DTOs
- **Use parameterized queries** (Knex.js handles this)
- **Encrypt sensitive data** at rest

### Performance Considerations

- **Cache frequently accessed data** (agents, configurations)
- **Use streaming** for large responses
- **Limit query result sets** appropriately
- **Monitor background job queues**

## 📚 Key Files to Reference

- `src/app.ts` - Main application setup and middleware
- `src/server.ts` - Server initialization and service connections
- `database/index.schema.ts` - Database connection and table references
- `src/features/chat/chat.service.ts` - AI chat implementation
- `src/features/vector/vector.service.ts` - Vector search operations
- `src/utils/pinecone.ts` - Pinecone client configuration
- `src/middlewares/auth.middleware.ts` - Authentication logic
- `src/middlewares/validation.middleware.ts` - Input validation

## 🎯 AI Agent Productivity Tips

1. **Start with existing patterns** - Copy from similar features rather than creating from scratch
2. **Use the test scripts** - They demonstrate complete API flows and expected behaviors
3. **Check database constraints** - Look at schema files for required fields and relationships
4. **Follow the audit pattern** - Include proper tracking fields in all database operations
5. **Test with real data** - Use the seed data and test scripts to validate implementations
6. **Monitor performance** - Consider caching and optimization from the start
7. **Keep security in mind** - Follow established patterns for authentication and data protection

This codebase emphasizes **maintainability**, **security**, and **performance** through consistent patterns and comprehensive error handling. When implementing new features, prioritize these aspects while following the established architectural conventions.
