// ANSI color codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";
const GRAY = "\x1b[90m";

export const colors = {
  reset: (s: string) => `${RESET}${s}${RESET}`,
  bold: (s: string) => `${BOLD}${s}${RESET}`,
  dim: (s: string) => `${DIM}${s}${RESET}`,
  red: (s: string) => `${RED}${s}${RESET}`,
  green: (s: string) => `${GREEN}${s}${RESET}`,
  yellow: (s: string) => `${YELLOW}${s}${RESET}`,
  blue: (s: string) => `${BLUE}${s}${RESET}`,
  magenta: (s: string) => `${MAGENTA}${s}${RESET}`,
  cyan: (s: string) => `${CYAN}${s}${RESET}`,
  white: (s: string) => `${WHITE}${s}${RESET}`,
  gray: (s: string) => `${GRAY}${s}${RESET}`,
};

export function success(message: string): void {
  process.stdout.write(`${GREEN}✓${RESET} ${message}\n`);
}

export function error(message: string): void {
  process.stdout.write(`${RED}✗${RESET} ${message}\n`);
}

export function warning(message: string): void {
  process.stdout.write(`${YELLOW}⚠${RESET} ${message}\n`);
}

export function info(message: string): void {
  process.stdout.write(`${BLUE}ℹ${RESET} ${message}\n`);
}

export function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

export function newline(): void {
  process.stdout.write("\n");
}

/**
 * Format data as a table with column headers.
 */
export function table(headers: string[], rows: string[][]): void {
  const colWidths: number[] = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => {
      const cell = row[i] ?? "";
      return Math.max(max, cell.length);
    }, 0);
    return Math.max(h.length, maxRow);
  });

  // Header row
  const headerLine = headers
    .map((h, i) => `${BOLD}${h.padEnd(colWidths[i] ?? 0)}${RESET}`)
    .join("  ");
  process.stdout.write(`${headerLine}\n`);

  // Separator
  const separator = colWidths.map((w) => "─".repeat(w)).join("──");
  process.stdout.write(`${DIM}${separator}${RESET}\n`);

  // Data rows
  for (const row of rows) {
    const line = row
      .map((cell, i) => cell.padEnd(colWidths[i] ?? 0))
      .join("  ");
    process.stdout.write(`${line}\n`);
  }
}

/**
 * Simple spinner for async operations.
 */
export function spinner(message: string): { stop: (finalMessage?: string) => void } {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${CYAN}${frames[i % frames.length]}${RESET} ${message}`);
    i++;
  }, 80);

  return {
    stop(finalMessage?: string) {
      clearInterval(interval);
      process.stdout.write(`\r${" ".repeat(message.length + 4)}\r`);
      if (finalMessage) {
        process.stdout.write(`${finalMessage}\n`);
      }
    },
  };
}
