import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Code2,
  Monitor,
  Image,
  KeyRound,
  LogIn,
  Menu,
  X,
  User,
  Star,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import lucidLogo from "@/assets/lucid-logo-new.png";

const DISCORD_INVITE = "https://discord.gg/YVZTPWHBNz";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Code2, label: "Scripts", path: "/scripts" },
  { icon: Monitor, label: "Executors", path: "/executors" },
  { icon: Image, label: "Showcases", path: "/showcases" },
  { icon: KeyRound, label: "Key", path: "/key" },
  { icon: Star, label: "Reviews", path: "/reviews" },
  { icon: FileText, label: "Terms", path: "/tos" },
];

export function SideNav() {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed left-0 top-0 z-50 hidden h-screen w-16 flex-col items-center border-r border-border bg-background py-8 md:flex">
      {/* Logo */}
      <Link to="/" className="mb-10">
        <img src={lucidLogo} alt="Lucid: REWRITE" className="h-10 w-10 object-contain" style={{ filter: "invert(1) brightness(10)" }} />
      </Link>

      {/* Nav items */}
      <div className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="group relative flex h-10 w-10 items-center justify-center"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center transition-colors duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <item.icon size={18} strokeWidth={1.5} />
              </div>

              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -left-[1px] top-1 h-8 w-[2px] bg-primary shadow-[0_0_12px_hsl(var(--pumpkin))]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <AnimatePresence>
                {hoveredItem === item.path && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-14 z-50 rounded border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground whitespace-nowrap"
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {/* Discord + Auth */}
      <div className="flex flex-col items-center gap-2">
        {/* Discord */}
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          onMouseEnter={() => setHoveredItem("discord")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
          </svg>
          <AnimatePresence>
            {hoveredItem === "discord" && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-14 z-50 rounded border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground"
              >
                Discord
              </motion.div>
            )}
          </AnimatePresence>
        </a>

        {/* Auth */}
        <Link
          to={isLoggedIn ? "/dashboard" : "/login"}
          className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          onMouseEnter={() => setHoveredItem("auth")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {isLoggedIn ? <User size={18} strokeWidth={1.5} /> : <LogIn size={18} strokeWidth={1.5} />}
          <AnimatePresence>
            {hoveredItem === "auth" && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-14 z-50 rounded border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground"
              >
                {isLoggedIn ? "Dashboard" : "Login"}
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </nav>
  );
}

export function MobileNav() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img src={lucidLogo} alt="Lucid: REWRITE" className="h-8 w-8 object-contain" style={{ filter: "invert(1) brightness(10)" }} />
          <span className="font-mono text-base font-bold text-foreground tracking-wider">LUCID: REWRITE</span>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="text-foreground">
          {isOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background pt-14 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col p-6 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 font-mono text-sm tracking-wider transition-colors ${
                    location.pathname === item.path
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon size={16} strokeWidth={1.5} />
                  {item.label.toUpperCase()}
                </Link>
              ))}
              <div className="my-4 border-t border-border" />
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
                DISCORD
              </a>
              <Link
                to={isLoggedIn ? "/dashboard" : "/login"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 font-mono text-sm tracking-wider text-muted-foreground hover:text-foreground"
              >
                {isLoggedIn ? <User size={16} strokeWidth={1.5} /> : <LogIn size={16} strokeWidth={1.5} />}
                {isLoggedIn ? "DASHBOARD" : "LOGIN"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
