"use client";

import { useEffect, useRef, useState } from "react";

interface LogLine {
  timestamp: string;
  level: string;
  message: string;
}

export default function PlatformLogsPage() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    const wsUrl = apiUrl.replace(/^http/, "ws") + "/graphql";

    const ws = new WebSocket(wsUrl, "graphql-ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "connection_init" }));
      ws.send(
        JSON.stringify({
          id: "1",
          type: "subscribe",
          payload: {
            query: `subscription { platformLogs { timestamp level message } }`,
          },
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as { type: string; payload?: { data?: { platformLogs: LogLine } } };
        if (msg.type === "next" && msg.payload?.data?.platformLogs) {
          setLogs((prev) => [...prev.slice(-500), msg.payload!.data!.platformLogs]);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  function levelColor(level: string) {
    switch (level.toLowerCase()) {
      case "error": return "text-red-400";
      case "warn": return "text-yellow-400";
      case "info": return "text-blue-400";
      default: return "text-neutral-400";
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Platform Logs</h1>
        <span className={`text-xs ${connected ? "text-green-400" : "text-red-400"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div
        ref={containerRef}
        className="h-[calc(100vh-200px)] overflow-y-auto rounded-xl border border-neutral-800 bg-black p-4 font-mono text-xs"
      >
        {logs.length === 0 && (
          <p className="text-neutral-500">Waiting for logs...</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 py-0.5">
            <span className="shrink-0 text-neutral-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`shrink-0 w-12 uppercase ${levelColor(log.level)}`}>{log.level}</span>
            <span className="text-neutral-200">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
