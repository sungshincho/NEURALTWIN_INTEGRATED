export type BlogCategory = "all" | "case-study" | "tech" | "trend";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: BlogCategory;
  featured: boolean;
  /** Gradient used as thumbnail placeholder */
  gradient: string;
  /** If this is a case study, link to the detail page */
  caseStudySlug?: string;
}

export const BLOG_CATEGORIES: { key: BlogCategory; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "case-study", label: "케이스 스터디" },
  { key: "tech", label: "기술 블로그" },
  { key: "trend", label: "업계 동향" },
];

export const blogPosts: BlogPost[] = [
  // ── Case Studies ──────────────────────────
  {
    slug: "modeunique-fashion-conversion",
    title: "강남 패션 매장의 전환율 32% 향상",
    excerpt:
      "Modeunique 강남 플래그십 스토어가 NeuralTwin 히트맵 분석과 AI 추천으로 피팅룸 병목을 해결하고, 전환율 32%, 월매출 28% 향상을 달성한 사례를 소개합니다.",
    date: "2026-02-15",
    readTime: "8분",
    category: "case-study",
    featured: true,
    gradient: "from-purple-600 via-pink-500 to-rose-400",
    caseStudySlug: "modeunique-fashion",
  },
  {
    slug: "glowlab-beauty-dwell-time",
    title: "뷰티 브랜드의 고객 체류시간 2배 증가",
    excerpt:
      "GlowLab 성수 플래그십이 NeuralTwin 존 분석과 인력 배치 최적화를 통해 카운슬링존 혼잡을 해결하고, 체류시간 87%, 재방문율 41% 향상을 이룬 여정을 공유합니다.",
    date: "2026-02-08",
    readTime: "7분",
    category: "case-study",
    featured: false,
    gradient: "from-emerald-500 via-teal-500 to-cyan-400",
    caseStudySlug: "glowlab-beauty",
  },

  // ── Tech Blog ─────────────────────────────
  {
    slug: "digital-twin-store-optimization",
    title: "디지털 트윈으로 매장 최적화하기",
    excerpt:
      "3D 디지털 트윈 기술이 오프라인 매장에 어떻게 적용되는지, WiFi 프로브 센서부터 AI 시뮬레이션까지 NeuralTwin의 기술 파이프라인을 상세히 설명합니다.",
    date: "2026-01-28",
    readTime: "12분",
    category: "tech",
    featured: false,
    gradient: "from-blue-600 via-indigo-500 to-violet-500",
  },
  {
    slug: "ai-transforming-retail",
    title: "AI가 리테일을 바꾸는 방법",
    excerpt:
      "수요 예측, 동선 분석, 자동 레이아웃 최적화 등 AI가 리테일 산업을 혁신하는 5가지 핵심 방법론과 NeuralTwin의 접근법을 기술적 관점에서 분석합니다.",
    date: "2026-01-15",
    readTime: "10분",
    category: "tech",
    featured: false,
    gradient: "from-amber-500 via-orange-500 to-red-500",
  },

  // ── Industry Trends ───────────────────────
  {
    slug: "2026-retail-trends",
    title: "2026 리테일 트렌드 5가지",
    excerpt:
      "옴니채널 통합, AI 기반 초개인화, 자동화 매장 운영, ESG 리테일, 공간 경험 혁신 등 2026년 리테일 산업을 이끄는 5대 트렌드를 정리했습니다.",
    date: "2026-01-05",
    readTime: "6분",
    category: "trend",
    featured: false,
    gradient: "from-cyan-500 via-blue-500 to-indigo-600",
  },
  {
    slug: "future-of-offline-stores",
    title: "오프라인 매장의 미래",
    excerpt:
      "온라인 커머스의 급성장 속에서도 오프라인 매장이 살아남는 이유, 그리고 데이터와 AI로 무장한 '스마트 스토어'가 그리는 미래 리테일 풍경을 전망합니다.",
    date: "2025-12-20",
    readTime: "9분",
    category: "trend",
    featured: false,
    gradient: "from-fuchsia-500 via-purple-500 to-indigo-500",
  },

  // ── Additional posts for volume ────────────
  {
    slug: "wifi-probe-privacy-guide",
    title: "WiFi 프로브 센서와 개인정보 보호 가이드",
    excerpt:
      "고객 동선 추적에 사용되는 WiFi 프로브 기술의 원리와 개인정보 보호법(PIPA) 준수 방법, 익명화 처리 과정을 상세히 안내합니다.",
    date: "2025-12-10",
    readTime: "11분",
    category: "tech",
    featured: false,
    gradient: "from-slate-500 via-gray-500 to-zinc-500",
  },
  {
    slug: "store-layout-ab-testing",
    title: "매장 레이아웃 A/B 테스트 실전 가이드",
    excerpt:
      "디지털 트윈 시뮬레이션으로 매장 레이아웃 변경 전 A/B 테스트를 수행하는 방법과, 실제 적용 시 ROI를 측정하는 프레임워크를 소개합니다.",
    date: "2025-11-28",
    readTime: "8분",
    category: "tech",
    featured: false,
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
  },
];
