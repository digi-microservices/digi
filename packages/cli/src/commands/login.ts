import { randomBytes } from "crypto";
import { saveConfig } from "../lib/config";
import { query } from "../lib/api";
import { colors, success, error, info, log, newline } from "../lib/output";
import { prompt, select } from "../lib/prompt";

interface MeResponse {
  me: {
    id: string;
    email: string;
    name: string | null;
  };
}

async function browserLogin(apiUrl: string): Promise<void> {
  const code = randomBytes(8).toString("hex");
  const port = 19836 + Math.floor(Math.random() * 100);

  const callbackUrl = `http://localhost:${port}/callback`;
  const authUrl = `${apiUrl}/auth/cli?code=${code}&callback=${encodeURIComponent(callbackUrl)}`;

  // Open browser
  const openCmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";

  const proc = Bun.spawn([openCmd, authUrl], {
    stdout: "ignore",
    stderr: "ignore",
  });
  await proc.exited;

  info(`Opening browser... ${colors.dim("(press Ctrl+C to cancel)")}`);
  log(colors.dim(`  If the browser doesn't open, visit: ${authUrl}`));
  newline();

  // Start temporary HTTP server to receive the callback
  const token = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        server.stop();
        reject(new Error("Login timed out after 5 minutes."));
      },
      5 * 60 * 1000,
    );

    const server = Bun.serve({
      port,
      fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/callback") {
          const receivedToken = url.searchParams.get("token");
          const receivedEmail = url.searchParams.get("email");

          if (receivedToken) {
            clearTimeout(timeout);
            setTimeout(() => server.stop(), 100);
            resolve(receivedToken);

            const displayName = receivedEmail ?? "your account";
            return new Response(
              `<html><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fff">` +
                `<div style="text-align:center"><h1>Logged in as ${displayName}</h1><p>You can close this tab.</p></div>` +
                `</body></html>`,
              { headers: { "Content-Type": "text/html" } },
            );
          }

          clearTimeout(timeout);
          setTimeout(() => server.stop(), 100);
          reject(new Error("No token received from callback."));
          return new Response("Login failed", { status: 400 });
        }

        return new Response("Not found", { status: 404 });
      },
    });
  });

  // Verify the token works
  saveConfig({ api_url: apiUrl, token });

  try {
    const data = await query<MeResponse>(
      `query { me { id email name } }`,
      {},
      { api_url: apiUrl, token },
    );

    success(
      `Logged in as ${colors.bold(data.me.email)}${data.me.name ? ` (${data.me.name})` : ""}`,
    );
  } catch {
    success("Logged in successfully.");
  }
}

async function tokenLogin(): Promise<void> {
  const apiUrl = await prompt("API URL", { default: "http://localhost:4000" });
  const token = await prompt("API Token", { required: true });

  info("Verifying credentials...");

  const data = await query<MeResponse>(
    `query { me { id email name } }`,
    {},
    { api_url: apiUrl, token },
  );

  saveConfig({ api_url: apiUrl, token });

  success(
    `Logged in as ${colors.bold(data.me.email)}${data.me.name ? ` (${data.me.name})` : ""}`,
  );
}

export async function loginCommand(_args: string[]): Promise<void> {
  newline();
  log(`  ${colors.bold("Digi CLI Login")}`);
  newline();

  const method = await select("How would you like to authenticate?", [
    "Browser login (recommended)",
    "API token",
  ]);

  newline();

  try {
    if (method.startsWith("Browser")) {
      const apiUrl = await prompt("API URL", {
        default: "http://localhost:4000",
      });
      await browserLogin(apiUrl);
    } else {
      await tokenLogin();
    }
  } catch (err) {
    error(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
