# Integration Examples

This document provides practical examples of using the claude-mem OpenCode integration.

## Example 1: Basic Memory Search

**Scenario**: You want to find how you fixed a database bug last week.

### Using the Memory Search Skill

In an OpenCode session:

```
You: Search for database connection bug fixes from last week.

OpenCode (using claude-mem-memory skill):
I'll search your memory for database connection bug fixes.

[Searching...]
Found 3 relevant observations:

#156 - Fixed connection pool exhaustion (7 days ago)
#167 - Added connection retry logic (5 days ago)
#178 - Implemented connection timeout (3 days ago)

Let me get full details for #156 and #167.

[Fetching details...]
Here are the details:

## Observation #156
**Type**: bugfix
**Date**: 7 days ago
**Summary**: Fixed connection pool exhaustion by increasing pool size

### Implementation
Changed connection pool from 10 to 50 connections in `src/db/pool.ts`.

### Results
- Connection errors reduced by 90%
- Response time improved by 2x

## Observation #167
**Type**: bugfix
**Date**: 5 days ago
**Summary**: Added exponential backoff retry logic

### Implementation
Added retry with exponential backoff in `src/db/connection.ts`.

### Results
- Transient failures now recover automatically
- Maximum 3 retry attempts

Based on these fixes, I recommend:
1. Increase connection pool to 50
2. Add exponential backoff retry logic
3. Monitor connection metrics
```

## Example 2: Understanding Architecture Evolution

**Scenario**: You want to understand how the authentication system evolved.

### Using Timeline View

```
You: How has our authentication system changed over time?

OpenCode (using claude-mem-memory skill):
I'll search for authentication-related observations and show the timeline.

[Searching authentication...]
Found 12 relevant observations. Let me get timeline context around each.

[Building timeline...]
## Authentication Evolution Timeline

### Phase 1: Initial Implementation (2 months ago)
#101 - Added basic JWT authentication
- Simple token-based auth
- No refresh mechanism
- Fixed 1-hour token expiration

### Phase 2: First Improvement (1.5 months ago)
#105 - Added token refresh mechanism
- Implemented refresh tokens
- Reduced login frequency by 60%
- Fixed race conditions

### Phase 3: OAuth2 Integration (1 month ago)
#112 - Integrated OAuth2 providers
- Added Google, GitHub, Microsoft
- Unified auth flow
- Maintained backward compatibility

### Phase 4: Security Enhancements (3 weeks ago)
#124 - Added rate limiting and MFA
- Implemented per-IP rate limits
- Added optional 2FA
- Audited security headers

### Phase 5: Session Management (2 weeks ago)
#130 - Refactored to session-based auth
- Moved from JWT to sessions
- Added session revocation
- Improved logout handling

### Key Insights
1. **Progressive Enhancement**: System evolved from simple to sophisticated
2. **Security Focus**: Each phase improved security posture
3. **User Experience**: Reduced friction while maintaining security
4. **Backward Compatibility**: Maintained support for legacy clients

### Recommendations
1. Keep current session-based architecture
2. Monitor session lifetimes
3. Consider adding SSO support
```

## Example 3: Debugging with Historical Context

**Scenario**: You're debugging a new bug that seems similar to a past issue.

### Using Memory to Find Patterns

```
You: I'm getting "connection timeout" errors when querying the database. Has this happened before?

OpenCode (using claude-mem-memory skill):
Let me search for connection timeout issues in your memory.

[Searching connection timeout...]
Found 2 related observations:

#145 - Fixed connection timeout (1 month ago)
#150 - Added connection pool tuning (2 weeks ago)

Let me get the full context and timeline to understand the solution.

[Fetching details...]
## Previous Solutions

### Issue #145: Connection Timeout on Queries
**Root Cause**: Connection pool wasn't returning connections fast enough
**Solution**: Reduced connection pool from 100 to 20 connections
**Result**: Timeout errors eliminated

### Issue #150: Timeout Under High Load
**Root Cause**: Insufficient connections for concurrent queries
**Solution**: Increased connection pool to 50 with dynamic sizing
**Result**: Handled 10x load without timeouts

### Current Issue Analysis
Comparing your current error with past issues:

**Similarities**:
- Same error message: "connection timeout"
- Same database: PostgreSQL
- Same operation: SELECT queries

**Differences**:
- Your current connection pool: 30 (between the two past values)
- Your load level: Medium (based on request rate)

### Recommended Solution

Based on the historical solutions:
1. **Try pool size 20 first** (matches #145 solution)
2. **Monitor connection return rate**
3. **If timeouts persist, increase to 50** (matches #150 solution)
4. **Check query performance** - slow queries may appear as timeouts

### Implementation

```typescript
// src/db/pool.ts
import { Pool } from 'pg'

export const dbPool = new Pool({
  max: 20,  // Try 20 first
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

// Monitor pool metrics
setInterval(() => {
  console.log('Pool stats:', {
    totalCount: dbPool.totalCount,
    idleCount: dbPool.idleCount,
    waitingCount: dbPool.waitingCount,
  })
}, 60000)  // Every minute
```

## Example 4: Feature History Check

**Scenario**: Before implementing a new feature, check if it already exists.

### Using Memory to Avoid Duplication

```
You: I need to implement user profile image uploads. Has this been done before?

OpenCode (using claude-mem-memory skill):
Let me search for user profile features in your memory.

[Searching user profile...]
Found 8 relevant observations:

#201 - Added basic user profile CRUD (2 months ago)
#205 - Added profile image upload (1.5 months ago)
#208 - Added image resizing and compression (1 month ago)
#212 - Added image CDN integration (3 weeks ago)
#218 - Added image moderation (2 weeks ago)
#221 - Added album/gallery feature (1 week ago)
#225 - Added image analytics (4 days ago)
#228 - Fixed image upload bugs (2 days ago)

## Feature Already Exists!

User profile image uploads have been implemented with comprehensive features:

### Current Implementation
1. **Basic Upload** (Observation #205)
   - Support for JPG, PNG, GIF
   - Maximum size: 5MB
   - Automatic resizing to max 2000px

2. **Optimizations** (Observation #208)
   - Lazy loading
   - WebP conversion for supported browsers
   - Compression: 85% quality

3. **CDN Integration** (Observation #212)
   - Files uploaded to Cloudinary
   - Automatic CDN distribution
   - Global edge caching

4. **Moderation** (Observation #218)
   - Explicit content detection
   - AI-based moderation
   - Automated approval workflow

### Code Location
All profile image code is in:
- `src/features/profile/upload.tsx`
- `src/features/profile/gallery.tsx`
- `src/utils/image-processor.ts`
- `src/utils/cloudinary.ts`

### API Endpoints
- `POST /api/profile/image` - Upload image
- `GET /api/profile/images` - List images
- `DELETE /api/profile/image/:id` - Delete image
- `POST /api/profile/image/reorder` - Reorder in gallery

### Recommendations

**Don't reimplement** - Use existing code

**Instead**:
1. Extend the existing feature (e.g., add new image filters)
2. Improve performance (e.g., better compression)
3. Add new related features (e.g., image editing)

**Related files to review**:
```bash
# View the feature implementation
git show <commit-hash>:src/features/profile/

# Check the full history
git log --oneline --grep="profile image"
```
```

## Example 5: Cross-Project Learning

**Scenario**: You worked on a similar project and want to reuse solutions.

### Using Memory for Knowledge Transfer

```
You: How did we implement async job processing in the analytics project? I need something similar for our current project.

OpenCode (using claude-mem-memory skill):
Let me search for async job processing implementations.

[Searching async job...]
Found 3 relevant observations from multiple projects:

### Project: analytics (2 months ago)
#89 - Implemented BullMQ job queue
- Used Redis for backend
- Implemented retry policies
- Added job priority support

### Project: notifications (1.5 months ago)
#92 - Implemented worker-based jobs
- Used PostgreSQL LISTEN/NOTIFY
- Implemented job deduplication
- Added dead letter queue

### Project: payments (1 month ago)
#95 - Implemented background jobs with Bull
- Used Redis with job groups
- Added scheduled jobs
- Implemented job progress tracking

Let me get full details and timeline to understand the patterns.

[Fetching details...]
## Async Job Processing Patterns

### Pattern 1: Redis + Bull (analytics project)
**Pros**:
- Fast and scalable
- Built-in retry mechanism
- Job priority support
- Web UI for monitoring

**Implementation** (Observation #89):
```typescript
import Queue from 'bull'

const jobQueue = new Queue('jobs', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

await jobQueue.add('process-payment', paymentData, {
  priority: 10,  // Higher priority
  attempts: 5,  // More retries for payments
})
```

### Pattern 2: PostgreSQL LISTEN/NOTIFY (notifications project)
**Pros**:
- No additional infrastructure
- Transactional with main DB
- Strong consistency
- Built for simple use cases

**Implementation** (Observation #92):
```typescript
import { Pool } from 'pg'

// Listen for notifications
pool.on('notification', (msg) => {
  if (msg.channel === 'new_job') {
    processJob(msg.payload)
  }
})

// Add job with notification
async function addJob(payload: any) {
  const client = await pool.connect()
  await client.query('NOTIFY new_job, $1', [JSON.stringify(payload)])
  await client.release()
}
```

### Pattern 3: Bull with Job Groups (payments project)
**Pros**:
- Advanced features (groups, scheduling)
- Progress tracking
- Rate limiting
- Built-in concurrency control

**Implementation** (Observation #95):
```typescript
import Queue from 'bull'

const jobQueue = new Queue('jobs', { redis: process.env.REDIS_URL })

// Add to group
await jobQueue.add('batch-process', data, {
  group: {
    id: 'batch-' + Date.now(),
    limit: 100,  // Max 100 jobs in group
  },
})

// Process all jobs in group together
const processing = await jobQueue.getGroup('batch-12345')
processing.forEach(async (job) => {
  await processBatch(job.data)
})
```

## Recommendations for Current Project

Based on these three patterns, here's what I recommend for your use case:

### Choose Based on Requirements

1. **If you need scalability and UI** → Use Bull + Redis (Pattern 1)
2. **If you want simplicity and no extra infrastructure** → Use PostgreSQL LISTEN/NOTIFY (Pattern 2)
3. **If you need advanced features (groups, scheduling)** → Use Bull with Groups (Pattern 3)

### Suggested Implementation

```typescript
// src/jobs/queue.ts
import Queue from 'bull'

export const jobQueue = new Queue('app-jobs', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    removeOnComplete: 100,  // Keep last 100 jobs
    removeOnFail: 500,  // Keep failed jobs for debugging
  },
})

// Define job types
export const JOB_TYPES = {
  EMAIL: 'send-email',
  REPORT: 'generate-report',
  SYNC: 'sync-data',
} as const

// Helper function
export async function addJob(type: string, data: any, options?: any) {
  return await jobQueue.add(type, data, {
    jobId: `${type}-${Date.now()}`,
    ...options,
  })
}

// Usage example
await addJob(JOB_TYPES.EMAIL, {
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
}, {
  priority: 10,
  delay: 5000,  // Send after 5 seconds
})
```

### Infrastructure Needed
- Redis server (can use AWS ElastiCache, Redis Labs, or self-hosted)
- Or use existing Redis if you have one
- Bull Board UI for monitoring: `npm run board`

### Files from Past Projects to Reference
- `analytics/src/jobs/queue.ts` - Bull queue setup
- `notifications/src/jobs/listener.ts` - PostgreSQL NOTIFY
- `payments/src/jobs/groups.ts` - Bull groups

## Additional Resources

All the complete implementations are available in your memory. Let me get the exact commit references.

[Searching git references...]
- Observation #89: commit a1b2c3d (analytics repo)
- Observation #92: commit e4f5g6h (notifications repo)
- Observation #95: commit i7j8k9l (payments repo)

You can view the exact code:
```bash
git clone https://github.com/yourorg/analytics.git
cd analytics
git show a1b2c3d:src/jobs/queue.ts
```
```

## Example 6: Progressive Disclosure

**Scenario**: You want memory context but don't want to spend too many tokens.

### Using the 3-Layer Workflow

```
You: What work has been done on the payment system in the last month?

OpenCode (using claude-mem-memory skill):
I'll use the efficient 3-layer workflow to find payment-related work.

### Layer 1: Search (Compact Results)
search(query="payment system", limit=10, type=feature)

Returns 10 results (750 tokens total):
[
  {"id": 301, "summary": "Added Stripe integration", "tokens": 75},
  {"id": 302, "summary": "Added payment webhooks", "tokens": 85},
  {"id": 303, "summary": "Added refund processing", "tokens": 92},
  {"id": 304, "summary": "Added subscription management", "tokens": 78},
  {"id": 305, "summary": "Fixed payment timeout errors", "tokens": 81},
  {"id": 306, "summary": "Added payment analytics", "tokens": 89},
  {"id": 307, "summary": "Added multi-currency support", "tokens": 95},
  {"id": 308, "summary": "Added payment history export", "tokens": 88},
  {"id": 309, "summary": "Added payment notifications", "tokens": 86},
  {"id": 310, "summary": "Optimized payment queries", "tokens": 91},
]

### Layer 2: Review and Filter
I found 10 payment-related observations. Let me identify the most relevant ones for your current work.

Most relevant based on the query:
- #301: Stripe integration (core feature)
- #304: Subscription management (core feature)
- #305: Payment timeout fixes (related to current issues)
- #307: Multi-currency support (related to your current work)

### Layer 3: Fetch Details (Only for Relevant IDs)
get_observations(ids=[301, 304, 305, 307])

Returns 4 full observations (3,000 tokens total):
- #301: Complete Stripe integration (750 tokens)
- #304: Subscription management implementation (750 tokens)
- #305: Payment timeout error fixes (750 tokens)
- #307: Multi-currency support (750 tokens)

Total tokens used: 3,750 (vs 50,000 if fetching all)
**Token savings: ~92%**

### Optional: Timeline Context
Let me get timeline around the most relevant observation to understand the context.

timeline(session=42, observation=301, window=5)

Returns 11 observations (5 before, 1 target, 5 after) (500 tokens):
- #296: API design discussion (before)
- #297: Database schema design (before)
- #298: Payment gateway selection (before)
- #299: Stripe SDK integration (before)
- #300: Webhook endpoint creation (before)
- #301: Stripe integration (TARGET)
- #302: Payment webhooks (after)
- #303: Testing and validation (after)
- #304: Subscription management (after)
- #305: Error handling improvements (after)

### Final Presentation

## Payment System Work (Last Month)

### Core Features Implemented

#### 1. Stripe Integration (Observation #301)
**Files**: `src/payments/stripe.ts`, `src/api/payments/`
**Key Decisions**:
- Chose Stripe over PayPal (lower fees, better API)
- Used webhooks for async notifications
- Implemented idempotency for retry safety
**Lessons**: Always implement webhook signature verification

#### 2. Subscription Management (Observation #304)
**Files**: `src/payments/subscriptions.ts`, `src/api/subscriptions/`
**Key Decisions**:
- Used Stripe Billing API for recurring payments
- Implemented proration for plan changes
- Added grace period for failed payments
**Lessons**: Handle plan changes carefully (proration math is complex)

#### 3. Multi-Currency Support (Observation #307)
**Files**: `src/payments/currency.ts`, `src/utils/exchange-rates.ts`
**Key Decisions**:
- Store all amounts in cents (avoid float math)
- Use Stripe's automatic currency conversion
- Cache exchange rates (update hourly)
**Lessons**: Never store monetary values as floats

### Recent Fixes

#### Payment Timeout Errors (Observation #305)
**Problem**: Payment processing would timeout on large transactions
**Solution**: Increased timeout from 30s to 120s for payments, implemented retry with exponential backoff
**Result**: Timeout errors eliminated

### Development Context

The payment system was developed iteratively:
1. Started with basic integration (#301)
2. Added webhooks for async events (#302)
3. Built subscription management on top (#304)
4. Fixed issues as they arose (#305)
5. Extended with multi-currency (#307)

### Recommendations for Current Work

Based on this history, here are recommendations for your current payment-related work:

1. **Reuse existing patterns**:
   - Follow the webhook structure from #302
   - Use the proration logic from #304
   - Apply the timeout fixes from #305

2. **Follow established patterns**:
   - Store amounts in cents
   - Verify webhook signatures
   - Implement idempotency keys

3. **Consider these lessons**:
   - Proration is complex - test thoroughly
   - Exchange rates should be cached
   - Webhook retries need exponential backoff

### Code to Review
```bash
# Get the exact code from past implementations
git show <commit-from-#301>:src/payments/stripe.ts
git show <commit-from-#304>:src/payments/subscriptions.ts
git show <commit-from-#307>:src/payments/currency.ts
```

### Next Steps
1. Review the implementations above
2. Adapt patterns to your current requirements
3. Test thoroughly with Stripe test keys
4. Verify webhook delivery and signature validation
5. Check proration calculations edge cases
```

## Summary

These examples demonstrate:

1. **Efficient search** - Use Layer 1 (search) to get compact results
2. **Smart filtering** - Review and select only relevant observations
3. **Targeted fetching** - Use Layer 3 (get_observations) only on selected IDs
4. **Context understanding** - Use timeline to see what led to decisions
5. **Pattern recognition** - Identify and reuse successful approaches
6. **Avoid duplication** - Check memory before implementing features
7. **Token efficiency** - Achieve 10x+ savings by filtering before fetching

**Key Principle**: Always start with search (Layer 1), filter to identify what's relevant, then fetch details (Layer 3). Never fetch everything upfront!
