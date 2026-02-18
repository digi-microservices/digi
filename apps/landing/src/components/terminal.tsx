"use client";

import React, { useState, useEffect, type CSSProperties, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — exact hex values from the digi landing page
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  // Backgrounds — matched to screenshot
  bgCode: "#1e1f24", // terminal / code body  (warm dark gray)
  bgChrome: "#27282e", // chrome bar            (slightly lighter)
  bgSurface2: "#18181b", // outer card wrapper
  bgRowHover: "rgba(255,255,255,0.03)",

  // Borders — softer, matches rounded card in screenshot
  border: "rgba(255,255,255,0.10)",
  borderChrome: "rgba(255,255,255,0.08)",

  // Brand
  blue: "#3A7DFF", // Digital Blue
  blueDim: "rgba(58,125,255,0.65)",

  // Syntax tokens (matches landing page code-body colours)
  keyword: "#a78bfa", // violet-400
  string: "#22c55e", // green
  number: "#f59e0b", // amber
  fn: "#60a5fa", // blue-400
  comment: "#3f3f46", // zinc-700 (very muted)
  plain: "#a1a1aa", // zinc-400

  // Terminal line semantic colours
  tCmd: "#3A7DFF", // command  → Digital Blue
  tSuccess: "#22c55e", // success  → green
  tError: "#ef4444", // error    → red
  tWarning: "#f59e0b", // warning  → amber
  tInfo: "#a1a1aa", // info     → zinc-400
  tDim: "#5A5D67", // dim      → Slate Gray
  tOutput: "#f4f4f6", // output   → Pure White

  // Misc
  slate: "#5A5D67",
  zinc400: "#a1a1aa",
  zinc700: "#3f3f46",
  white: "#f4f4f6",

  // Copy button
  copyDefault: "rgba(255,255,255,0.04)",
  copyHover: "rgba(255,255,255,0.08)",
  copySuccess: "rgba(34,197,94,0.10)",
};

// Inject blink + row-hover keyframes once into <head>
const STYLE_ID = "digi-global-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes digi-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .digi-cursor { animation: digi-blink 1s step-end infinite; }
    .digi-row:hover td { background: ${C.bgRowHover}; }
    .digi-copy-btn:hover { background: ${C.copyHover} !important; color: ${C.white} !important; }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type TerminalLine =
  | { type: "command"; text: string }
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | { type: "warning"; text: string }
  | { type: "info"; text: string }
  | { type: "dim"; text: string }
  | { type: "output"; text: string };

export type CodeToken =
  | { kind: "keyword"; text: string }
  | { kind: "string"; text: string }
  | { kind: "number"; text: string }
  | { kind: "function"; text: string }
  | { kind: "comment"; text: string }
  | { kind: "blue"; text: string }
  | { kind: "plain"; text: string };

export type CodeLine = CodeToken[];

// ─────────────────────────────────────────────────────────────────────────────
// Internal maps
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_COLOR: Record<CodeToken["kind"], string> = {
  keyword: C.keyword,
  string: C.string,
  number: C.number,
  function: C.fn,
  comment: C.comment,
  blue: C.blue,
  plain: C.plain,
};

const LINE_COLOR: Record<TerminalLine["type"], string> = {
  command: C.tCmd,
  success: C.tSuccess,
  error: C.tError,
  warning: C.tWarning,
  info: C.tInfo,
  dim: C.tDim,
  output: C.tOutput,
};

const LINE_PREFIX: Partial<Record<TerminalLine["type"], string>> = {
  command: "$",
  success: "✓",
  error: "✗",
  warning: "⚠",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Cursor() {
  return (
    <span
      aria-hidden
      className="digi-cursor"
      style={{
        display: "inline-block",
        width: 7,
        height: 13,
        background: C.blue,
        borderRadius: 1,
        verticalAlign: "middle",
        marginLeft: 2,
      }}
    />
  );
}

function TrafficLights() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {(["#ef4444", "#f59e0b", "#22c55e"] as const).map((bg) => (
        <span
          key={bg}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: bg,
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

function FileIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      style={{ flexShrink: 0, color: C.slate }}
    >
      <path
        d="M2 1h6l3 3v8a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="none"
      />
      <path
        d="M8 1v3h3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const base: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    fontFamily: "inherit",
    border: `1px solid ${C.border}`,
    cursor: "pointer",
    transition: "all 0.18s ease",
    letterSpacing: "0.01em",
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy code"
      className="digi-copy-btn"
      style={
        copied
          ? {
              ...base,
              background: C.copySuccess,
              color: C.string,
              borderColor: "rgba(34,197,94,0.25)",
            }
          : { ...base, background: C.copyDefault, color: C.slate }
      }
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path
              d="M1.5 5.5l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect
              x="4"
              y="4"
              width="7"
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TerminalWindow
// ─────────────────────────────────────────────────────────────────────────────

interface TerminalWindowProps {
  /** Lines to render with semantic colour. */
  lines: TerminalLine[];
  /** Animate lines in one-by-one on mount. @default false */
  animated?: boolean;
  /** ms between each line when animated. @default 340 */
  lineDelay?: number;
  /** Show blinking cursor after the last visible line. @default true */
  showCursor?: boolean;
  /** Title centred in the chrome bar. */
  title?: string;
  style?: CSSProperties;
  className?: string;
}

export function TerminalWindow({
  lines,
  animated = false,
  lineDelay = 340,
  showCursor = true,
  title,
  style,
  className = "",
}: TerminalWindowProps) {
  const [visibleCount, setVisibleCount] = useState(animated ? 0 : lines.length);

  useEffect(() => {
    if (!animated) {
      setVisibleCount(lines.length);
      return;
    }
    setVisibleCount(0);
    let i = 0;
    const tick = () => {
      i++;
      setVisibleCount(i);
      if (i < lines.length) setTimeout(tick, lineDelay);
    };
    const timer = setTimeout(tick, 350);
    return () => clearTimeout(timer);
  }, [animated, lines, lineDelay]);

  const visible = lines.slice(0, visibleCount);

  return (
    <div
      className={className}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        background: C.bgCode,
        boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
        fontFamily: "'DM Mono', 'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 14,
        ...style,
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: C.bgChrome,
          borderBottom: `1px solid ${C.borderChrome}`,
        }}
      >
        <TrafficLights />
        {title && (
          <span
            style={{ color: C.slate, fontSize: 11, letterSpacing: "0.04em" }}
          >
            {title}
          </span>
        )}
        <span style={{ width: 52 }} />
      </div>

      {/* Body */}
      <div style={{ padding: "20px 28px", lineHeight: 2.0 }}>
        {visible.map((line, i) => {
          const isLast = i === visible.length - 1;
          const prefix = LINE_PREFIX[line.type];
          const prefixColor =
            line.type === "command" ? C.slate : LINE_COLOR[line.type];
          // Success lines show bold weight (matches screenshot "Project created", "postgres", etc.)
          const fontWeight = line.type === "success" ? 700 : 400;

          // For success lines, split "bold part — dim part" on em-dash for mixed styling
          const emDashIdx =
            line.type === "success" ? line.text.indexOf(" — ") : -1;
          const boldPart =
            emDashIdx > -1 ? line.text.slice(0, emDashIdx) : line.text;
          const dimPart = emDashIdx > -1 ? line.text.slice(emDashIdx) : null;

          // For command lines, highlight the first word (the binary) in blue
          let cmdContent: React.ReactNode = line.text;
          if (line.type === "command") {
            const spaceIdx = line.text.indexOf(" ");
            if (spaceIdx > -1) {
              const bin = line.text.slice(0, spaceIdx);
              const rest = line.text.slice(spaceIdx);
              cmdContent = (
                <>
                  <span style={{ color: C.blue }}>{bin}</span>
                  <span style={{ color: C.tOutput }}>{rest}</span>
                </>
              );
            } else {
              cmdContent = <span style={{ color: C.blue }}>{line.text}</span>;
            }
          }

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                minHeight: "2em",
              }}
            >
              {prefix && (
                <span
                  style={{
                    color: prefixColor,
                    userSelect: line.type === "command" ? "none" : "auto",
                    flexShrink: 0,
                  }}
                >
                  {prefix}
                </span>
              )}
              {line.type === "command" ? (
                <span>{cmdContent}</span>
              ) : dimPart ? (
                <span>
                  <span style={{ color: LINE_COLOR[line.type], fontWeight }}>
                    {boldPart}
                  </span>
                  <span style={{ color: C.tDim, fontWeight: 400 }}>
                    {dimPart}
                  </span>
                </span>
              ) : (
                <span style={{ color: LINE_COLOR[line.type], fontWeight }}>
                  {line.text}
                </span>
              )}
              {isLast && showCursor && <Cursor />}
            </div>
          );
        })}

        {animated && visibleCount < lines.length && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              minHeight: "2em",
            }}
          >
            <Cursor />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CodeBlock
// ─────────────────────────────────────────────────────────────────────────────

interface CodeBlockProps {
  /** Filename shown with a file icon in the header. */
  filename?: string;
  /** Language badge on the right of the header. */
  language?: string;
  /** Token-array lines to render. */
  lines: CodeLine[];
  /** Show gutter line numbers. @default false */
  lineNumbers?: boolean;
  /** Show copy-to-clipboard button. @default true */
  copyable?: boolean;
  /** Raw string for clipboard. Falls back to plain-text extraction if omitted. */
  rawCode?: string;
  style?: CSSProperties;
  className?: string;
}

export function CodeBlock({
  filename,
  language,
  lines,
  lineNumbers = false,
  copyable = true,
  rawCode,
  style,
  className = "",
}: CodeBlockProps) {
  const plainText =
    rawCode ?? lines.map((l) => l.map((t) => t.text).join("")).join("\n");
  const hasHeader = filename ?? language ?? copyable;

  return (
    <div
      className={className}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        background: C.bgCode,
        boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        fontFamily: "'DM Mono', 'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        ...style,
      }}
    >
      {/* Header */}
      {hasHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 16px",
            background: C.bgChrome,
            borderBottom: `1px solid ${C.borderChrome}`,
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
              flex: 1,
            }}
          >
            {filename && <FileIcon />}
            {filename && (
              <span
                style={{
                  color: C.zinc400,
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {filename}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {language && (
              <span
                style={{
                  color: C.blueDim,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {language}
              </span>
            )}
            {copyable && <CopyButton text={plainText} />}
          </div>
        </div>
      )}

      {/* Code rows */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {lines.map((line, li) => (
              <tr key={li} className="digi-row">
                {lineNumbers && (
                  <td
                    style={{
                      userSelect: "none",
                      textAlign: "right",
                      padding: "0 18px 0 20px",
                      lineHeight: 1.9,
                      color: C.zinc700,
                      fontSize: 12,
                      width: 44,
                      verticalAlign: "top",
                      transition: "background 0.12s",
                    }}
                  >
                    {li + 1}
                  </td>
                )}
                <td
                  style={{
                    padding: `0 24px 0 ${lineNumbers ? 0 : 20}px`,
                    lineHeight: 1.9,
                    verticalAlign: "top",
                    transition: "background 0.12s",
                  }}
                >
                  {line.length === 0 ? (
                    <span>&nbsp;</span>
                  ) : (
                    line.map((tok, ti) => (
                      <span key={ti} style={{ color: TOKEN_COLOR[tok.kind] }}>
                        {tok.text}
                      </span>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineCode — small inline monospace snippet
// ─────────────────────────────────────────────────────────────────────────────

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
        fontSize: "0.85em",
        color: "#93b4ff",
        background: "rgba(58,125,255,0.10)",
        border: "1px solid rgba(58,125,255,0.20)",
        padding: "1px 6px",
        borderRadius: 5,
      }}
    >
      {children}
    </code>
  );
}
