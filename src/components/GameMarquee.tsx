const supportedGames = [
  "Blox Fruits",
  "Pet Simulator 99",
  "Arsenal",
  "Doors",
  "Jailbreak",
  "Tower Defense",
  "Royale High",
  "Da Hood",
  "Blue Lock Rivals",
];

export function GameMarquee() {
  return (
    <div className="relative border-y border-white/[0.06] bg-white/[0.012] py-4">
      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-9 pr-9 sm:gap-12 sm:pr-12"
            >
              {supportedGames.map((game) => (
                <span key={`${copy}-${game}`} className="flex items-center gap-9 sm:gap-12">
                  <span className="whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.26em] text-white/30 transition-colors hover:text-white/60">
                    {game}
                  </span>
                  <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-neon/40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
