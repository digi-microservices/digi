"use client";

import { useState, useEffect } from "react";
import { BtnGhost, BtnPrimary } from "@digi/ui";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "0 2rem",
        height: 60,
        background: scrolled ? "rgba(28,28,33,0.85)" : "rgba(30,30,35,0.72)",
        backdropFilter: "blur(14px)",
        borderBottom: `1px solid rgba(255,255,255,${scrolled ? "0.08" : "0.06"})`,
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <img
          src="/no_background/digi_icon_mark-transparent.png"
          alt="Digi"
          style={{ width: 28, height: 28 }}
        />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.25rem", fontWeight: 600, color: "#F4F4F6", letterSpacing: "-0.01em" }}>
          digi
        </span>
      </a>

      <ul style={{ display: "flex", alignItems: "center", gap: "2rem", listStyle: "none" }} className="hidden md:flex">
        {[["#features", "Features"], ["#deploy", "Deploy"], ["#pricing", "Pricing"], ["#", "Docs"]].map(([href, label]) => (
          <li key={label}>
            <a
              href={href}
              style={{
                color: "rgba(244,244,246,0.55)",
                textDecoration: "none",
                fontSize: "0.875rem",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F4F4F6")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(244,244,246,0.55)")}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifySelf: "end" }}>
        <BtnGhost>Sign in</BtnGhost>
        <BtnPrimary>Get started →</BtnPrimary>
      </div>
    </nav>
  );
}
