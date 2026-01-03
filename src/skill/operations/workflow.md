# Workflow Operation

3-layer workflow pattern for systematic memory retrieval.

## Description

The workflow operation implements a systematic 3-layer approach to memory retrieval. Each layer provides different context and filtering, helping you efficiently find relevant information from your coding history.

## 3 Layers

### Layer 1: Broad Overview
**Goal**: Get high-level context about your query

- Retrieves project context
- Shows recent sessions
- Provides timeline overview
- ~50 tokens of context

### Layer 2: Focused Search
**Goal**: Find specific memories related to your query

- Natural language search
- Type-based filtering
- Relevance-ranked results
- ~200 tokens of context

### Layer 3: Detailed Analysis
**Goal**: Drill into specific operations and context

- Detailed operation history
- File-by-file breakdown
- Timeline context around results
- ~500-1000 tokens of context

## When to Use Each Layer

| Situation | Recommended Layer |
|-----------|-------------------|
| "What did we do yesterday?" | Layer 1 (Overview) |
| "Find all bash commands for X" | Layer 2 (Focused) |
| "How exactly did we implement Y?" | Layer 3 (Detailed) |
| "What's the context for this project?" | Layer 1 (Overview) |
| "Show me file operations in session X" | Layer 3 (Detailed) |
| "Find code related to authentication" | Layer 2 (Focused) |

## Examples

### Example 1: Feature Implementation

**User Query**: "How did we implement authentication?"

**Layer 1 - Overview**:
```
Project Context: auth-project
Recent Sessions (last 3):
- Session 5 (2025-01-02): Added OAuth
- Session 4 (2025-01-02): Token validation
- Session 3 (2025-01-01): Login route

Summary: Implemented JWT-based authentication with OAuth support
(50 tokens)
```

**Layer 2 - Focused Search**:
```
Search Results for "authentication implementation":

1. Created AuthContext.ts (2025-01-02 09:00)
   - Implemented user context provider
   - Added token storage logic

2. Created login route (2025-01-02 10:30)
   - Added /api/auth/login endpoint
   - Implemented password verification

3. Added JWT middleware (2025-01-02 11:15)
   - Created token validation middleware
   - Added protected route handler

(200 tokens)
```

**Layer 3 - Detailed Analysis**:
```
Detailed Timeline for Authentication:

Session 3 (2025-01-01 09:00-12:00):
- 09:00 - Created auth directory
- 09:05 - Created AuthContext.ts (15 lines)
- 09:10 - Created login route (23 lines)
- 09:15 - Installed jsonwebtoken
- 09:20 - Updated user model
- 09:30 - Added password hashing
- 09:45 - Created register route
- 10:00 - Added authentication tests
- 11:00 - Fixed login bug
- 11:30 - Added error handling
- 11:45 - Documented API endpoints

Session 4 (2025-01-02 09:00-11:00):
- 09:00 - Added JWT validation
- 09:15 - Created middleware
- 09:30 - Updated routes with auth
- 09:45 - Added token refresh
- 10:00 - Implemented logout
- 10:30 - Added user session tracking

Session 5 (2025-01-02 14:00-16:00):
- 14:00 - Added OAuth dependency
- 14:15 - Created OAuth service
- 14:30 - Implemented Google OAuth
- 14:45 - Added OAuth callback
- 15:00 - Updated user model with OAuth fields
- 15:15 - Created OAuth controller
- 15:30 - Added OAuth tests
- 15:45 - Updated documentation
- 16:00 - Tested OAuth flow

(800 tokens)
```

### Example 2: Bug Investigation

**User Query**: "When did we modify user.ts?"

**Layer 1 - Overview**:
```
Recent User-related Activity:
- Session 7 (2025-01-03): Fixed user type
- Session 6 (2025-01-03): Added profile fields
- Session 5 (2025-01-02): OAuth integration

(50 tokens)
```

**Layer 2 - Focused Search**:
```
Search Results for "user.ts modification":

1. Modified user.ts (2025-01-03 10:00)
   - Added email field to User interface
   - Updated type definition

2. Modified user.ts (2025-01-03 14:00)
   - Fixed optional email field
   - Added profile picture URL

3. Modified user.ts (2025-01-02 11:00)
   - Added OAuth provider fields
   - Updated user schema

(150 tokens)
```

**Layer 3 - Detailed Analysis**:
```
Detailed Timeline for user.ts Modifications:

Session 5 (2025-01-02 11:00-11:30):
- 11:00 - Read user.ts (original: 20 lines)
- 11:05 - Added email field to interface
- 11:10 - Updated type to include OAuth
- 11:15 - Added profile picture URL
- 11:20 - Updated export
- 11:25 - Saved file

Session 6 (2025-01-03 10:00-10:45):
- 10:00 - Read user.ts (30 lines)
- 10:05 - Modified email to optional
- 10:10 - Added profile picture URL field
- 10:15 - Updated TypeScript types
- 10:20 - Added validation functions
- 10:25 - Updated user service
- 10:30 - Added profile upload
- 10:35 - Updated tests
- 10:40 - Fixed TypeScript errors
- 10:45 - Committed changes

Session 7 (2025-01-03 14:00-14:30):
- 14:00 - Read user.ts
- 14:05 - Fixed email validation
- 14:10 - Added profile picture size validation
- 14:15 - Updated error messages
- 14:20 - Updated documentation
- 14:25 - Ran tests
- 14:30 - Verified all tests passing

(600 tokens)
```

### Example 3: Setup Context

**User Query**: "What was the setup process for this project?"

**Layer 1 - Overview**:
```
Project Context: my-app
Setup Date: 2025-01-01

Initial Sessions:
- Session 1 (2025-01-01): Project initialization
- Session 2 (2025-01-01): Dependency installation
- Session 3 (2025-01-01): Database setup

(50 tokens)
```

**Layer 2 - Focused Search**:
```
Search Results for "project setup":

1. Created package.json (2025-01-01 09:00)
   - Initialized npm project
   - Added dependencies

2. Installed dependencies (2025-01-01 09:30)
   - Installed TypeScript
   - Installed Express
   - Installed Prisma

3. Database setup (2025-01-01 14:00)
   - Initialized Prisma
   - Created database schema
   - Ran migrations

(150 tokens)
```

**Layer 3 - Detailed Analysis**:
```
Detailed Setup Timeline:

Session 1 (2025-01-01 09:00-10:00):
- 09:00 - mkdir my-app
- 09:05 - cd my-app
- 09:10 - npm init -y
- 09:15 - npm install typescript @types/node
- 09:20 - npm install express
- 09:25 - npx tsc --init
- 09:30 - Created tsconfig.json
- 09:35 - Created src directory
- 09:40 - Created index.ts
- 09:45 - Added basic Express server
- 09:50 - Tested server startup
- 09:55 - Added .gitignore

Session 2 (2025-01-01 10:00-11:00):
- 10:00 - npm install -D eslint prettier
- 10:05 - Created .eslintrc.js
- 10:10 - Created .prettierrc
- 10:15 - Added lint scripts to package.json
- 10:20 - npm install -D @types/express
- 10:25 - Fixed TypeScript errors
- 10:30 - npm install dotenv
- 10:35 - Created .env.example
- 10:40 - Created .gitignore for .env
- 10:45 - Added environment variable loading
- 10:50 - Tested environment variables
- 10:55 - Committed initial setup

Session 3 (2025-01-01 14:00-15:30):
- 14:00 - npm install prisma @prisma/client
- 14:05 - npx prisma init
- 14:10 - Created schema.prisma
- 14:15 - Added User model
- 14:20 - Added Post model
- 14:25 - Added Comment model
- 14:30 - Updated schema with relations
- 14:35 - npx prisma migrate dev --name init
- 14:40 - Verified database tables created
- 14:45 - Created prisma/client.ts
- 14:50 - Added Prisma to index.ts
- 14:55 - Tested database connection
- 15:00 - Created seed script
- 15:05 - Populated database with test data
- 15:10 - Verified seed data
- 15:15 - Updated .env with DATABASE_URL
- 15:20 - Added database documentation
- 15:25 - Committed database setup
- 15:30 - Ran lint and fixed issues

(1000 tokens)
```

## Workflow Steps

### Step 1: Always Start with Layer 1

**Why**: Get context before diving deep
**How**: Ask for overview or timeline
**Benefit**: Avoids searching for wrong things

### Step 2: Use Layer 2 for Specific Questions

**Why**: Focused search is more efficient
**How**: Ask with keywords and type filters
**Benefit**: Gets relevant results without noise

### Step 3: Use Layer 3 for Deep Dive

**Why**: Detailed analysis shows exact steps
**How**: Ask for timeline or specific session
**Benefit**: Understand implementation details

## Decision Tree

```
User Query
    ↓
Is it about specific topic? (e.g., "authentication")
    ↓ YES → Layer 2 (Focused Search)
    ↓
Need more details?
    ↓ YES → Layer 3 (Detailed Analysis)
    ↓ NO → Done

Is it general context? (e.g., "what did we do?")
    ↓ YES → Layer 1 (Overview)
    ↓
Interested in specific area?
    ↓ YES → Layer 2 (Focused on that area)
    ↓
Need exact steps?
    ↓ YES → Layer 3 (Detailed)
    ↓ NO → Done
```

## Token Efficiency

| Layer | Context Size | Use Case |
|-------|---------------|-----------|
| Layer 1 | ~50 tokens | Quick overview, project context |
| Layer 2 | ~200 tokens | Focused search, finding specific info |
| Layer 3 | ~500-1000 tokens | Detailed analysis, understanding implementation |

**Total efficiency**: ~10x vs. full tool outputs

## Best Practices

1. **Start broad, go deep**
   - Layer 1: "What did we do on X?"
   - Layer 2: "Find all bash commands for X"
   - Layer 3: "Show me exact steps for X"

2. **Use type filters in Layer 2**
   - "Find all file operations"
   - "Show me bash commands"
   - "What grep searches did we do?"

3. **Combine layers**
   - Layer 1: Get project context
   - Layer 2: Search for specific topic
   - Layer 3: Drill into relevant sessions

4. **Limit Layer 3 when possible**
   - Use limit: 10 for quick review
   - Use specific session ID
   - Use project filter

## Performance

- **Layer 1**: < 50ms retrieval
- **Layer 2**: < 100ms search
- **Layer 3**: < 300ms detailed timeline
- **Total workflow**: < 500ms for all 3 layers

## Integration

The workflow operation automatically combines:
- [Timeline Operation](./timeline.md) for Layer 1 and 3
- [Search Operation](./search.md) for Layer 2

## API Reference

See [API_CONTRACT.md](../../../docs/API_CONTRACT.md) for full API specification.
