---
name: context-mode
description: Mandatory routing rules for Antigravity CLI. Invoke when exploring a codebase, reading files for analysis, listing context-mode tools, searching, parsing, counting, comparing, summarizing, fetching web content, or running data-heavy commands.
---

# context-mode v2 for Antigravity CLI

context-mode MCP tools are available in Antigravity as `mcp_context-mode_<tool>`.
Use these tools directly. Do not inspect cached schema files under
`~/.gemini/antigravity-cli/mcp/context-mode/*.json`, and do not run
`ctx_execute` just to discover tool names or schemas.

If Antigravity uses the generic MCP wrapper, call `call_mcp_tool` with:

- `ServerName`: `"context-mode"`
- `ToolName`: one of the tool names below
- `Arguments`: the JSON arguments for that tool

## Tool List (v2)

- `ctx_execute`: run JavaScript, TypeScript, Python, shell, or other code in a sandbox.
  Print only the final answer; large outputs stay inside the sandbox.
- `ctx_batch`: execute multiple commands and search queries in a single round-trip.
- `ctx_index`: store files, directories, or content in the local FTS5 knowledge base for fast search.
- `ctx_search`: search indexed content and captured session memory. Batch related queries.
- `ctx_resume`: retrieve preserved session context across compacting or restarts.
- `ctx_stats`: show context savings and current-session token statistics.
- `ctx_doctor`: diagnose context-mode runtime, hook health, and host compatibility.
- `ctx_upgrade`: manage upgrades and version transitions.
- `ctx_purge`: purge stored context-mode knowledge or indexes.

When the user asks "what context-mode tools are available", answer from this list.

## Usage Guidelines

- Think in code. For analyze/count/filter/compare/search/parse/transform tasks, write code with `ctx_execute` and print only the derived answer.
- Large outputs from shell commands or queries stay in the sandbox to protect the context window.
- Use `ctx_doctor` to verify your environment health.
