import { requireConfig } from "../lib/config";
import { colors, error, info, log } from "../lib/output";

export async function logsCommand(args: string[]): Promise<void> {
  const serviceId = args[0];
  const containerName = args[1] ?? null;

  if (!serviceId) {
    error(
      "Service ID is required. Usage: digi logs <serviceId> [containerName]",
    );
    process.exit(1);
  }

  const config = requireConfig();

  // Convert HTTP URL to WebSocket URL
  const wsUrl = config.api_url
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");

  const subscriptionPayload = JSON.stringify({
    type: "connection_init",
    payload: {
      Authorization: `Bearer ${config.token}`,
    },
  });

  const subscribeMessage = JSON.stringify({
    id: "1",
    type: "subscribe",
    payload: {
      query: `subscription ContainerLogs($serviceId: ID!, $containerName: String) {
        containerLogs(serviceId: $serviceId, containerName: $containerName) {
          timestamp
          message
          stream
          containerId
        }
      }`,
      variables: {
        serviceId,
        containerName,
      },
    },
  });

  info(
    `Streaming logs for service ${colors.bold(serviceId)}${containerName ? ` (container: ${colors.bold(containerName)})` : ""}...`,
  );
  log(colors.dim("Press Ctrl+C to stop.\n"));

  try {
    const ws = new WebSocket(`${wsUrl}/graphql`);

    ws.addEventListener("open", () => {
      ws.send(subscriptionPayload);
    });

    ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as {
          type: string;
          id?: string;
          payload?: {
            data?: {
              containerLogs?: {
                timestamp: string;
                message: string;
                stream: string;
                containerId: string;
              };
            };
          };
        };

        if (msg.type === "connection_ack") {
          ws.send(subscribeMessage);
          return;
        }

        if (msg.type === "next" && msg.payload?.data?.containerLogs) {
          const logEntry = msg.payload.data.containerLogs;
          const ts = colors.dim(
            new Date(logEntry.timestamp).toISOString().slice(11, 23),
          );
          const stream =
            logEntry.stream === "stderr"
              ? colors.red("[err]")
              : colors.dim("[out]");
          const cid = colors.gray(logEntry.containerId.slice(0, 8));
          process.stdout.write(`${ts} ${cid} ${stream} ${logEntry.message}\n`);
        }

        if (msg.type === "error") {
          error("Subscription error received from server.");
          ws.close();
        }

        if (msg.type === "complete") {
          info("Log stream ended.");
          ws.close();
        }
      } catch {
        // Ignore parse errors for non-JSON messages
      }
    });

    ws.addEventListener("error", (event) => {
      error(`WebSocket error: ${String(event)}`);
    });

    ws.addEventListener("close", () => {
      info("Disconnected from log stream.");
      process.exit(0);
    });

    // Handle Ctrl+C gracefully
    process.on("SIGINT", () => {
      log(colors.dim("\nClosing log stream..."));
      ws.close();
    });

    // Keep the process alive
    await new Promise(() => {
      // This promise never resolves; the process exits via ws.close or SIGINT
    });
  } catch (err) {
    error(
      `Failed to connect to log stream: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}
