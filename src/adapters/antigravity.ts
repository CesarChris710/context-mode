// src/adapters/antigravity.ts
// Official adapter for Google Antigravity CLI (`agy`) in Context Mode v2.
// Host contract: stdin carries camelCase JSON (protojson encoding: conversationId, toolCall: { name, args }).
// PreToolUse: supports decision "deny" with "reason", and argument "overwrite" (e.g. rewritten CommandLine).
// PostToolUse: expects empty JSON object {} on stdout.
// Native tools: run_command (Bash), read_file (Read), grep_search (Grep), web_fetch (WebFetch).
import type { CanonicalEventName, CanonicalHookEvent, Decision, HookOutput, ToolResultInfo } from "../core/contracts/types.ts";

export const TOOL_NAME_PREFIX = "mcp_context-mode_";

export const SHELL_TOOL_NAMES: readonly string[] = Object.freeze(["run_command"]);
export const READ_TOOL_NAMES: readonly string[] = Object.freeze(["read_file"]);
export const GREP_TOOL_NAMES: readonly string[] = Object.freeze(["grep_search"]);
export const WEBFETCH_TOOL_NAMES: readonly string[] = Object.freeze(["web_fetch"]);

const NATIVE_TO_CANONICAL: Readonly<Record<string, string>> = Object.freeze({
  run_command: "Bash",
  read_file: "Read",
  grep_search: "Grep",
  web_fetch: "WebFetch",
});

const KNOWN_PREFIXES: readonly string[] = Object.freeze([
  "mcp_context-mode_context-mode_",
  TOOL_NAME_PREFIX,
  "mcp_context_mode_",
  "context-mode_",
]);

const ANTIGRAVITY_EVENTS: Readonly<Record<string, CanonicalEventName>> = Object.freeze({
  PreToolUse: "PreToolUse",
  preToolUse: "PreToolUse",
  PostToolUse: "PostToolUse",
  postToolUse: "PostToolUse",
  SessionStart: "SessionStart",
  sessionStart: "SessionStart",
  PreInvocation: "UserPromptSubmit",
  preInvocation: "UserPromptSubmit",
  UserPromptSubmit: "UserPromptSubmit",
  userPromptSubmit: "UserPromptSubmit",
});

const EMPTY_ALLOW: HookOutput = Object.freeze({ stdout: "", exitCode: 0 });
const EMPTY_JSON: HookOutput = Object.freeze({ stdout: "{}", exitCode: 0 });

function own(p: Record<string, unknown>, key: string): unknown {
  return Object.hasOwn(p, key) ? p[key] : undefined;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function canonicalName(name: string, mcp?: unknown): string {
  for (const prefix of KNOWN_PREFIXES) {
    if (name.startsWith(prefix)) return name.slice(prefix.length);
  }
  if (Object.hasOwn(NATIVE_TO_CANONICAL, name)) return NATIVE_TO_CANONICAL[name];
  if (typeof mcp !== "object" || mcp === null) return name;
  const m = mcp as Record<string, unknown>;
  const server = own(m, "server_name") ?? own(m, "serverName");
  const tool = own(m, "tool_name") ?? own(m, "toolName");
  if (typeof server !== "string" || typeof tool !== "string") return name;
  return "mcp:" + server + ":" + tool;
}

function policyInput(canonical: string, input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...input };
  if (canonical === "Bash") {
    const cmd = own(input, "CommandLine") ?? own(input, "command");
    if (typeof cmd === "string") out.command = cmd;
  } else if (canonical === "Read") {
    const p = own(input, "AbsolutePath") ?? own(input, "Path") ?? own(input, "filePath") ?? own(input, "file_path");
    if (typeof p === "string") out.file_path = p;
    const start = own(input, "startLine") ?? own(input, "offset");
    if (isNum(start)) out.offset = start;
    const end = own(input, "endLine");
    if (isNum(start) && isNum(end) && end >= start) out.limit = end - start + 1;
    const limit = own(input, "limit");
    if (isNum(limit)) out.limit = limit;
  } else if (canonical === "Grep") {
    const pat = own(input, "Pattern") ?? own(input, "pattern");
    if (typeof pat === "string") out.pattern = pat;
    const p = own(input, "Path") ?? own(input, "path");
    if (typeof p === "string") out.path = p;
  } else if (canonical === "WebFetch") {
    const url = own(input, "URL") ?? own(input, "url");
    if (typeof url === "string") out.url = url;
  }
  return out;
}

function readResult(raw: Record<string, unknown>): ToolResultInfo {
  const err = own(raw, "error");
  const hasError = err !== undefined && err !== null && String(err).length > 0;
  if (hasError) {
    const errText = String(err);
    return { isError: true, bytes: Buffer.byteLength(errText), text: errText };
  }
  const resp = own(raw, "toolResponse") ?? own(raw, "toolResult") ?? own(raw, "toolOutput");
  const text = resp === undefined ? "" : typeof resp === "string" ? resp : JSON.stringify(resp);
  const respObj = isRecord(resp) ? resp : undefined;
  const isErr = respObj ? respObj.is_error === true || respObj.isError === true : false;
  return { isError: isErr, bytes: Buffer.byteLength(text), text };
}

export function decode(raw: unknown): CanonicalHookEvent {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("antigravity: hook payload is not a JSON object");
  }
  const p = raw as Record<string, unknown>;
  const nativeName = own(p, "hookEventName") ?? own(p, "hook_event_name") ?? own(p, "event");
  let event: CanonicalEventName | undefined =
    typeof nativeName === "string" && Object.hasOwn(ANTIGRAVITY_EVENTS, nativeName)
      ? ANTIGRAVITY_EVENTS[nativeName]
      : undefined;

  if (event === undefined) {
    if (own(p, "toolCall") !== undefined || own(p, "toolName") !== undefined || own(p, "tool_name") !== undefined) {
      const hasResult = own(p, "error") !== undefined || own(p, "toolResponse") !== undefined || own(p, "toolResult") !== undefined;
      event = hasResult ? "PostToolUse" : "PreToolUse";
    } else if (own(p, "lastUserInput") !== undefined || own(p, "invocationNum") !== undefined) {
      event = "UserPromptSubmit";
    } else if (own(p, "conversationId") !== undefined) {
      event = "SessionStart";
    }
  }

  if (event === undefined) {
    throw new Error("antigravity: unknown hook event " + String(nativeName));
  }

  const sessionId = String(own(p, "conversationId") ?? own(p, "sessionId") ?? own(p, "session_id") ?? "");
  const workspace = isRecord(own(p, "workspace")) ? (own(p, "workspace") as Record<string, unknown>) : undefined;
  const workspacePaths = Array.isArray(own(p, "workspacePaths")) ? (own(p, "workspacePaths") as unknown[]) : undefined;
  const cwd = String(
    workspace?.current_dir ??
    (workspacePaths && workspacePaths.length > 0 ? workspacePaths[0] : undefined) ??
    own(p, "cwd") ??
    ""
  );

  const ev: CanonicalHookEvent = { event, agent: "antigravity-cli", sessionId, cwd };

  if (event === "SessionStart") {
    ev.source = "startup";
  }

  if (event === "UserPromptSubmit") {
    const prompt = own(p, "lastUserInput") ?? own(p, "prompt");
    if (typeof prompt === "string") ev.prompt = prompt;
  }

  if (event === "PreToolUse" || event === "PostToolUse") {
    const toolCall = isRecord(own(p, "toolCall")) ? (own(p, "toolCall") as Record<string, unknown>) : undefined;
    const rawName = String(toolCall?.name ?? own(p, "toolName") ?? own(p, "tool_name") ?? "");
    const rawArgs = toolCall?.args ?? own(p, "toolArgs") ?? own(p, "toolInput") ?? own(p, "tool_input") ?? own(p, "args");
    const inputObj = isRecord(rawArgs) ? rawArgs : {};
    const canonical = canonicalName(rawName, own(p, "mcpContext") ?? own(p, "mcp_context"));

    ev.tool = {
      name: rawName,
      canonicalName: canonical,
      input: policyInput(canonical, inputObj),
    };
  }

  if (event === "PostToolUse") {
    ev.result = readResult(p);
  }

  return ev;
}

export function encode(ev: CanonicalHookEvent, d: Decision, _extra?: string): HookOutput {
  switch (d.kind) {
    case "allow":
      return ev.event === "PostToolUse" ? EMPTY_JSON : EMPTY_ALLOW;
    case "hint":
      if (ev.event === "PostToolUse") return EMPTY_JSON;
      if (ev.event === "SessionStart" || ev.event === "UserPromptSubmit") {
        return {
          stdout: JSON.stringify({
            injectSteps: [{ ephemeralMessage: d.text }],
          }),
          exitCode: 0,
        };
      }
      return EMPTY_ALLOW;
    case "deny":
      if (ev.event === "PostToolUse") return EMPTY_JSON;
      if (ev.event === "PreToolUse") {
        const reason = d.rewritten === undefined ? d.reason : d.rewritten + "\n" + d.reason;
        const out: Record<string, unknown> = {
          decision: "deny",
          reason,
        };
        if (d.rewritten !== undefined) {
          out.overwrite = {
            CommandLine: d.rewritten,
            command: d.rewritten,
          };
        }
        return {
          stdout: JSON.stringify(out),
          exitCode: 0,
        };
      }
      return EMPTY_ALLOW;
    case "replace":
      return ev.event === "PostToolUse" ? EMPTY_JSON : EMPTY_ALLOW;
  }
}
