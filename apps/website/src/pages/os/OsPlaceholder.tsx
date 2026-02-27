/**
 * Placeholder for OS Dashboard pages during migration.
 * Will be replaced with actual page components as they are migrated.
 */
import { useLocation } from "react-router-dom";
import { Box, BarChart3, LayoutDashboard, Settings } from "lucide-react";

const PAGE_META: Record<string, { title: string; icon: any; description: string }> = {
  "/os/insights": {
    title: "인사이트 허브",
    icon: LayoutDashboard,
    description: "고객 행동 분석, 매장 KPI, 퍼널 분석을 한눈에 확인합니다.",
  },
  "/os/studio": {
    title: "디지털트윈 스튜디오",
    icon: Box,
    description: "3D 매장 시뮬레이션과 레이아웃 최적화를 실행합니다.",
  },
  "/os/roi": {
    title: "ROI 측정",
    icon: BarChart3,
    description: "매장 최적화의 투자 대비 수익을 측정합니다.",
  },
  "/os/settings": {
    title: "설정 & 관리",
    icon: Settings,
    description: "매장 정보, 데이터 소스, 사용자 관리를 설정합니다.",
  },
};

export default function OsPlaceholder() {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || {
    title: "페이지",
    icon: LayoutDashboard,
    description: "준비 중입니다.",
  };
  const Icon = meta.icon;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{meta.title}</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {meta.description}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        마이그레이션 진행 중 — 곧 완료됩니다
      </div>
    </div>
  );
}
