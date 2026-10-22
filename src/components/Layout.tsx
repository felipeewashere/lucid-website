import { useLocation } from "react-router-dom";
import { SideNav, MobileNav } from "./Navigation";
import { AnimatedBackground } from "./AnimatedBackground";
import { Cobwebs } from "./Cobwebs";

function Bat({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 28" className={className} style={style} fill="currentColor" aria-hidden="true">
      <g className="wing">
        <path d="M32 14 C26 4 14 2 2 8 C8 9 10 13 9 18 C13 14 17 14 20 19 C22 15 27 14 32 20Z" />
        <path d="M32 14 C38 4 50 2 62 8 C56 9 54 13 55 18 C51 14 47 14 44 19 C42 15 37 14 32 20Z" />
      </g>
      <ellipse cx="32" cy="16" rx="3.2" ry="6" />
      <path d="M29.5 11 L30.5 6 L32 9 L33.5 6 L34.5 11Z" />
    </svg>
  );
}

/** Slow-flying bats + low orange fog, purely decorative. */
function Haunt() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <div className="fog absolute inset-0" />
      <Bat className="bat-fly absolute left-0 top-[14%] h-5 w-12 text-black/80 drop-shadow-[0_0_6px_hsl(var(--witch)/0.8)]" />
      <Bat
        className="bat-fly absolute left-0 top-[34%] h-4 w-9 text-black/70 drop-shadow-[0_0_6px_hsl(var(--pumpkin)/0.7)]"
        style={{ animationDuration: "31s", animationDelay: "-12s" }}
      />
      <Bat
        className="bat-fly absolute left-0 top-[58%] h-6 w-14 text-black/80 drop-shadow-[0_0_8px_hsl(var(--witch)/0.8)]"
        style={{ animationDuration: "27s", animationDelay: "-20s" }}
      />
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="relative min-h-screen bg-background">
      <AnimatedBackground />
      <Haunt />
      {pathname === "/" && <Cobwebs />}
      <SideNav />
      <MobileNav />
      <main className="relative z-10 overflow-x-clip md:pl-16 pt-14 md:pt-0">
        <div className="mx-auto max-w-[1120px] px-4 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
