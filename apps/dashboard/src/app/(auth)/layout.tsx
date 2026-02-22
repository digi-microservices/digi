import Image from "next/image";
import "~/styles/globals.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-charcoal px-4 py-8">
      {/* Noise overlay */}
      <div className="digi-noise" />

      {/* Primary radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="h-[400px] w-[700px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(58,125,255,0.12) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Secondary bottom glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2">
        <div
          className="h-[300px] w-[600px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(58,125,255,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Image
              src="/no_background/digi_icon_mark-transparent.png"
              alt="Digi"
              width={28}
              height={28}
            />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
