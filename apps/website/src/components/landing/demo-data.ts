/**
 * demo-data.ts
 *
 * Mock data for the Interactive Landing Demo section.
 * 3 retail scenarios: fashion boutique, beauty flagship, department food court.
 * All text in Korean.
 */

export type ScenarioId = "fashion" | "beauty" | "department";

export interface DemoMetric {
  label: string;
  value: string;
  rawValue: number; // for animated counter
  suffix?: string;
  trend: number; // e.g. +8.3 or -2.1
  trendUnit: string; // "%" or "%p"
}

export interface DemoZone {
  id: string;
  name: string;
  traffic: number; // 0-100 normalized
  color: string; // tailwind-compatible color or hex
  visitors: number;
  gridArea?: string; // CSS grid area name
}

export interface DemoScenario {
  id: ScenarioId;
  storeName: string;
  storeType: string;
  icon: string; // emoji or icon name
  tagline: string;
  metrics: DemoMetric[];
  zones: DemoZone[];
  aiInsight: string;
  gridTemplate: string; // CSS grid-template-areas
  gridCols: number;
  gridRows: number;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "fashion",
    storeName: "강남 플래그십 스토어",
    storeType: "패션 부티크",
    icon: "shirt",
    tagline: "고객 동선 최적화",
    metrics: [
      {
        label: "오늘 방문자",
        value: "12,847",
        rawValue: 12847,
        suffix: "명",
        trend: 8.3,
        trendUnit: "%",
      },
      {
        label: "전환율",
        value: "3.8",
        rawValue: 3.8,
        suffix: "%",
        trend: -0.2,
        trendUnit: "%p",
      },
      {
        label: "일 매출",
        value: "4,200",
        rawValue: 4200,
        suffix: "만원",
        trend: 6.1,
        trendUnit: "%",
      },
      {
        label: "평균 체류",
        value: "4:12",
        rawValue: 252,
        suffix: "",
        trend: 12,
        trendUnit: "%",
      },
    ],
    zones: [
      { id: "entrance", name: "입구", traffic: 95, color: "#ef4444", visitors: 12847, gridArea: "entrance" },
      { id: "display-a", name: "디스플레이 A", traffic: 72, color: "#f97316", visitors: 8420, gridArea: "displayA" },
      { id: "display-b", name: "디스플레이 B", traffic: 55, color: "#eab308", visitors: 6120, gridArea: "displayB" },
      { id: "fitting", name: "피팅룸", traffic: 40, color: "#22c55e", visitors: 3840, gridArea: "fitting" },
      { id: "checkout", name: "계산대", traffic: 30, color: "#3b82f6", visitors: 2480, gridArea: "checkout" },
      { id: "vip", name: "VIP 라운지", traffic: 15, color: "#6366f1", visitors: 890, gridArea: "vip" },
    ],
    aiInsight:
      "오후 2~4시 디스플레이 B존 체류시간이 전주 대비 -22% 하락했습니다. 입구에서 B존으로 유도하는 POP 사이니지 추가를 권장합니다.",
    gridTemplate: `
      "entrance entrance displayA displayA"
      "displayB displayB fitting fitting"
      "checkout checkout vip vip"
    `,
    gridCols: 4,
    gridRows: 3,
  },
  {
    id: "beauty",
    storeName: "올리브영 성수점",
    storeType: "뷰티 플래그십",
    icon: "sparkles",
    tagline: "존별 체류 분석",
    metrics: [
      {
        label: "오늘 방문자",
        value: "8,420",
        rawValue: 8420,
        suffix: "명",
        trend: 3.1,
        trendUnit: "%",
      },
      {
        label: "전환율",
        value: "5.2",
        rawValue: 5.2,
        suffix: "%",
        trend: 0.4,
        trendUnit: "%p",
      },
      {
        label: "일 매출",
        value: "2,800",
        rawValue: 2800,
        suffix: "만원",
        trend: 4.7,
        trendUnit: "%",
      },
      {
        label: "평균 체류",
        value: "3:45",
        rawValue: 225,
        suffix: "",
        trend: -5,
        trendUnit: "%",
      },
    ],
    zones: [
      { id: "skincare", name: "스킨케어", traffic: 70, color: "#3b82f6", visitors: 5200, gridArea: "skincare" },
      { id: "makeup", name: "메이크업", traffic: 60, color: "#ec4899", visitors: 4100, gridArea: "makeup" },
      { id: "fragrance", name: "향수", traffic: 45, color: "#a855f7", visitors: 2800, gridArea: "fragrance" },
      { id: "tester", name: "테스터존", traffic: 90, color: "#ef4444", visitors: 6840, gridArea: "tester" },
      { id: "haircare", name: "헤어케어", traffic: 35, color: "#22c55e", visitors: 1950, gridArea: "haircare" },
      { id: "supplement", name: "건강식품", traffic: 25, color: "#14b8a6", visitors: 1200, gridArea: "supplement" },
      { id: "checkout-b", name: "계산대", traffic: 50, color: "#f97316", visitors: 3600, gridArea: "checkout" },
    ],
    aiInsight:
      "테스터존 방문 고객의 구매 전환율은 12.8%로, 미방문 고객(2.1%) 대비 6배 높습니다. 테스터존 접근성을 높이는 레이아웃 변경을 추천합니다.",
    gridTemplate: `
      "skincare skincare makeup makeup"
      "fragrance tester tester haircare"
      "supplement supplement checkout checkout"
    `,
    gridCols: 4,
    gridRows: 3,
  },
  {
    id: "department",
    storeName: "현대백화점 판교점",
    storeType: "백화점 식품관",
    icon: "building",
    tagline: "층별 트래픽 분석",
    metrics: [
      {
        label: "오늘 방문자",
        value: "24,510",
        rawValue: 24510,
        suffix: "명",
        trend: -2.1,
        trendUnit: "%",
      },
      {
        label: "전환율",
        value: "6.1",
        rawValue: 6.1,
        suffix: "%",
        trend: 0.1,
        trendUnit: "%p",
      },
      {
        label: "일 매출",
        value: "18,700",
        rawValue: 18700,
        suffix: "만원",
        trend: 1.2,
        trendUnit: "%",
      },
      {
        label: "평균 체류",
        value: "8:45",
        rawValue: 525,
        suffix: "",
        trend: 3,
        trendUnit: "%",
      },
    ],
    zones: [
      { id: "b1-food", name: "B1 식품관", traffic: 85, color: "#ef4444", visitors: 8920, gridArea: "b1food" },
      { id: "f1-cosmetics", name: "1F 화장품", traffic: 75, color: "#f97316", visitors: 7200, gridArea: "f1cosm" },
      { id: "f1-acc", name: "1F 잡화", traffic: 60, color: "#eab308", visitors: 5400, gridArea: "f1acc" },
      { id: "f2-women", name: "2F 여성패션", traffic: 55, color: "#22c55e", visitors: 4800, gridArea: "f2women" },
      { id: "f3-men", name: "3F 남성패션", traffic: 20, color: "#6366f1", visitors: 1960, gridArea: "f3men" },
      { id: "f4-living", name: "4F 리빙", traffic: 40, color: "#3b82f6", visitors: 3200, gridArea: "f4living" },
      { id: "f4-kids", name: "4F 아동", traffic: 30, color: "#14b8a6", visitors: 2100, gridArea: "f4kids" },
      { id: "escalator", name: "에스컬레이터", traffic: 70, color: "#a855f7", visitors: 6500, gridArea: "esc" },
    ],
    aiInsight:
      "3F 남성패션 층 방문객이 전체의 8%로 가장 낮습니다. 2F에서 3F로의 이동률이 23%에 불과합니다. 연결 구역에 시즌 프로모션 안내판 설치를 권장합니다.",
    gridTemplate: `
      "b1food b1food f1cosm f1acc"
      "f2women f2women esc f3men"
      "f4living f4living esc f4kids"
    `,
    gridCols: 4,
    gridRows: 3,
  },
];
