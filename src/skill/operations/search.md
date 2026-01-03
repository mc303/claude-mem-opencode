# Search Operation

Search compressed memories using natural language queries.

## Description

The search operation allows you to query your coding history stored in claude-mem. It returns compressed memories relevant to your query, providing ~10x token efficiency compared to storing full tool outputs.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| query | string | Yes | Natural language search query |
| type | string | No | Filter by tool type: `all`, `bash`, `code`, `file`, `web`, `grep` (default: `all`) |
| limit | number | No | Maximum number of results (default: 10) |

## Type Filters

- `all` - All tool types
- `bash` - Bash command executions
- `code` - Code-related operations
- `file` - File read/write operations
- `web` - Web fetch operations
- `grep` - Grep/search operations

## Examples

### Basic Search

**Query**: "authentication"

**Returns**:
```
Found 5 memories:

1. bash - Created AuthContext.ts
   Implemented JWT authentication with user context
   Timestamp: 2025-01-02T10:30:00Z

2. read - Updated auth.ts
   Modified authentication logic to include token validation
   Timestamp: 2025-01-02T11:15:00Z

3. bash - npm install jsonwebtoken
   Installed JWT library for authentication
   Timestamp: 2025-01-02T10:25:00Z
```

### Type-Filtered Search

**Query**: "setup database" (type: `bash`)

**Returns**:
```
Found 3 bash memories:

1. npm install prisma @prisma/client
   Installed Prisma ORM and client
   Timestamp: 2025-01-01T15:20:00Z

2. npx prisma init
   Initialized Prisma configuration
   Timestamp: 2025-01-01T15:25:00Z

3. npx prisma migrate dev
   Ran database migrations
   Timestamp: 2025-01-01T16:00:00Z
```

### Limited Search

**Query**: "API" (limit: 3)

**Returns**:
```
Found 15 memories (showing 3):

1. code - Created API routes
   Implemented REST API endpoints for user management
   Timestamp: 2025-01-02T09:00:00Z

2. web - Fetched API docs
   Retrieved external API documentation for reference
   Timestamp: 2025-01-02T09:30:00Z

3. file - Updated API types
   Modified TypeScript types for API responses
   Timestamp: 2025-01-02T10:00:00Z
```

## Response Format

### Successful Response

```json
{
  "results": [
    {
      "id": 123,
      "toolName": "bash",
      "summary": "Created AuthContext.ts with JWT implementation",
      "timestamp": 1704214200000,
      "projectId": "auth-project"
    }
  ],
  "total": 15,
  "query": "authentication",
  "type": "all"
}
```

### Empty Results

```json
{
  "results": [],
  "total": 0,
  "query": "nonexistent-unique-term-xyz123",
  "type": "all"
}
```

## Error Handling

| Error | Cause | Solution |
|-------|--------|----------|
| Worker not available | claude-mem worker not running | Start worker: `claude-mem worker start` |
| Invalid query | Query is empty or too long | Provide a valid search query |
| Invalid type | Type filter is not recognized | Use: all, bash, code, file, web, grep |

## Best Practices

1. **Use specific queries**
   - Good: "authentication JWT token validation"
   - Bad: "auth stuff"

2. **Leverage type filters**
   - "Show me bash commands for setup" → type: bash
   - "Find file operations for feature X" → type: file

3. **Limit results when relevant**
   - Use limit: 5 for quick overview
   - Use default for comprehensive results

4. **Combine with timeline context**
   - First get timeline: "What's the context for last session?"
   - Then search: "Show me authentication work from yesterday"

## Usage Patterns

### Pattern 1: Feature Exploration

1. Search: "What did we do for X feature?"
2. Review results
3. Drill down: "Show me bash commands for X"
4. Get details: "Find file operations in X"

### Pattern 2: Debugging Help

1. Search: "When did we modify Y file?"
2. Get context: "What was context before changing Y?"
3. Review changes: "Show me all operations around Y"

### Pattern 3: Setup Reference

1. Search: "How did we set up database?"
2. Get all bash commands: type: bash
3. Find configurations: "database configuration" type: file

## Performance

- **Search speed**: < 100ms for typical queries
- **Result size**: ~50 tokens per memory (compressed)
- **Efficiency**: ~10x vs. full tool outputs

## API Reference

See [API_CONTRACT.md](../../../docs/API_CONTRACT.md) for full API specification.
