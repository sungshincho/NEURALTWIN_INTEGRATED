export interface CaseStudyStat {
  value: string;
  label: string;
  /** positive = emerald, neutral = cyan */
  trend: "positive" | "neutral";
}

export interface PainPoint {
  title: string;
  description: string;
}

export interface TimelineStep {
  label: string;
  description: string;
}

export interface BeforeAfterMetric {
  label: string;
  before: string;
  after: string;
  change: string;
  /** true when improvement is a positive outcome */
  improved: boolean;
}

export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  industry: string;
  industryColor: string;
  /** Hero gradient placeholder */
  heroGradient: string;
  heroStat: { value: string; label: string };
  stats: CaseStudyStat[];
  problem: {
    sectionTitle: string;
    description: string;
    painPoints: PainPoint[];
  };
  solution: {
    sectionTitle: string;
    description: string;
    timeline: TimelineStep[];
    features: string[];
  };
  results: {
    sectionTitle: string;
    description: string;
    metrics: BeforeAfterMetric[];
  };
  testimonial: {
    quote: string;
    author: string;
    role: string;
    company: string;
  };
  seoTitle: string;
  seoDescription: string;
  relatedSlugs: string[];
}

export const caseStudies: CaseStudy[] = [
  // ── Fashion: Modeunique ───────────────────
  {
    slug: "modeunique-fashion",
    title: "Modeunique 강남 플래그십",
    subtitle: "고객 동선 최적화로 전환율 32% 향상",
    industry: "패션",
    industryColor: "purple",
    heroGradient: "from-purple-700 via-pink-600 to-rose-500",
    heroStat: { value: "+32%", label: "전환율 향상" },
    stats: [
      { value: "+32%", label: "전환율 향상", trend: "positive" },
      { value: "+28%", label: "월매출 증가", trend: "positive" },
      { value: "-45%", label: "피팅룸 대기시간", trend: "positive" },
      { value: "2개월", label: "도입 기간", trend: "neutral" },
    ],
    problem: {
      sectionTitle: "높은 트래픽, 낮은 전환의 역설",
      description:
        "Modeunique 강남 플래그십 스토어는 120평 규모의 프리미엄 패션 부티크입니다. 강남역 유동인구 덕분에 월 평균 15만 명이 방문하지만, 실제 구매 전환율은 업계 평균 이하인 8.2%에 머물러 있었습니다. 특히 피크 시간대에 피팅룸 앞 대기 줄이 길어지면서 고객 이탈이 빈번했고, 어떤 진열 구성이 효과적인지 데이터 없이 감으로 운영하고 있었습니다.",
      painPoints: [
        {
          title: "피팅룸 병목 현상",
          description:
            "피크 시간대 피팅룸 4개 앞에 평균 8명이 대기하며, 대기시간이 15분을 초과하면 65%의 고객이 이탈했습니다.",
        },
        {
          title: "비효율적 동선 설계",
          description:
            "매장 후면의 고마진 신상품 코너를 방문하는 고객이 전체의 23%에 불과했으나, 이를 파악할 데이터가 없었습니다.",
        },
        {
          title: "감에 의존하는 진열 변경",
          description:
            "매달 진열을 변경했지만 효과를 측정할 수 없어 시행착오를 반복하며 인력과 비용을 낭비하고 있었습니다.",
        },
      ],
    },
    solution: {
      sectionTitle: "NeuralTwin 히트맵 분석 + AI 추천",
      description:
        "NeuralTwin은 WiFi 프로브 센서 6대를 매장 천장에 설치하여 고객 동선을 실시간으로 수집하고, AI가 히트맵을 분석하여 최적 레이아웃을 추천했습니다. 피팅룸 운영을 예약제로 전환하고, 고마진 상품을 입구 동선에 재배치하는 전략을 시뮬레이션으로 사전 검증한 후 적용했습니다.",
      timeline: [
        { label: "DAY 1", description: "센서 6대 설치 (1.5시간)" },
        { label: "DAY 3", description: "첫 히트맵 데이터 확인" },
        { label: "WEEK 2", description: "AI 레이아웃 추천 수신" },
        { label: "MONTH 1", description: "피팅룸 예약제 도입" },
        { label: "MONTH 2", description: "레이아웃 변경 적용" },
      ],
      features: [
        "실시간 고객 동선 히트맵",
        "AI 기반 레이아웃 시뮬레이션",
        "피팅룸 수요 예측 & 예약 관리",
        "상품 배치 효과 A/B 테스트",
      ],
    },
    results: {
      sectionTitle: "2개월 만에 달성한 성과",
      description:
        "NeuralTwin 도입 2개월 후, Modeunique 강남점은 전환율과 매출에서 눈에 보이는 변화를 경험했습니다.",
      metrics: [
        {
          label: "구매 전환율",
          before: "8.2%",
          after: "10.8%",
          change: "+32%",
          improved: true,
        },
        {
          label: "피팅룸 대기시간",
          before: "15분",
          after: "8분",
          change: "-45%",
          improved: true,
        },
        {
          label: "월 매출",
          before: "2.1억원",
          after: "2.7억원",
          change: "+28%",
          improved: true,
        },
        {
          label: "신상품 코너 방문율",
          before: "23%",
          after: "58%",
          change: "+152%",
          improved: true,
        },
        {
          label: "고객 평균 체류시간",
          before: "12분",
          after: "18분",
          change: "+50%",
          improved: true,
        },
      ],
    },
    testimonial: {
      quote:
        "NeuralTwin 도입 전에는 매달 진열을 바꿔도 효과가 있는지 알 수 없었어요. 이제는 데이터가 말해주니까, 자신감을 갖고 의사결정할 수 있게 됐습니다. 피팅룸 병목이 이렇게 큰 매출 손실이었다니, 데이터 없이는 절대 몰랐을 겁니다.",
      author: "박지현",
      role: "매장 운영 총괄",
      company: "Modeunique 강남점",
    },
    seoTitle: "Modeunique 패션 매장 사례 - 전환율 32% 향상 | NeuralTwin",
    seoDescription:
      "NeuralTwin으로 Modeunique 강남 플래그십의 피팅룸 병목을 해결하고 전환율 32%, 월매출 28% 향상을 달성한 사례를 확인하세요.",
    relatedSlugs: ["glowlab-beauty"],
  },

  // ── Beauty: GlowLab ───────────────────────
  {
    slug: "glowlab-beauty",
    title: "GlowLab 성수 플래그십",
    subtitle: "고객 체류시간 87% 증가와 재방문율 41% 향상",
    industry: "뷰티",
    industryColor: "emerald",
    heroGradient: "from-emerald-600 via-teal-500 to-cyan-400",
    heroStat: { value: "+87%", label: "체류시간 증가" },
    stats: [
      { value: "+87%", label: "체류시간 증가", trend: "positive" },
      { value: "+41%", label: "재방문율 향상", trend: "positive" },
      { value: "+55%", label: "상담 전환율", trend: "positive" },
      { value: "6주", label: "도입 기간", trend: "neutral" },
    ],
    problem: {
      sectionTitle: "카운슬링존 혼잡이 만든 고객 이탈",
      description:
        "GlowLab 성수 플래그십은 150평 규모의 체험형 뷰티 매장입니다. 스킨케어 카운슬링을 핵심 서비스로 운영하지만, 주말 피크 시간에 카운슬링존이 포화 상태에 이르면서 대기 고객의 70%가 매장을 이탈했습니다. 또한 테스터 구역에서 카운슬링존으로 이동하는 고객 흐름이 단절되어 상담 전환율이 12%에 그치고 있었습니다.",
      painPoints: [
        {
          title: "카운슬링존 포화",
          description:
            "5개 카운슬링 부스에 주말 피크 시 평균 12명이 대기하며, 30분 이상 기다리면 70%가 이탈했습니다.",
        },
        {
          title: "테스터→상담 동선 단절",
          description:
            "테스터 구역과 카운슬링존이 매장 양 끝에 위치하여, 테스터 체험 후 상담으로 이어지는 비율이 12%에 불과했습니다.",
        },
        {
          title: "인력 배치 비효율",
          description:
            "고정 시프트로 운영하여 피크 시간에는 인력이 부족하고, 비피크 시간에는 과잉 상태가 반복되었습니다.",
        },
      ],
    },
    solution: {
      sectionTitle: "NeuralTwin 존 분석 + 인력 배치 최적화",
      description:
        "NeuralTwin은 WiFi 프로브 센서 8대로 매장을 6개 존으로 나눠 고객 흐름을 분석했습니다. AI가 테스터→카운슬링 동선 최적화와 시간대별 인력 배치 전략을 추천했고, 디지털 트윈 시뮬레이션으로 카운슬링존 위치 이전 효과를 사전 검증한 후 적용했습니다.",
      timeline: [
        { label: "DAY 1", description: "센서 8대 설치 (2시간)" },
        { label: "WEEK 1", description: "존별 체류시간 분석 완료" },
        { label: "WEEK 2", description: "동선 최적화안 시뮬레이션" },
        { label: "WEEK 4", description: "카운슬링존 재배치 완료" },
        { label: "WEEK 6", description: "인력 배치 최적화 적용" },
      ],
      features: [
        "존별 체류시간 & 이동 패턴 분석",
        "시간대별 인력 수요 예측",
        "카운슬링존 위치 시뮬레이션",
        "고객 흐름 실시간 모니터링",
      ],
    },
    results: {
      sectionTitle: "6주 만에 달성한 성과",
      description:
        "NeuralTwin 도입 6주 후, GlowLab 성수점은 고객 경험 지표와 비즈니스 KPI 모두에서 유의미한 개선을 달성했습니다.",
      metrics: [
        {
          label: "평균 체류시간",
          before: "18분",
          after: "34분",
          change: "+87%",
          improved: true,
        },
        {
          label: "재방문율 (월간)",
          before: "22%",
          after: "31%",
          change: "+41%",
          improved: true,
        },
        {
          label: "상담 전환율",
          before: "12%",
          after: "18.6%",
          change: "+55%",
          improved: true,
        },
        {
          label: "카운슬링 대기시간",
          before: "25분",
          after: "10분",
          change: "-60%",
          improved: true,
        },
        {
          label: "인력 효율성 (시간당 상담)",
          before: "3.2건",
          after: "5.1건",
          change: "+59%",
          improved: true,
        },
      ],
    },
    testimonial: {
      quote:
        "카운슬링존 위치를 옮기는 게 이렇게 큰 차이를 만들 줄 몰랐어요. NeuralTwin 시뮬레이션으로 미리 확인하지 않았다면 시도조차 못했을 겁니다. 이제 고객이 자연스럽게 테스터에서 상담으로 이어지는 흐름이 만들어졌어요.",
      author: "이수민",
      role: "매장 매니저",
      company: "GlowLab 성수점",
    },
    seoTitle: "GlowLab 뷰티 매장 사례 - 체류시간 87% 증가 | NeuralTwin",
    seoDescription:
      "NeuralTwin으로 GlowLab 성수 플래그십의 카운슬링존 혼잡을 해결하고 체류시간 87%, 재방문율 41% 향상을 달성한 사례를 확인하세요.",
    relatedSlugs: ["modeunique-fashion"],
  },
];

/** Utility: find a case study by slug */
export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.slug === slug);
}

/** Utility: get related case studies for a given slug */
export function getRelatedCaseStudies(slug: string): CaseStudy[] {
  const current = getCaseStudyBySlug(slug);
  if (!current) return caseStudies.filter((cs) => cs.slug !== slug);
  return current.relatedSlugs
    .map((s) => getCaseStudyBySlug(s))
    .filter((cs): cs is CaseStudy => cs !== undefined);
}
