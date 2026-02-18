"use client";

import { useState } from "react";

export interface EnvVar {
  key: string;
  value: string;
}

interface EnvEditorProps {
  initial?: EnvVar[];
  onChange?: (vars: EnvVar[]) => void;
  readOnly?: boolean;
}

export function EnvEditor({ initial = [], onChange, readOnly = false }: EnvEditorProps) {
  const [vars, setVars] = useState<EnvVar[]>(
    initial.length > 0 ? initial : [{ key: "", value: "" }],
  );

  function update(newVars: EnvVar[]) {
    setVars(newVars);
    onChange?.(newVars.filter((v) => v.key.trim() !== ""));
  }

  function handleChange(index: number, field: "key" | "value", val: string) {
    const next = vars.map((v, i) => (i === index ? { ...v, [field]: val } : v));
    update(next);
  }

  function addRow() {
    update([...vars, { key: "", value: "" }]);
  }

  function removeRow(index: number) {
    if (vars.length === 1) {
      update([{ key: "", value: "" }]);
      return;
    }
    update(vars.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-neutral-400">
        <span>Key</span>
        <span>Value</span>
        <span className="w-8" />
      </div>

      {vars.map((v, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input
            type="text"
            value={v.key}
            onChange={(e) => handleChange(i, "key", e.target.value)}
            readOnly={readOnly}
            placeholder="KEY"
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm font-mono text-white placeholder-neutral-500 outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={v.value}
            onChange={(e) => handleChange(i, "value", e.target.value)}
            readOnly={readOnly}
            placeholder="value"
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm font-mono text-white placeholder-neutral-500 outline-none focus:border-blue-500"
          />
          {!readOnly && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-800 hover:text-red-400"
              aria-label="Remove variable"
            >
              &times;
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <button
          type="button"
          onClick={addRow}
          className="mt-1 text-sm text-blue-400 hover:text-blue-300"
        >
          + Add variable
        </button>
      )}
    </div>
  );
}
