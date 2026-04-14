import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  message?: string;
  error?: string;
}

export function Layout({ children, message, error }: LayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const location = useLocation();

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("client-theme");
    const resolvedTheme = storedTheme === "dark" ? "dark" : "light";
    setTheme(resolvedTheme);
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, []);

  function updateTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    window.localStorage.setItem("client-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  const navItems = [
    { label: "Dashboard", path: "/admin" },
    { label: "Catalogue", path: "/admin/catalogue" },
    { label: "Inventory", path: "/admin/inventory" },
    { label: "Orders", path: "/admin/orders" },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--line)] bg-[var(--panel-strong)] p-6 transition-all md:relative">
        <div className="flex flex-col h-full gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-black tracking-tighter uppercase text-[var(--accent)]">Admin Portal</h2>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                    location.pathname === item.path
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-soft)]"
                      : "hover:bg-[var(--accent-soft)]"
                  }`}
                >
                  <span className="font-bold text-sm tracking-wide">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-hidden relative">
        <header className="sticky top-0 z-40 h-16 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md px-6 flex items-center justify-between">
           <h1 className="text-lg font-bold tracking-tight">
            {navItems.find(i => i.path === location.pathname)?.label || 'Product Details'}
           </h1>
           <div className="flex items-center gap-6">
             {message && <span className="text-sm text-[var(--muted)] animate-fade-in font-medium">{message}</span>}
             {error && <span className="text-sm text-red-500 animate-pulse font-bold">{error}</span>}
             
             <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--line)] hover:bg-[var(--accent-soft)] transition-all duration-200 text-xs font-bold uppercase tracking-widest"
                onClick={() => updateTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? "Switch to Dark" : "Switch to Light"}
              </button>
           </div>
        </header>
        
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
