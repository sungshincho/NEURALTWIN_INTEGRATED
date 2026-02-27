/**
 * DashboardLayout — authenticated layout shell for OS Dashboard pages.
 *
 * Wraps SelectedStoreProvider around protected content.
 * Sidebar navigation (desktop) + header bar + mobile bottom tab bar.
 *
 * P2-2: Added top header bar (store selector, notifications, theme toggle, user avatar),
 *        mobile bottom tab bar, hamburger menu, and sidebar accent improvements.
 */
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Box,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Store,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { SelectedStoreProvider } from "@/providers/SelectedStoreProvider";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "인사이트 허브", href: "/os/insights", icon: LayoutDashboard },
  { label: "디지털트윈 스튜디오", href: "/os/studio", icon: Box },
  { label: "ROI 측정", href: "/os/roi", icon: BarChart3 },
  { label: "설정 & 관리", href: "/os/settings", icon: Settings },
];

/* ---------- Inline sub-components ---------- */

/** Store selector dropdown using SelectedStoreProvider context */
function StoreSelector() {
  const { selectedStore, stores, setSelectedStore, loading } =
    useSelectedStore();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Store size={16} />
        <span className="hidden sm:inline">로딩 중...</span>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Store size={16} />
        <span className="hidden sm:inline">매장을 등록해주세요</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Store size={16} className="text-muted-foreground shrink-0" />
      <select
        value={selectedStore?.id || ""}
        onChange={(e) => {
          const store = stores.find((s) => s.id === e.target.value);
          if (store) setSelectedStore(store);
        }}
        className="bg-transparent border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent max-w-[200px] truncate"
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.store_name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Theme toggle (dark/light) */
function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark"),
  );

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("neuraltwin-theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      title="테마 전환"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

/** User avatar button (shows initials or icon) */
function UserAvatar({ email }: { email?: string }) {
  const initial = email ? email[0].toUpperCase() : "";

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-semibold cursor-default select-none"
      title={email || "User"}
    >
      {initial || <User size={14} />}
    </div>
  );
}

/* ---------- Main layout ---------- */

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync dark mode on mount
  useEffect(() => {
    const saved = localStorage.getItem("neuraltwin-theme");
    if (saved === "dark" || !saved) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SelectedStoreProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* ---- Mobile sidebar overlay ---- */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ---- Sidebar (desktop: always visible, mobile: slide-in) ---- */}
        <aside
          className={`
            flex flex-col border-r border-border bg-card transition-all duration-200
            ${collapsed ? "w-16" : "w-60"}
            hidden md:flex
          `}
        >
          {/* Logo */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-border">
            {!collapsed && (
              <Link to="/" className="text-sm font-bold tracking-tight">
                NEURALTWIN
              </Link>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded hover:bg-muted"
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer — simplified (avatar only, no email/logout) */}
          <div className="p-2 border-t border-border">
            <div className="flex items-center justify-center px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User size={14} />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 ml-2">
                  <p className="text-xs font-medium truncate text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ---- Mobile sidebar (slide-in) ---- */}
        <aside
          className={`
            fixed top-0 left-0 z-50 h-full w-60 flex flex-col border-r border-border bg-card
            transition-transform duration-200 md:hidden
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Mobile sidebar header */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-border">
            <Link
              to="/"
              className="text-sm font-bold tracking-tight"
              onClick={() => setMobileSidebarOpen(false)}
            >
              NEURALTWIN
            </Link>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded hover:bg-muted"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mobile nav */}
          <nav className="flex-1 p-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile sidebar footer */}
          <div className="p-2 border-t border-border space-y-1">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User size={14} />
              </div>
              <p className="text-xs font-medium truncate text-muted-foreground flex-1 min-w-0">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              <LogOut size={14} />
              <span className="ml-2">로그아웃</span>
            </Button>
          </div>
        </aside>

        {/* ---- Main area (header + content) ---- */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top header bar */}
          <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 shrink-0 bg-card/50 backdrop-blur-sm">
            {/* Left: hamburger (mobile) + store selector */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-1 rounded hover:bg-muted"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="메뉴 열기"
              >
                <Menu size={20} />
              </button>
              <StoreSelector />
            </div>

            {/* Right: notifications + theme + user + logout */}
            <div className="flex items-center gap-1.5">
              <button
                className="p-2 rounded-lg hover:bg-muted transition-colors relative"
                title="알림"
              >
                <Bell size={18} />
              </button>
              <ThemeToggle />
              <UserAvatar email={user?.email} />
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ml-1"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>

          {/* Content area with mobile bottom padding for tab bar */}
          <div className="flex-1 overflow-auto pb-16 md:pb-0">
            <Outlet />
          </div>
        </main>

        {/* ---- Mobile bottom tab bar (md breakpoint and below) ---- */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-30">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-0 ${
                  active
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium leading-tight truncate max-w-[60px]">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </SelectedStoreProvider>
  );
}
