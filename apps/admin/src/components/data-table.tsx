"use client";

import { useState } from "react";

interface DataTableProps {
  columns: string[];
  rows: React.ReactNode[][];
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable({
  columns,
  rows,
  pageSize = 10,
  emptyMessage = "No data available",
}: DataTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / pageSize);
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-neutral-600"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-neutral-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
          <p className="text-xs text-neutral-600">
            {page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, rows.length)} of {rows.length}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-neutral-400 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-neutral-400 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
