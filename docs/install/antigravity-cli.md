# Install context-mode v2 on Antigravity CLI

## Install

```sh
npm i -g context-mode
context-mode setup --agents antigravity-cli
```

Update:

```sh
context-mode upgrade
```

Check: `context-mode doctor`

Antigravity CLI (`agy`) runs with the official Context Mode v2 adapter. Setup configures the host hooks, MCP server and skills under `~/.gemini/config`.

With no terminal (a script or CI), add `--yes`: `context-mode setup --yes --agents antigravity-cli`.

Restart Antigravity CLI after setup.

On Windows the files are `%USERPROFILE%\.gemini\config\mcp_config.json`, `%USERPROFILE%\.gemini\config\hooks.json` and `%USERPROFILE%\.gemini\config\skills`.

To do the setup step by hand, run `context-mode setup --print antigravity-cli` and follow what it prints.

### As an Antigravity Plugin

You can also install Context Mode as a self-contained Antigravity plugin:
Place the plugin package in `~/.gemini/config/plugins/context-mode` (or your workspace's `.agents/plugins/context-mode`).

## What setup changes

- Adds the `context-mode` server to `~/.gemini/config/mcp_config.json` under `mcpServers`. Other servers stay.
- Merges the hooks into `~/.gemini/config/hooks.json` under `hooks` as matcher groups (`{matcher, hooks: [...]}`) for PreToolUse, PostToolUse and Stop.
- Writes the skills `/ctx-doctor`, `/ctx-stats` and `/ctx-upgrade` to `~/.gemini/config/skills/<name>/SKILL.md`.
- Effect: large shell, read, grep or webfetch calls are denied, and the reason names `ctx_execute` (deny + redirect).
- Backs up each file first. A failed step is rolled back byte for byte.

## Verify

```sh
context-mode doctor --agents antigravity-cli
```

Run `/ctx-doctor` in Antigravity.

## Remove

```sh
context-mode setup --remove --agents antigravity-cli
```

It puts each touched file back. To remove the package too, see [Uninstall](./README.md#uninstall).
