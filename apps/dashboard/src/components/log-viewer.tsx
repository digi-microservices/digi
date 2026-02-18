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
    const wsUrl = env.NEXT_PUBLIC_API_URL.replace(/^http/, "ws") + "/graphql";
    const ws = new WebSocket(wsUrl, "graphql-transport-ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "connection_init" }));

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
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          payload?: { data?: { containerLogs?: LogEntry } };
        };
        if (data.type === "next" && data.payload?.data?.containerLogs) {
          setLogs((prev) => [...prev, data.payload!.data!.containerLogs!]);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [containerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="text-xs font-medium text-neutral-400">Logs</span>
        <span
          className={`flex items-center gap-1.5 text-xs ${connected ? "text-green-400" : "text-neutral-500"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-400" : "bg-neutral-500"}`}
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
              <span className="text-neutral-300 whitespace-pre-wrap break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
