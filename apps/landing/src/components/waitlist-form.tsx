"use client";

import { useState, type FormEvent } from "react";
import { BtnPrimary } from "@digi/ui";

export function WaitlistForm({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json() as { message?: string };

      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "Thanks for joining!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message ?? "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to join waitlist");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{
            flex: "1 1 280px",
            padding: "0.75rem 1.25rem",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 8,
            color: "#F4F4F6",
            fontSize: "0.95rem",
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
            transition: "all 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#3A7DFF";
            e.currentTarget.style.boxShadow = "0 0 0 1px #3A7DFF";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
            e.currentTarget.style.boxShadow = "none";
          }}
          required
          disabled={status === "loading" || status === "success"}
        />
        <BtnPrimary
          large
          type="submit"
          disabled={status === "loading" || status === "success"}
        >
          {status === "loading" && "Joining..."}
          {status === "success" && "Joined! ✓"}
          {status !== "loading" && status !== "success" && "Join Waitlist"}
        </BtnPrimary>
      </div>
      {message && (
        <p style={{
          marginTop: "1rem",
          fontSize: "0.875rem",
          color: status === "error" ? "#ef4444" : "#22c55e",
          textAlign: "center",
        }}>
          {message}
        </p>
      )}
    </form>
  );
}
