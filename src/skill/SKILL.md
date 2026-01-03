# opencode-mem Memory Search

Automatically search your coding history using natural language queries.

## Description

The opencode-mem memory search skill helps you find relevant information from your past coding sessions. It searches compressed memories stored by claude-mem and returns relevant context.

## Capabilities

- **Natural Language Search**: Search using plain English queries
- **Type-Based Filtering**: Filter by tool type (bash, code, file, web, grep)
- **Context Retrieval**: Get compressed context for your project
- **Token Efficiency**: ~10x more efficient than storing full outputs

## Usage

### Basic Search

Simply ask a question about your past work:

- "What did we do yesterday?"
- "Show me all bash commands we used"
- "What files did we modify for the login feature?"
- "Find code related to authentication"

The skill will automatically search your memories and return relevant results.

### Type Filtering

You can filter results by tool type:

- "Show me only bash commands"
- "What file operations did we do?"
- "Find web fetches related to API"
- "Show code-related observations"

### Timeline Context

Get context from a specific timeframe:

- "Give me context from the last session"
- "What was the context before we added OAuth?"
- "Show me the last 3 sessions about authentication"

## Examples

### Searching for Feature Work

**User**: "What did we do for the authentication feature?"

**Skill**: Searches memories for "authentication", returns:
- Created AuthContext.ts
- Added login route to router
- Implemented JWT token validation
- Updated user model with password hashing

### Finding Commands

**User**: "How did we set up the database?"

**Skill**: Searches for "database setup", returns bash commands:
- `npm install prisma @prisma/client`
- `npx prisma init`
- `npx prisma migrate dev`
- `npm install pg`

### Context Retrieval

**User**: "What's the context for this project?"

**Skill**: Gets project context, returns compressed memories from current project.

## How It Works

1. You ask a question
2. Skill analyzes the query
3. Searches compressed memories via claude-mem API
4. Returns relevant observations (tool usage, files modified, etc.)
5. Provides ~10x token efficiency vs. full context

## Prerequisites

- opencode-mem must be installed
- claude-mem worker must be running
- Memories must have been captured in previous sessions

## Error Handling

If the skill encounters errors:

- **Worker not available**: "Memory features are not available - start claude-mem worker"
- **No memories found**: "No memories match your search query"
- **Invalid query**: "Please provide a search query"

## Best Practices

1. **Be specific**: "authentication API" vs "stuff about auth"
2. **Use project context**: "In the user service, what did we do?"
3. **Filter by type**: "Show me bash commands for deployment"
4. **Check context first**: "What's the current project context?"

## Integration

The skill is automatically invoked when:
- You ask questions about past work
- You search for specific features or implementations
- You request context about a project

## Version

opencode-mem v1.0.0

## See Also

- [Search Operation](./operations/search.md) - Detailed search operations
- [Timeline Operation](./operations/timeline.md) - Timeline context operations
- [Workflow Operation](./operations/workflow.md) - 3-layer workflow pattern
