# Lead Distribution System - Implementation Analysis

## Overview
The lead distribution system is the **heart of the marketplace**. It automatically matches jobs posted by clients to eligible contractors based on category, location, and subscription tier.

---

## High-Level Flow

```
Client posts job
    ↓
Job created with status: OPEN
    ↓
Event enqueued to 'lead-distribution' queue
    ↓
Worker processes job:
  1. Fetch job details (category, city)
  2. Find eligible contractors
  3. Rank by rankingScore (top 50)
  4. Bucket by subscription tier
  5. Apply visibility delays based on tier
  6. Create Lead documents
  7. Schedule notifications
    ↓
Contractors see leads based on visibleFrom date
    ↓
Contractor marks "Contacted"
    ↓
Client picks winner → Lead status: WON
    ↓
Other leads marked: LOST
```

---

## Components to Build

### 1. **Lead Distribution Worker** (Background Job)
**File**: `backend/app/job/worker/leadDistribution.worker.js`

**Trigger**: When job is created with status OPEN
- Subscribe to 'lead-distribution' queue from BullMQ
- Process one job at a time

**Algorithm**:
```javascript
1. Fetch job with categoryId and cityId populated
2. Find eligible contractors:
   - Match cityId OR within serviceRadiusKm
   - Have matching categoryId in their categories
   - isAvailable: true
   - associated User.status: ACTIVE
   - badge !== NONE (at least email verified)
3. Sort by rankingScore descending
4. Take top 50 contractors
5. Bucket by currentPlanTier:
   - ELITE
   - GROWTH
   - STARTER
   - FREE
6. Set visibleFrom delays:
   - ELITE: now
   - GROWTH: now + 24h (from settings)
   - STARTER: now + 48h
   - FREE: now + 48h (capped at 5 contractors only)
7. Set expiresAt: visibleFrom + 7 days (from settings)
8. Batch insert all Lead documents
9. Enqueue 'lead-notification' jobs with delays
```

**Output**: Array of created Lead documents

---

### 2. **Lead Notification Scheduler**
**File**: `backend/app/job/worker/leadNotification.worker.js`

**Trigger**: Scheduled via 'lead-notification' queue with delay
- Delay = `visibleFrom - now`
- When delay expires, notification fires

**What it does**:
```javascript
1. Fetch the Lead and Job
2. Create Notification document for contractor
3. Enqueue email job to notify contractor
4. Optional: WhatsApp notification (later phase)
```

**Output**: Notification sent, Lead status might be updated to VIEWED

---

### 3. **Lead Expiry Job**
**File**: `backend/app/job/worker/leadExpiry.worker.js`

**Trigger**: Hourly cron job

**What it does**:
```javascript
1. Find all leads where:
   - expiresAt < now
   - status !== EXPIRED and status !== WON and status !== LOST
2. Update status to EXPIRED
3. Optional: send notification to contractor (lead expired)
```

---

### 4. **Job Expiry Job**
**File**: `backend/app/job/worker/jobExpiry.worker.js`

**Trigger**: Hourly cron job

**What it does**:
```javascript
1. Find all jobs where:
   - expiresAt < now
   - status: OPEN (no contractor assigned)
2. Update status to EXPIRED
3. Invalidate cache for this job
```

---

### 5. **Ranking Score Computation**
**File**: `backend/app/contractor/service/ranking.service.js`

**Triggers**:
- New review added
- Job marked completed
- Subscription tier changed
- Badge changed
- Nightly cron (recompute all)

**Algorithm**:
```
rankingScore = weighted sum of:
  - Tier score (ELITE=1.0, GROWTH=0.75, STARTER=0.5, FREE=0.25) × 30%
  - Rating score (avgRating / 5) × 25%
  - Jobs completed score (log10(1 + jobsCompleted) / log10(101)) × 15%
  - Response rate × 15%
  - Badge score (GOLD=1.0, SILVER=0.66, BRONZE=0.33, NONE=0) × 10%
  - Completeness score (profileCompleteness / 100) × 5%

Result: 0 to 1 (stored in contractorProfile.rankingScore)
```

---

## Database Changes Needed

### 1. Add to ContractorProfile model
```javascript
currentPlanTier: {
  type: String,
  enum: ['FREE', 'STARTER', 'GROWTH', 'ELITE'],
  default: 'FREE'
}
// Already exists, no change needed

// Already has rankingScore, no change needed
```

### 2. Create Notification model
**File**: `backend/app/notification/model/notification.model.js`

```javascript
{
  userId: ObjectId (ref: User),
  type: String (enum: NEW_LEAD, JOB_COMPLETED, etc.),
  title: String,
  message: String,
  data: Object (jobId, leadId, etc.),
  isRead: Boolean,
  readAt: Date,
  channels: {
    inApp: Boolean,
    email: Boolean,
    whatsapp: Boolean
  },
  timestamps
}
```

### 3. Ensure Job model has required fields
```javascript
// Already has:
- status (enum including OPEN, ASSIGNED, EXPIRED)
- expiresAt
- categoryId
- cityId
- clientId
```

### 4. Ensure Lead model has required fields
```javascript
// Already has:
- status (enum: NEW, VIEWED, CONTACTED, WON, LOST, EXPIRED)
- visibleFrom
- expiresAt
- contractorId
- jobId
```

---

## API Endpoints to Add

### For Frontend (Admin Panel) - Lead Management
```
GET    /admin/jobs/:jobId/leads
  Returns all leads for a specific job with contractor details
  
POST   /admin/jobs/:jobId/leads/create
  Manually create leads for a job (for testing/operations)
  Body: { contractorIds: [...] }
  
DELETE /admin/jobs/:jobId/leads/:leadId
  Remove a lead (rare operation)
```

### For Frontend (Contractor Dashboard) - Already exists
```
GET    /jobs/leads - Get my leads (with filters)
POST   /jobs/leads/:leadId/contact - Mark as contacted
```

---

## Implementation Order

### Phase 1: Core Infrastructure (1 day)
1. ✅ Create Notification model and service
2. ✅ Create ranking score computation service
3. ✅ Set up BullMQ worker infrastructure
4. ✅ Create Settings model for tunable values (already exists)

### Phase 2: Lead Distribution Worker (1 day)
1. ✅ Lead distribution queue handler
2. ✅ Eligibility filtering logic
3. ✅ Ranking and bucketing logic
4. ✅ Batch Lead creation
5. ✅ Test with manual job posts

### Phase 3: Notification & Expiry (1 day)
1. ✅ Lead notification scheduler
2. ✅ Lead expiry hourly job
3. ✅ Job expiry hourly job
4. ✅ Notification system integration

### Phase 4: Admin Panel (1 day)
1. ✅ Admin endpoints for lead management
2. ✅ Manual lead creation UI
3. ✅ Lead viewing and status updates

### Phase 5: Testing & Optimization (1 day)
1. ✅ End-to-end testing
2. ✅ Performance optimization
3. ✅ Cache invalidation verification

---

## Key Design Decisions

### Why Top 50 Contractors Only?
- Prevents system overload with massive distributions
- Ensures contractors are competing on quality (ranking)
- Protects quality of leads - contractors only see jobs suited to their tier

### Why Tier-Based Delays?
- Monetization: elite contractors get immediate access (premium feature)
- Fairness: free contractors still get leads, just delayed
- Platform sustainability: incentivizes upgrading

### Why Batch Lead Creation?
- Efficient database operation (1 insert instead of 50)
- Transactional: all-or-nothing
- Easier to rollback if something fails

### Why Separate Notification Queue?
- Notifications fire at scheduled time (not immediately)
- If contractor accepts a lead early, other scheduled notifications are canceled
- Prevents notification spam

---

## Settings Configuration

The `settings` document needs these fields:

```javascript
{
  lead: {
    defaultExpiryDays: 7,
    eliteVisibilityDelayHours: 0,
    growthVisibilityDelayHours: 24,
    starterVisibilityDelayHours: 48,
    freeVisibilityDelayHours: 48,
    freeContractorsCap: 5
  },
  ranking: {
    weights: {
      tier: 0.30,
      rating: 0.25,
      jobsCompleted: 0.15,
      responseRate: 0.15,
      badge: 0.10,
      completeness: 0.05
    }
  }
}
```

---

## Testing Strategy

### Manual Testing
1. Post a job as a client
2. Check MongoDB: leads created for matching contractors
3. Verify visibleFrom dates are correct for each tier
4. Login as contractor: leads visible if tier qualifies
5. Mark as contacted: status updates
6. As client: assign contractor, check other leads marked LOST

### Automated Testing
1. Unit tests for ranking score calculation
2. Integration tests for lead distribution algorithm
3. Queue processing tests with mock contractors

---

## Performance Considerations

### Database Indexes (Already planned in design)
```javascript
// Lead indexes
- contractorId, status, visibleFrom (for contractor dashboard)
- jobId (for job detail view)
- expiresAt, status (for expiry jobs)
- jobId, contractorId (unique constraint)

// Contractor indexes
- rankingScore descending (for sorting)
- cityId, badge (for matching)
```

### Redis Caching
```javascript
// Cache job details (TTL: 5 min)
v1:job:<jobId>

// Cache contractor profile (TTL: 5 min)
v1:contractor:profile:<slug>

// Cache settings (TTL: 5 min)
v1:settings
```

### Scaling Considerations
- Worker processes can be scaled separately (add more worker instances)
- Redis handles queue backlog
- MongoDB indexes handle large contractor/lead queries

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Massive lead distribution for viral job | Top 50 cap, batch processing |
| Duplicate leads created | Unique index on (jobId, contractorId) |
| Notifications sent to wrong contractors | Validation before sending |
| Performance degradation | Indexes, caching, worker scaling |
| Data loss on queue failure | BullMQ persistence (default), DB transactions |

---

## Success Criteria

✅ Leads created automatically when job posted
✅ Contractors see leads in their dashboard
✅ Tier-based visibility delays working
✅ Lead status transitions working correctly
✅ Expiry jobs cleaning up old leads
✅ Notifications delivered
✅ Ranking scores updated correctly
✅ Admin can manually manage leads if needed

---

## Next Steps

1. **Read this analysis** ✓
2. **Implement Phase 1**: Notification model, ranking service, BullMQ setup
3. **Implement Phase 2**: Lead distribution worker
4. **Implement Phase 3**: Notification and expiry jobs
5. **Implement Phase 4**: Admin APIs
6. **Test end-to-end**
