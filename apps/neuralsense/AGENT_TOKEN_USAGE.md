# Agent Teams Token Usage Estimates

The agent instruction files (`.claude/agent-*.md`) are context files loaded into
Claude Code sessions. They do not run automatically or consume tokens on their own.

---

## Per-Session Cost Breakdown

| Cost Component             | Tokens (input) | Notes                              |
|----------------------------|-----------------|------------------------------------|
| System prompt + CLAUDE.md  | ~8K             | Loaded every session               |
| Agent instruction file     | ~2-3K           | One of the 4 agent .md files       |
| File reads (per file)      | ~2-5K           | run_live_geometry.py is ~500 lines |
| Your messages + responses  | ~1-3K per turn  | Varies by complexity               |

## Typical Daily Scenarios

| What you're doing                     | Sessions | Turns/session | Tokens/day (approx) |
|---------------------------------------|----------|---------------|----------------------|
| **Nothing** (just running the system) | 0        | 0             | 0                    |
| **Quick question** ("what does X do") | 1        | 3-5           | ~30-50K              |
| **Tuning session** (adjust + test)    | 2-3      | 10-15 each    | ~100-200K            |
| **Heavy dev day** (new feature/debug) | 4-5      | 15-20 each    | ~300-500K            |
| **All 4 agents active** (rare)        | 4+       | 10+ each      | ~400-600K            |

## Summary

- **Most days:** 0-200K tokens (1-2 agents at most)
- **Heavy days:** 300-500K tokens
- **Agent file overhead:** ~2-3K tokens per session (negligible)
- **Agents cost nothing when idle** -- they are context files, not background processes

## Agent Sizes

| Agent File            | Size   | When Used                                  |
|-----------------------|--------|--------------------------------------------|
| agent-algorithm.md    | ~3K    | Tuning scoring, calibration pipeline       |
| agent-pi-fleet.md     | ~2K    | Pi setup, sniffer management               |
| agent-evaluation.md   | ~2.5K  | Accuracy testing, analyzing results        |
| agent-integration.md  | ~2.5K  | JSONL -> Supabase pipeline, schema changes |
