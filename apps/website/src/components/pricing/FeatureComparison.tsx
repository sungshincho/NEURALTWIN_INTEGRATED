import { Check, Minus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CellValue = boolean | string;

interface FeatureRow {
  name: string;
  trial: CellValue;
  starter: CellValue;
  growth: CellValue;
  enterprise: CellValue;
}

interface FeatureCategory {
  category: string;
  rows: FeatureRow[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TIERS = ["Trial", "Starter", "Growth", "Enterprise"] as const;

const COMPARISON_DATA: FeatureCategory[] = [
  {
    category: "데이터 수집",
    rows: [
      { name: "매장 수", trial: "1개", starter: "3개", growth: "50개", enterprise: "무제한" },
      { name: "WiFi Probe 센서", trial: false, starter: true, growth: true, enterprise: true },
      { name: "실시간 데이터 수집", trial: false, starter: true, growth: true, enterprise: true },
      { name: "POS 연동", trial: false, starter: false, growth: true, enterprise: true },
      { name: "외부 데이터 연동 (날씨/공휴일)", trial: false, starter: false, growth: true, enterprise: true },
      { name: "커스텀 IoT 센서 연동", trial: false, starter: false, growth: false, enterprise: true },
    ],
  },
  {
    category: "AI 분석",
    rows: [
      { name: "AI 질의 (월)", trial: "10회", starter: "무제한", growth: "무제한", enterprise: "무제한" },
      { name: "기본 대시보드", trial: true, starter: true, growth: true, enterprise: true },
      { name: "고객 동선 분석", trial: false, starter: true, growth: true, enterprise: true },
      { name: "히트맵 분석", trial: false, starter: false, growth: true, enterprise: true },
      { name: "이상 탐지 알림", trial: false, starter: false, growth: true, enterprise: true },
      { name: "수요 예측 (AI)", trial: false, starter: false, growth: true, enterprise: true },
      { name: "전용 AI 모델 튜닝", trial: false, starter: false, growth: false, enterprise: true },
    ],
  },
  {
    category: "3D 디지털 트윈",
    rows: [
      { name: "매장 3D 뷰어", trial: "샘플", starter: false, growth: false, enterprise: true },
      { name: "레이아웃 시뮬레이션", trial: false, starter: false, growth: false, enterprise: true },
      { name: "시나리오 비교 분석", trial: false, starter: false, growth: false, enterprise: true },
      { name: "실시간 3D 동선 오버레이", trial: false, starter: false, growth: false, enterprise: true },
    ],
  },
  {
    category: "보고서",
    rows: [
      { name: "일일 요약 리포트", trial: false, starter: true, growth: true, enterprise: true },
      { name: "PDF 리포트 내보내기", trial: false, starter: true, growth: true, enterprise: true },
      { name: "주간/월간 자동 리포트", trial: false, starter: false, growth: true, enterprise: true },
      { name: "커스텀 리포트 빌더", trial: false, starter: false, growth: false, enterprise: true },
      { name: "API 데이터 내보내기", trial: false, starter: false, growth: false, enterprise: true },
    ],
  },
  {
    category: "지원",
    rows: [
      { name: "이메일 지원", trial: true, starter: true, growth: true, enterprise: true },
      { name: "우선 응대 (24h)", trial: false, starter: false, growth: true, enterprise: true },
      { name: "전담 CSM 매니저", trial: false, starter: false, growth: false, enterprise: true },
      { name: "온보딩 컨설팅", trial: false, starter: false, growth: false, enterprise: true },
      { name: "SLA 보장 (99.9%)", trial: false, starter: false, growth: false, enterprise: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Cell renderer
// ---------------------------------------------------------------------------

const CellIcon = ({ value }: { value: CellValue }) => {
  if (typeof value === "string") {
    return <span className="text-sm font-medium">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto h-5 w-5 text-primary" />;
  }
  return <Minus className="mx-auto h-5 w-5 text-muted-foreground/30" />;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FeatureComparison = () => {
  return (
    <div className="w-full">
      <h2 className="mb-8 text-center text-3xl font-bold">
        <span className="gradient-text">상세 기능 비교</span>
      </h2>

      {/* Tier header row (sticky on desktop) */}
      <div className="mb-2 hidden md:grid md:grid-cols-5 gap-4 rounded-xl glass px-6 py-4">
        <div /> {/* empty cell for row-name column */}
        {TIERS.map((tier) => (
          <div key={tier} className="text-center text-sm font-semibold">
            {tier}
          </div>
        ))}
      </div>

      {/* Accordion per category */}
      <Accordion type="multiple" defaultValue={COMPARISON_DATA.map((c) => c.category)}>
        {COMPARISON_DATA.map((cat) => (
          <AccordionItem key={cat.category} value={cat.category} className="border-border/30">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              {cat.category}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1">
                {cat.rows.map((row, idx) => (
                  <div
                    key={row.name}
                    className={cn(
                      "grid grid-cols-2 md:grid-cols-5 gap-4 rounded-lg px-6 py-3 text-sm",
                      idx % 2 === 0 ? "bg-muted/20" : "",
                    )}
                  >
                    {/* Feature name */}
                    <div className="col-span-2 md:col-span-1 font-medium">
                      {row.name}
                    </div>

                    {/* Values per tier */}
                    {(["trial", "starter", "growth", "enterprise"] as const).map(
                      (tier) => (
                        <div
                          key={tier}
                          className="flex items-center justify-between md:justify-center"
                        >
                          {/* Show tier label on mobile only */}
                          <span className="text-xs text-muted-foreground md:hidden">
                            {tier === "trial"
                              ? "Trial"
                              : tier === "starter"
                                ? "Starter"
                                : tier === "growth"
                                  ? "Growth"
                                  : "Enterprise"}
                          </span>
                          <CellIcon value={row[tier]} />
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
