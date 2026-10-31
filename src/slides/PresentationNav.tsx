/** Bara fixă de sus, ca header-ul de pe cfo.ro: navy translucid, logo stânga, speaker dreapta. */
export default function PresentationNav() {
  return (
    <nav className="deck-ui fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-3 md:py-4 pointer-events-none" style={{ background: "rgba(0, 9, 66, 0.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="pointer-events-auto flex items-center gap-3">
        <img src="/logo-cfo.png" alt="CFO" width={140} height={35} className="h-8 md:h-9 w-auto" />
        <span className="hidden md:inline text-white/40 text-sm">·</span>
        <span className="hidden md:inline text-white/80 text-sm font-semibold tracking-wide">Freedom Number</span>
      </div>
      <div className="pointer-events-auto text-right">
        <div className="font-semibold text-sm md:text-base text-white">Alin Vlad</div>
        <div className="text-xs md:text-sm text-white/50">CFO Fracționat &amp; Fondator CFO.ro</div>
      </div>
    </nav>
  );
}
