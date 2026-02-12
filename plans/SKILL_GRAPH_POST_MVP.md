# Skill Graph Post-MVP Follow-Ups

## Implemented in MVP
- Per-user skill graph computed from user-owned tags and linked cards.
- Absolute + relative scores returned for each axis.
- Redis cache-aside read path with key `skillgraph:v1:user:{userId}`.
- Cache TTL set to 15 minutes.

## Deferred Items

### 1) Event-Driven Cache Invalidation
- Current behavior relies on TTL expiry.
- Add `DEL skillgraph:v1:user:{userId}` on:
  - Card create/update/delete.
  - Card review state changes (`status`, `last_reviewed`, `next_review`).
  - Tag add/remove/archive/unarchive.
  - Card-tag relation changes.

### 2) Global Relative Ranking (Multiplayer)
- Current `displayScore` is user-relative only.
- Add global ranking mode after enough users:
  - Percentile rank by axis against all users, or
  - `userAbsolute / bestAbsoluteForAxis * 100`.
- Keep `absoluteScore` unchanged to preserve continuity.

### 3) Better Cache Freshness Strategy
- Consider stale-while-revalidate:
  - Soft TTL: 5 minutes.
  - Hard TTL: 30 minutes.
- Return stale data immediately when soft expired and refresh in background.
- Add small TTL jitter to reduce synchronized cache misses.

### 4) Axis Selection Refinements
- Current MVP uses top-level user tags sorted by card volume.
- Consider:
  - Pin-aware axis ordering.
  - Stable axis set across sessions for visual consistency.
  - Minimum card threshold to avoid noisy axes.

### 5) Score Tuning and Explainability
- Validate weight choices with real user behavior.
- Add axis-level explainability payload in API:
  - Which factors moved score up/down.
  - Confidence and sample size details.

### 6) Operational Observability
- Add lightweight metrics:
  - Cache hit/miss rate.
  - Compute duration.
  - Axis count distribution.
- Add error tracking tags for compute/cache failures.

### 7) Security and Limits
- Add per-user request throttling for skill graph endpoint/server query if needed.
- Add payload size guardrails if user tag graph becomes large.
