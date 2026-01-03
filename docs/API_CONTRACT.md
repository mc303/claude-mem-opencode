# claude-mem Worker API Contract

## Overview

This document defines the API contract between opencode-mem and claude-mem worker.

## Version Support

- **opencode-mem**: >= 1.0.0
- **claude-mem**: >= 1.0.0
- **Supported API Versions**: 1.0, 2.0

## Endpoints

### GET /api/health

**Purpose**: Check if worker is running and get version info

**Request**: None

**Response**:
```json
{
  "status": "ok" | "error",
  "version": "string (e.g., '2.3.1')",
  "apiVersion": "string (e.g., '2.0')"
}
```

**Success**: 200

### POST /api/sessions/init

**Purpose**: Initialize a new claude-mem session

**Request Body**:
```json
{
  "contentSessionId": "string (OpenCode session ULID)",
  "project": "string (project name)",
  "prompt": "string (initial prompt)"
}
```

**Response**:
```json
{
  "sessionDbId": "number (database ID)",
  "promptNumber": "number",
  "skipped": "boolean",
  "reason": "string (if skipped)"
}
```

**Success**: 200
**Error**: 400 (invalid input), 500 (server error)

### POST /api/observations/queue

**Purpose**: Queue a tool usage observation

**Request Body**:
```json
{
  "sessionDbId": "number",
  "promptNumber": "number",
  "toolName": "string",
  "toolInput": "any (JSON object)",
  "toolOutput": "string",
  "cwd": "string",
  "timestamp": "number (Unix ms)"
}
```

**Response**:
```json
{
  "queued": "boolean",
  "observationId": "number"
}
```

**Success**: 200
**Error**: 400 (invalid input), 404 (session not found), 500 (server error)

### POST /api/sessions/complete/:id

**Purpose**: Mark a session as complete and trigger compression

**Request**: URL parameter `id` (sessionDbId)

**Response**:
```json
{
  "success": "boolean",
  "compressed": "boolean"
}
```

**Success**: 200
**Error**: 404 (session not found), 500 (server error)

### GET /api/observations/context/:project

**Purpose**: Get compressed context for a project

**Request**: URL parameter `project` (project name)

**Response**:
```json
{
  "context": "string (compressed memory text)",
  "memories": "number (count)"
}
```

**Success**: 200
**Error**: 400 (invalid project), 500 (server error)

### GET /api/observations/search

**Purpose**: Search memories by query

**Request Query Parameters**:
- `query`: string (required)
- `type`: "all" | "code" | "file" | "web" | "bash" (default: "all")
- `limit`: number (optional, default: 10)

**Response**:
```json
{
  "results": [
    {
      "id": "number",
      "toolName": "string",
      "summary": "string",
      "timestamp": "number"
    }
  ],
  "total": "number"
}
```

**Success**: 200
**Error**: 400 (invalid query), 500 (server error)

## Schema Validation

See tests/integration/api-contract.test.ts for detailed schema validation tests.

## Breaking Changes

This section tracks breaking changes in claude-mem API versions.

### API 2.0 → 1.0

No breaking changes.

### Future Breaking Changes

Will be documented here when detected.

## Version Detection

opencode-mem automatically detects claude-mem version on startup and checks compatibility.

See src/integration/version-checker.ts for implementation.
