# Timeline Operation

Get compressed context from a specific timeframe or session.

## Description

The timeline operation retrieves compressed memories from specific sessions or time ranges. This helps you understand the context of when and how features were implemented.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| timeframe | string | No | Time range: `last-session`, `last-hour`, `last-day`, `last-week`, `all` |
| sessionId | string | No | Specific session ID (ULID) |
| project | string | No | Project name to filter by |
| limit | number | No | Maximum number of memories to return (default: 20) |

## Timeframe Options

- `last-session` - Memories from most recent session
- `last-hour` - Memories from last hour
- `last-day` - Memories from last 24 hours
- `last-week` - Memories from last 7 days
- `all` - All memories (use with project filter)

## Examples

### Get Last Session Context

**Query**: "What did we do in the last session?"

**Operation**: timeframe: `last-session`

**Returns**:
```
Session Context: 2025-01-02 14:30 - 15:45

Found 12 memories:

1. bash - Created new feature branch
   git checkout -b feature/user-auth
   Timestamp: 2025-01-02T14:30:00Z

2. file - Created auth directory
   mkdir src/auth
   Timestamp: 2025-01-02T14:31:00Z

3. read - Examined existing auth utilities
   Reviewed AuthContext.ts from shared package
   Timestamp: 2025-01-02T14:35:00Z

4. bash - Installed dependencies
   npm install jsonwebtoken bcrypt
   Timestamp: 2025-01-02T14:40:00Z

5. code - Implemented login function
   Created login handler with JWT generation
   Timestamp: 2025-01-02T14:45:00Z

... (7 more memories)
```

### Get Last Day Context

**Query**: "What did we work on yesterday?"

**Operation**: timeframe: `last-day`

**Returns**:
```
Context from Last 24 Hours (2025-01-01 - 2025-01-02)

Found 45 memories:

[Shows all memories grouped by session]
Session 1 (2025-01-01 10:00 - 12:00): 15 memories
Session 2 (2025-01-01 14:00 - 16:00): 20 memories
Session 3 (2025-01-02 09:00 - 11:00): 10 memories
```

### Get Specific Session Context

**Query**: "What was the context for session 01HABC123...?"

**Operation**: sessionId: `01HABC123DEF456GHI789`

**Returns**:
```
Session: 01HABC123DEF456GHI789
Time: 2025-01-02 09:00 - 10:30
Project: auth-project

Found 18 memories:

1. bash - Created feature branch
   ...
2. file - Modified user routes
   ...
... (16 more memories)
```

### Get Project Timeline

**Query**: "Show me timeline for authentication project"

**Operation**: project: `auth-project`, timeframe: `all`

**Returns**:
```
Project Timeline: auth-project

Found 120 memories across 8 sessions:

[Chronological timeline]
2025-01-01 10:00-12:00 (Session 1): Setup project structure
2025-01-01 14:00-16:00 (Session 2): Implement login
2025-01-02 09:00-11:00 (Session 3): Add token validation
...
```

### Get Limited Context

**Query**: "Show me last 5 operations"

**Operation**: timeframe: `last-session`, limit: 5

**Returns**:
```
Last 5 Memories:

1. bash - Fixed login bug
   Timestamp: 2025-01-02T15:40:00Z

2. read - Reviewed error logs
   Timestamp: 2025-01-02T15:35:00Z

3. web - Fetched JWT documentation
   Timestamp: 2025-01-02T15:30:00Z

4. code - Updated error handling
   Timestamp: 2025-01-02T15:25:00Z

5. bash - Restarted server
   Timestamp: 2025-01-02T15:20:00Z
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
      "sessionId": "01HABC123DEF456GHI789",
      "projectId": "auth-project"
    }
  ],
  "total": 12,
  "timeframe": "last-session",
  "contextSummary": "Implemented user authentication with JWT tokens across 5 files"
}
```

### Context Grouped by Session

```json
{
  "grouped": [
    {
      "sessionId": "01HABC123DEF456GHI789",
      "startTime": 1704214200000,
      "endTime": 1704218100000,
      "memories": 12,
      "summary": "Implemented login and registration"
    }
  ],
  "totalSessions": 3,
  "totalMemories": 45
}
```

## Use Cases

### Use Case 1: Debugging

**Scenario**: You're debugging an issue and need to understand recent changes.

**Query**: "What did we do in the last hour?"

**Benefit**: Quickly see recent operations to identify what might have caused the issue.

### Use Case 2: Feature Documentation

**Scenario**: You need to document how a feature was implemented.

**Query**: "Show me timeline for authentication feature" + filter by project

**Benefit**: Get chronological view of implementation steps.

### Use Case 3: Context Recovery

**Scenario**: You lost context and need to catch up on a feature.

**Query**: "What was the context before we added OAuth?"

**Benefit**: Understand what was done before a specific change.

### Use Case 4: Session Review

**Scenario**: You want to review what was accomplished in a specific session.

**Query**: "Show me context for session [ID]"

**Benefit**: Detailed view of one session's work.

## Error Handling

| Error | Cause | Solution |
|-------|--------|----------|
| No memories found | Timeframe has no memories | Try different timeframe or check if memories exist |
| Invalid sessionId | Session ID not found | Verify session ID is correct |
| Invalid timeframe | Timeframe not recognized | Use: last-session, last-hour, last-day, last-week, all |
| Worker not available | claude-mem worker not running | Start worker: `claude-mem worker start` |

## Best Practices

1. **Start broad, then narrow**
   - First: "What did we work on yesterday?" (last-day)
   - Then: "Show me last session" (last-session)
   - Finally: Specific session ID

2. **Use project filters**
   - Combine with project: "Show me timeline for auth-project"
   - Reduces noise from other projects

3. **Limit for quick overviews**
   - Use limit: 10 for quick summary
   - Remove limit for full context

4. **Combine with search**
   - First get timeline: "What's the context for last session?"
   - Then search: "Find all bash commands in that session"

## Performance

- **Memory retrieval**: < 200ms for typical timeframes
- **Session grouping**: < 500ms for multiple sessions
- **Token efficiency**: ~10x vs. full session context

## Integration with Search

Timeline and search operations complement each other:

1. **Timeline** gives chronological context
2. **Search** finds specific information

**Example workflow**:
1. Get timeline: "What did we work on yesterday?"
2. Identify relevant sessions
3. Search within sessions: "Find all database operations from those sessions"

## API Reference

See [API_CONTRACT.md](../../../docs/API_CONTRACT.md) for full API specification.
