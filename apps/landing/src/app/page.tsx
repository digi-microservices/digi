"use client";

import { HeroSection } from "~/components/hero-section";
import { BtnPrimary, BtnOutline, CodeBlock, type CodeLine } from "@digi/ui";

const FEATURES = [
  { icon: "⚡", title: "Instant provisioning", desc: "Databases, queues, caches — provisioned in under two seconds. No tickets, no waiting, no toil." },
  { icon: "🔗", title: "Service mesh built-in", desc: "Automatic mTLS, service discovery, and load balancing. Your services find each other without DNS hacks." },
  { icon: "📦", title: "Deploy from anywhere", desc: "Push from Git, a Dockerfile, or a container registry. digi builds and deploys without a CI pipeline." },
  { icon: "📈", title: "Auto-scaling", desc: "Scale to zero overnight, handle traffic spikes at 9am. Pay for what you use — down to the second." },
  { icon: "🔒", title: "Secrets & config", desc: "Inject secrets at runtime. Env vars, vault-backed secrets, and per-environment configs out of the box." },
  { icon: "🌍", title: "Regional deployment", desc: "Deploy to your preferred region. Choose the location closest to your users for optimal performance." },
];


const CONFIG_LINES: CodeLine[] = [
  [{ kind: "comment", text: "# digi.toml — full stack in 20 lines" }],
  [],
  [{ kind: "plain", text: "[" }, { kind: "function", text: "project" }, { kind: "plain", text: "]" }],
  [{ kind: "keyword", text: "name" }, { kind: "plain", text: "   = " }, { kind: "string", text: '"my-api"' }],
  [{ kind: "keyword", text: "region" }, { kind: "plain", text: " = " }, { kind: "string", text: '"auto"' }],
  [],
  [{ kind: "plain", text: "[" }, { kind: "function", text: "services" }, { kind: "plain", text: "." }, { kind: "function", text: "api" }, { kind: "plain", text: "]" }],
  [{ kind: "keyword", text: "image" }, { kind: "plain", text: " = " }, { kind: "string", text: '"./api"' }],
  [{ kind: "keyword", text: "port" }, { kind: "plain", text: "  = " }, { kind: "number", text: "3000" }],
  [{ kind: "keyword", text: "scale" }, { kind: "plain", text: " = { min = " }, { kind: "number", text: "1" }, { kind: "plain", text: ", max = " }, { kind: "number", text: "20" }, { kind: "plain", text: " }" }],
  [],
  [{ kind: "plain", text: "[" }, { kind: "function", text: "databases" }, { kind: "plain", text: "." }, { kind: "function", text: "db" }, { kind: "plain", text: "]" }],
  [{ kind: "keyword", text: "type" }, { kind: "plain", text: "    = " }, { kind: "string", text: '"postgres"' }],
  [{ kind: "keyword", text: "version" }, { kind: "plain", text: " = " }, { kind: "string", text: '"16"' }],
  [],
  [{ kind: "plain", text: "[" }, { kind: "function", text: "caches" }, { kind: "plain", text: "." }, { kind: "function", text: "cache" }, { kind: "plain", text: "]" }],
  [{ kind: "keyword", text: "type" }, { kind: "plain", text: " = " }, { kind: "string", text: '"redis"' }],
];


const CONFIG_CHECKS = [
  "Git-tracked infrastructure",
  "Per-branch preview environments",
  "Zero-downtime rollouts",
  "Instant rollback with one command",
];

const PLANS = [
  {
    name: "Hobby",
    desc: "Perfect for side projects and experiments.",
    price: "Free",
    per: "/ mo",
    features: ["3 services", "512 MB RAM each", "Shared databases", "Community support"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    desc: "For teams shipping production workloads.",
    price: "£15",
    per: " / mo + usage",
    features: ["Unlimited services", "Auto-scaling", "Dedicated databases", "Preview environments", "Priority support"],
    cta: "Get started",
    featured: true,
  },
  {
    name: "Enterprise",
    desc: "Custom contracts, compliance, and SLAs.",
    price: "Custom",
    per: null,
    features: ["Private clusters", "SOC 2 Type II", "SSO / SAML", "Dedicated SRE", "Custom MSA"],
    cta: "Contact sales",
    featured: false,
  },
];

function SectionHeader({ label, title, desc, center = false }: { label: string; title: string; desc?: string; center?: boolean }) {
  return (
    <div style={{ textAlign: center ? "center" : "left" }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3A7DFF", marginBottom: "0.75rem" }}>
        {label}
      </p>
      <h2 style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700,
        fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
        letterSpacing: "-0.025em",
        lineHeight: 1.15,
        marginBottom: "1rem",
      }}>
        {title}
      </h2>
      {desc && (
        <p style={{ color: "rgba(244,244,246,0.55)", fontSize: "1.05rem", fontWeight: 300, maxWidth: 520, lineHeight: 1.75, margin: center ? "0 auto" : undefined }}>
          {desc}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="digi-noise" />
      <main>
        <HeroSection />


        {/* Features */}
        <section id="features" style={{ padding: "6rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <SectionHeader
              label="Platform"
              title="Everything your services need."
              desc="From a single API to hundreds of microservices — digi gives you the primitives to build without limits."
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.25px",
              marginTop: "4rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              overflow: "hidden",
            }}>
              {FEATURES.map(f => (
                <div key={f.title} className="digi-feature-card">
                  <div style={{
                    width: 40,
                    height: 40,
                    background: "rgba(58,125,255,0.10)",
                    border: "1px solid rgba(58,125,255,0.20)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.25rem",
                    fontSize: "1.1rem",
                  }}>
                    {f.icon}
                  </div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>
                    {f.title}
                  </p>
                  <p style={{ color: "rgba(244,244,246,0.55)", fontSize: "0.9rem", fontWeight: 300, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deploy / Config section */}
        <section id="deploy" style={{
          padding: "6rem 1.5rem",
          background: "#18181b",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }} className="grid lg:grid-cols-2 grid-cols-1">
              <div>
                <SectionHeader
                  label="Configuration"
                  title="One file. Infinite services."
                  desc=""
                />
                <p style={{ color: "rgba(244,244,246,0.55)", fontSize: "1.05rem", fontWeight: 300, maxWidth: 520, lineHeight: 1.75, marginBottom: "2rem" }}>
                  Describe your entire infrastructure in a single{" "}
                  <code style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.9em", color: "#93b4ff" }}>digi.toml</code>.
                  {" "}Services, databases, queues, and routing — all versioned alongside your code.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                  {CONFIG_CHECKS.map(c => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(244,244,246,0.55)", fontSize: "0.9rem", fontWeight: 300 }}>
                      <span style={{ color: "#3A7DFF", fontSize: "0.8rem", flexShrink: 0 }}>✓</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
              <CodeBlock lines={CONFIG_LINES} filename="digi.toml" language="toml" />
            </div>
          </div>
        </section>


        {/* Pricing */}
        <section id="pricing" style={{
          padding: "6rem 1.5rem",
          background: "#18181b",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
            <SectionHeader
              center
              label="Pricing"
              title="Pay for what you run."
              desc="No seat licenses. No hidden fees. Usage-based pricing that scales with you."
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25px",
              marginTop: "3.5rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              overflow: "hidden",
            }}>
              {PLANS.map(p => (
                <div key={p.name} style={{
                  background: p.featured
                    ? "linear-gradient(160deg, rgba(58,125,255,0.08), rgba(58,125,255,0.02))"
                    : "#1E1E23",
                  padding: "2.5rem 2rem",
                  textAlign: "left",
                }}>
                  {p.featured && (
                    <div style={{
                      display: "inline-block",
                      background: "#3A7DFF",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "0.2rem 0.6rem",
                      borderRadius: 4,
                      marginBottom: "1.5rem",
                    }}>Most popular</div>
                  )}
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "1.1rem", letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>{p.name}</div>
                  <div style={{ color: "rgba(244,244,246,0.55)", fontSize: "0.85rem", fontWeight: 300, marginBottom: "2rem" }}>{p.desc}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "2.75rem", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {p.price}
                    {p.per && <span style={{ fontSize: "0.9rem", color: "rgba(244,244,246,0.55)", fontWeight: 300 }}> {p.per}</span>}
                  </div>
                  <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", color: "rgba(244,244,246,0.55)" }}>
                        <span style={{ color: "#3A7DFF", fontSize: "0.8rem", flexShrink: 0 }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "2rem" }}>
                    {p.featured
                      ? <BtnPrimary large style={{ display: "flex", width: "100%", padding: "0.7rem" }}>{p.cta}</BtnPrimary>
                      : <BtnOutline large block style={{ padding: "0.7rem" }}>{p.cta}</BtnOutline>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "7rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 300,
            background: "radial-gradient(ellipse, rgba(58,125,255,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <h2 style={{
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            maxWidth: 600,
            margin: "0 auto 1.5rem",
          }}>
            Ship your first service in<br />
            <span style={{ color: "#3A7DFF" }}>under five minutes.</span>
          </h2>
          <p style={{ color: "rgba(244,244,246,0.55)", fontSize: "1rem", fontWeight: 300, marginBottom: "2.5rem" }}>
            No credit card required. Cancel anytime.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <BtnPrimary large>Start building for free</BtnPrimary>
            <BtnOutline large>Talk to us</BtnOutline>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "3rem 1.5rem" }}>
          <div style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}>
            <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <img
                src="/no_background/digi_icon_mark-transparent.png"
                alt="Digi"
                style={{ width: 22, height: 22, opacity: 0.5 }}
              />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "1.1rem", color: "rgba(244,244,246,0.55)" }}>digi</span>
            </a>
            <div style={{ display: "flex", gap: "1.75rem", flexWrap: "wrap" }}>
              {["Docs", "Status", "Blog", "Privacy", "Terms"].map(l => (
                <a
                  key={l}
                  href="#"
                  style={{
                    color: "#5A5D67",
                    fontSize: "0.8rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "rgba(244,244,246,0.55)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#5A5D67"}
                >
                  {l}
                </a>
              ))}
            </div>
            <span style={{ color: "#5A5D67", fontSize: "0.75rem" }}>© 2026 digi. All rights reserved.</span>
          </div>
        </footer>
      </main>
    </>
  );
}
