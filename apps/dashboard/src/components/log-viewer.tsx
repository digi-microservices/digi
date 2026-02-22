"use client";
import { useEffect, useRef, useState } from "react";
import { env } from "~/env";

interface LogViewerProps {
  containerId: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
}

export function LogViewer({ containerId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    const wsUrl =
      env.NEXT_PUBLIC_LOCAL_API_URL.replace(/^https/, "wss")
        .replace(/^http/, "ws")
        .replace(/\/$/, "") + "/graphql";

    const ws = new WebSocket(wsUrl, "graphql-transport-ws");
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) {
        ws.close();
        return;
      }
      ws.send(JSON.stringify({ type: "connection_init" }));
    };

    ws.onmessage = (event) => {
      if (cancelled) return;
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          payload?: { data?: { containerLogs?: LogEntry } };
        };

        if (data.type === "connection_ack") {
          setConnected(true);
          ws.send(
            JSON.stringify({
              id: "logs",
              type: "subscribe",
              payload: {
                query: `subscription ContainerLogs($containerId: ID!) {
                  containerLogs(containerId: $containerId) {
                    timestamp
                    message
                  }
                }`,
                variables: { containerId },
              },
            }),
          );
        }

        if (data.type === "next" && data.payload?.data?.containerLogs) {
          setLogs((prev) => [...prev, data.payload!.data!.containerLogs!]);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      if (!cancelled) setConnected(false);
    };

    ws.onerror = () => {
      if (!cancelled) setConnected(false);
    };

    return () => {
      cancelled = true;
      ws.close();
    };
  }, [containerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="text-xs font-medium text-neutral-400">Logs</span>
        <span
          className={`flex items-center gap-1.5 text-xs ${
            connected ? "text-green-400" : "text-neutral-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-green-400" : "bg-neutral-500"
            }`}
          />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="h-[500px] overflow-y-auto p-4 font-mono text-sm leading-relaxed"
      >
        {logs.length === 0 ? (
          <p className="text-neutral-500">Waiting for logs...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 text-neutral-600">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="whitespace-pre-wrap break-all text-neutral-300">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
