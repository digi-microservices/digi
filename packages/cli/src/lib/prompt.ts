import { colors } from "./output.js";

/**
 * Read a line of input from stdin.
 */
async function readLine(): Promise<string> {
  const reader = Bun.stdin.stream().getReader();
  const { value } = await reader.read();
  reader.releaseLock();
  return value ? new TextDecoder().decode(value).trim() : "";
}

/**
 * Prompt the user for text input.
 */
export async function prompt(
  message: string,
  opts?: { default?: string; required?: boolean },
): Promise<string> {
  const defaultVal = opts?.default;
  const required = opts?.required ?? false;

  const parts = [message];
  if (required && !defaultVal) parts.push(colors.dim("(required)"));
  if (defaultVal) parts.push(colors.dim(`(${defaultVal})`));
  parts.push(": ");

  process.stdout.write(parts.join(" "));

  const input = await readLine();
  const result = input || defaultVal || "";

  if (required && !result) {
    process.stdout.write(`${colors.red("✗")} This field is required.\n`);
    return prompt(message, opts);
  }

  return result;
}

/**
 * Prompt the user for a yes/no confirmation.
 */
export async function confirm(
  message: string,
  defaultYes = true,
): Promise<boolean> {
  const hint = defaultYes ? "Y/n" : "y/N";
  process.stdout.write(`${message} ${colors.dim(`(${hint})`)}: `);

  const input = await readLine();

  if (!input) return defaultYes;
  return input.toLowerCase().startsWith("y");
}

/**
 * Prompt the user to select from a list of options using arrow keys.
 */
export async function select(
  message: string,
  options: string[],
): Promise<string> {
  if (options.length === 0) throw new Error("select() requires at least one option");

  process.stdout.write(`  ${colors.bold(message)}\n\n`);

  let selected = 0;

  const render = () => {
    // Move cursor up to overwrite previous render
    for (let i = 0; i < options.length; i++) {
      const prefix = i === selected ? colors.blue("❯") : " ";
      const label = i === selected ? colors.bold(options[i]!) : options[i]!;
      process.stdout.write(`  ${prefix} ${label}\n`);
    }
  };

  const clearOptions = () => {
    // Move cursor up and clear each line
    for (let i = 0; i < options.length; i++) {
      process.stdout.write("\x1b[A\x1b[2K");
    }
  };

  render();

  // Enable raw mode for arrow key input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  return new Promise<string>((resolve) => {
    const onData = (data: Buffer) => {
      const key = data.toString();

      if (key === "\x1b[A" || key === "k") {
        // Up arrow or k
        selected = (selected - 1 + options.length) % options.length;
        clearOptions();
        render();
      } else if (key === "\x1b[B" || key === "j") {
        // Down arrow or j
        selected = (selected + 1) % options.length;
        clearOptions();
        render();
      } else if (key === "\r" || key === "\n") {
        // Enter
        process.stdin.removeListener("data", onData);
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        process.stdout.write("\n");
        resolve(options[selected]!);
      } else if (key === "\x03") {
        // Ctrl+C
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        process.exit(0);
      }
    };

    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}
