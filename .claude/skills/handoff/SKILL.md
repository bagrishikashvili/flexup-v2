---
name: handoff
description: Use when the user requests a handoff, when context is getting long, or before ending a work session. Creates a structured briefing file that lets a fresh Claude session continue the work without losing context.
---

# Handoff Skill

Write or update a handoff document so the next agent with fresh context can continue this work.

## Process

1. Review the current conversation and identify:
   - What was accomplished
   - Key decisions made and why
   - Current state (what works, what's broken)
   - Blockers encountered
   - Immediate next steps

2. Write the handoff as plain prose (no bullet points, no markdown headers within sections). Five sections:
   - **Goal** — what we are trying to do
   - **Accomplished** — what is done and verified
   - **Current state** — what works, what doesn't, with file paths and line numbers
   - **Blockers / failed approaches** — what was tried and didn't work, so the next session doesn't repeat it
   - **Next steps** — the specific next action, named concretely

3. Do NOT invent content. If a section has nothing real to put in it, say so explicitly.

4. Save as `HANDOFF.md` in the project root (or `docs/handoffs/HANDOFF_[TOPIC]_[MM_DD].md` if that directory exists).

5. Tell the user the file path so they can start a fresh conversation by pasting it at the top.