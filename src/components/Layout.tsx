import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const loc = useLocation();
  const nav = [
    { to: "/", label: "Home" },
    { to: "/listings", label: "Listings" },
    { to: "/agents", label: "Agents" },
  ];
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 md:px-8 bg-surface border-b border-[#30363d]">
        <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold font-display text-[#e6edf3] no-underline hover:underline">
          <span className="text-2xl">🏠</span>
          <span>Yangon Real Estate</span>
        </Link>
        <nav className="flex flex-wrap gap-4 sm:gap-6">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`font-medium no-underline hover:underline ${
                loc.pathname === to ? "text-accent" : "text-text-muted"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
        {children}
      </main>
      <footer className="py-6 px-4 sm:px-6 md:px-8 text-center bg-surface border-t border-[#30363d] text-text-muted text-sm">
        <p>Yangon Real Estate — Homes & Apartments in Yangon. Dummy data for demo.</p>
      </footer>
    </div>
  );
}
