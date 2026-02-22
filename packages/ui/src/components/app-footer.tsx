export function AppFooter() {
  return (
    <footer className="flex items-center justify-center gap-4 border-t border-white/[0.06] py-4 text-xs text-neutral-600">
      <span>© {new Date().getFullYear()} Digi. All rights reserved.</span>
      <span className="text-neutral-800">·</span>
      <a
        href="https://docs.digi.bnhm.dev"
        className="transition-colors hover:text-neutral-400"
      >
        Docs
      </a>
      <span className="text-neutral-800">·</span>
      <a
        href="https://github.com/digi-microservices"
        className="transition-colors hover:text-neutral-400"
      >
        GitHub
      </a>
    </footer>
  );
}
