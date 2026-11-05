---
trigger: always_on
---

# context-mode v2 routing for Antigravity CLI

context-mode MCP tools are installed for this agy session. Use them when the
task analyzes, counts, filters, compares, searches, parses, transforms, fetches,
or otherwise processes data. Raw bytes should stay in the sandbox; only the
derived answer should enter the conversation.

## Core Rules

1. **Do not dump — derive**:
   Do NOT use `ctx_execute` to dump entire files or giant command outputs.
   Print only the specific value, matches, count, or known slice you need.
   The tool's stdout is saved in the sandbox; large dumps cost context window.

2. **Tool surface**:
   Antigravity CLI exposes context-mode tools as `mcp_context-mode_<tool>` or via `call_mcp_tool`:
   - `ServerName`: `"context-mode"` or `"context-mode_context-mode"`
   - `ToolName`: `"ctx_execute"`, `"ctx_batch"`, `"ctx_index"`, `"ctx_search"`, `"ctx_resume"`, `"ctx_stats"`, `"ctx_doctor"`, `"ctx_upgrade"`, `"ctx_purge"`

3. **Batching**:
   Use `ctx_batch` for multi-command repository reconnaissance. One batch replaces multiple shell/list/search calls.

4. **Diagnostics**:
   Run `ctx_doctor` to verify hook status, binary integrity, and environment health.
