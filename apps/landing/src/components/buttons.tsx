"use client";

import { useState, type ReactNode, type CSSProperties } from "react";

const T = {
  blue: "#3A7DFF",
  blueDark: "#2e6de0",
  blueGlow: "rgba(58,125,255,0.30)",
  blueGlowLg: "rgba(58,125,255,0.40)",
  white: "#F4F4F6",
  whiteDim: "rgba(244,244,246,0.55)",
  whiteSubtle: "rgba(244,244,246,0.08)",
};

interface ButtonProps {
  children: ReactNode;
  large?: boolean;
  block?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function BtnPrimary({ children, large = false, style: sx = {}, onClick, type = "button", disabled = false }: ButtonProps) {
  const [hov, setHov] = useState(false);
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: disabled ? "#555" : hov ? T.blueDark : T.blue,
    color: "#fff",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: large ? "0.95rem" : "0.875rem",
    fontWeight: 500,
    padding: large ? "0.75rem 1.75rem" : "0.45rem 1rem",
    borderRadius: large ? 8 : 6,
    textDecoration: "none",
    transition: "all 0.2s",
    boxShadow: large && !disabled ? (hov ? `0 4px 40px ${T.blueGlowLg}` : `0 0 30px ${T.blueGlow}`) : "none",
    transform: disabled ? "none" : hov && large ? "translateY(-2px)" : hov ? "translateY(-1px)" : "none",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.5 : 1,
    ...sx,
  };
  return (
    <button
      type={type}
      disabled={disabled}
      style={base}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function BtnOutline({ children, large = false, block = false, style: sx = {} }: ButtonProps) {
  const [hov, setHov] = useState(false);
  const base: CSSProperties = {
    display: block ? "flex" : "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: hov ? "rgba(255,255,255,0.10)" : T.whiteSubtle,
    color: hov ? T.white : T.whiteDim,
    border: `1px solid ${hov ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.10)"}`,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: large ? "0.95rem" : "0.875rem",
    padding: large ? "0.75rem 1.75rem" : "0.45rem 1rem",
    borderRadius: large ? 8 : 6,
    textDecoration: "none",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    width: block ? "100%" : undefined,
    ...sx,
  };
  return (
    <a href="#" style={base} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  );
}

export function BtnGhost({ children }: { children: ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href="#"
      style={{
        background: hov ? T.whiteSubtle : "none",
        border: "none",
        cursor: "pointer",
        color: hov ? T.white : T.whiteDim,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.875rem",
        padding: "0.4rem 0.75rem",
        borderRadius: 6,
        transition: "all 0.2s",
        textDecoration: "none",
        display: "inline-block",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </a>
  );
}
