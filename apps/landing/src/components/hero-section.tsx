import { TerminalWindow, type TerminalLine } from "@digi/ui";
import { WaitlistForm } from "~/components/waitlist-form";

const heroLines: TerminalLine[] = [
  { type: "command", text: "digi init my-api" },
  { type: "success", text: "Project created — my-api/" },
  { type: "command", text: "digi service add postgres redis" },
  { type: "success", text: "postgres — provisioned in 1.2s" },
  { type: "success", text: "redis — provisioned in 0.8s" },
  { type: "command", text: "digi deploy" },
  { type: "success", text: "Deployed to my-api.digi.run — 3.4s" },
];

export function HeroSection() {
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "8rem 1.5rem 5rem",
      position: "relative",
    }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute",
        top: "22%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: 700,
        height: 400,
        background: "radial-gradient(ellipse, rgba(58,125,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Badge */}
      <div className="digi-fade-1" style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(58,125,255,0.10)",
        border: "1px solid rgba(58,125,255,0.25)",
        color: "#93b4ff",
        fontSize: "0.72rem",
        fontWeight: 500,
        padding: "0.3rem 0.9rem",
        borderRadius: 99,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        marginBottom: "2rem",
      }}>
        <span style={{ width: 6, height: 6, background: "#3A7DFF", borderRadius: "50%", display: "inline-block" }} />
        Preview
      </div>

      {/* Headline */}
      <h1 className="digi-fade-2" style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700,
        fontSize: "clamp(2.4rem, 6vw, 4.8rem)",
        lineHeight: 1.06,
        letterSpacing: "-0.03em",
        maxWidth: 800,
      }}>
        Microservice infra<br />
        <span style={{ color: "#3A7DFF" }}>without the overhead.</span>
      </h1>

      {/* Sub */}
      <p className="digi-fade-3" style={{
        marginTop: "1.5rem",
        fontSize: "clamp(1rem, 2vw, 1.2rem)",
        color: "rgba(244,244,246,0.55)",
        fontWeight: 300,
        maxWidth: 520,
        lineHeight: 1.7,
      }}>
        Deploy lightweight microservices with ease. Small VMs (1 vCPU, 512MB RAM), managed databases, caching solutions, and application hosting — purpose-built for modern APIs and small-scale services.
      </p>

      {/* Waitlist Form */}
      <div className="digi-fade-4" style={{ marginTop: "2.5rem", width: "100%", maxWidth: 600 }}>
        <WaitlistForm />
      </div>

      {/* Terminal */}
      <div className="digi-fade-5" style={{ marginTop: "4rem", width: "100%", maxWidth: 620, textAlign: "left" }}>
        <TerminalWindow lines={heroLines} animated lineDelay={360} title="Terminal" />
      </div>
    </section>
  );
}
