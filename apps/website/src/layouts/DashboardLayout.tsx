/**
 * DashboardLayout — authenticated layout shell for OS Dashboard pages.
 *
 * Wraps SelectedStoreProvider around protected content.
 * Sidebar navigation + header + content area.
 * This is a simplified version; the full OS Dashboard layout with
 * chat panel and notifications will be migrated in Phase 2.
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
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { SelectedStoreProvider } from "@/providers/SelectedStoreProvider";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "인사이트 허브", href: "/os/insights", icon: LayoutDashboard },
  { label: "디지털트윈 스튜디오", href: "/os/studio", icon: Box },
  { label: "ROI 측정", href: "/os/roi", icon: BarChart3 },
  { label: "설정 & 관리", href: "/os/settings", icon: Settings },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Sync dark mode on mount (OS Dashboard defaults to light)
  useEffect(() => {
    const saved = localStorage.getItem("neuraltwin-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SelectedStoreProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <aside
          className={`flex flex-col border-r border-border bg-card transition-all duration-200 ${
            collapsed ? "w-16" : "w-60"
          }`}
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
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-2 border-t border-border">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User size={14} />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className={`w-full justify-start ${collapsed ? "px-3" : ""}`}
            >
              <LogOut size={14} />
              {!collapsed && <span className="ml-2">로그아웃</span>}
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SelectedStoreProvider>
  );
}
