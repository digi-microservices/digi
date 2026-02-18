export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/no_background/digi_icon_mark-transparent.png"
              alt="Digi"
              className="w-6 h-6"
            />
            <span className="text-sm text-zinc-500">
              © 2026 Digi. Microservice infrastructure for the modern web.
            </span>
          </div>

          <div className="flex gap-8 text-sm text-zinc-400">
            <a href="#" className="hover:text-white transition">Docs</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a href="mailto:digi@bnhm.dev" className="hover:text-white transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
