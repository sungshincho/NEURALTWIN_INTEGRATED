/**
 * 상품 카탈로그 프롬프트 생성 + 컨텍스트 포매팅
 */

/**
 * 상품 카탈로그 프롬프트 생성
 * DB에서 조회한 카테고리/상품명을 분류 프롬프트에 주입
 */
export function formatProductCatalog(catalog?: {
  categories?: string[];
  products?: Array<{ name: string; category: string }>;
}): string {
  if (!catalog || (!catalog.categories?.length && !catalog.products?.length)) {
    return '';
  }

  const parts: string[] = [];
  parts.push('## 현재 DB에 등록된 상품 카탈로그 (인텐트 분류 참고용)');
  parts.push('\n**⚠️ 중요: 대시보드 데이터 조회 vs 일반 지식 질문 구분**');
  parts.push('- 아래 카탈로그는 **이 매장의 대시보드 데이터를 조회**할 때만 참고하세요.');
  parts.push('- "전세계", "글로벌", "브랜드 추천", "트렌드", "업계", "시장" 등 외부/일반 지식을 묻는 질문은 카테고리/상품명이 포함되어 있어도 → **general_chat**으로 분류');
  parts.push('- 예: "26년 전세계 브랜드 아우터 판매량 얼마야?" → general_chat (대시보드 데이터가 아닌 일반 지식 질문)');
  parts.push('- 예: "아우터 트렌드 어때?" → general_chat (패션 트렌드는 일반 지식)');
  parts.push('- 예: "가방 브랜드 추천해줘" → general_chat (추천은 일반 대화)');
  parts.push('- 예: "아우터 몇개 팔았어?" → query_kpi + categoryAnalysis (이 매장 데이터 조회)');

  if (catalog.categories && catalog.categories.length > 0) {
    parts.push(`\n**카테고리 목록:** ${catalog.categories.join(', ')}`);
    parts.push('- 이 매장의 데이터를 묻는 맥락에서 위 카테고리명이 포함되면 → queryType: "categoryAnalysis" + itemFilter에 해당 카테고리명 추출');
    parts.push('- "카테고리별" 키워드 없이 카테고리명만 언급해도 categoryAnalysis로 분류');
    parts.push('  - 예: "가방 몇개 팔았어?" → categoryAnalysis + itemFilter: ["가방"] + responseHint: "quantity"');
    parts.push('  - 예: "신발 매출 얼마야?" → categoryAnalysis + itemFilter: ["신발"]');
  }

  if (catalog.products && catalog.products.length > 0) {
    const productList = catalog.products.map(p => `${p.name}(${p.category})`).join(', ');
    parts.push(`\n**상품 목록 (상품명(카테고리)):** ${productList}`);
    parts.push('- 이 매장의 데이터를 묻는 맥락에서 위 상품명이 포함되면 → queryType: "product" + itemFilter에 해당 상품명 추출');
    parts.push('- "X는 무슨 카테고리야?" 류 질문도 → queryType: "product" + itemFilter에 해당 상품명 추출 (응답에서 카테고리 정보 포함)');
  }

  if (catalog.categories && catalog.categories.length > 0 && catalog.products && catalog.products.length > 0) {
    parts.push('\n**⚠️ 카테고리명 vs 상품명 중의성 해소 규칙:**');
    parts.push('1. 사용자 입력이 **상품명과 정확히 일치**하면 → queryType: "product" (상품 우선)');
    parts.push('   - 예: "가방 정리함 매출" → product + itemFilter: ["가방 정리함"] (상품명 정확 매칭)');
    parts.push('2. 사용자 입력이 **카테고리명과만 일치**하면 → queryType: "categoryAnalysis" (카테고리 우선)');
    parts.push('   - 예: "가방 몇개 팔았어?" → categoryAnalysis + itemFilter: ["가방"] (카테고리 매칭)');
    parts.push('3. 사용자 입력이 **카테고리명과 상품명 둘 다에 매칭**되고 어느 쪽인지 불분명하면 → confidence를 0.6 이하로 낮추고 categoryAnalysis로 분류');
    parts.push('   - 이 경우 시스템이 사용자에게 "카테고리 전체를 말씀하신 건가요, 특정 상품인가요?" 되물을 수 있음');
  }

  return parts.join('\n');
}

/**
 * 컨텍스트 포맷팅 함수
 */
export function formatContext(context?: {
  page?: { current?: string; tab?: string };
  dateRange?: { preset?: string; startDate?: string; endDate?: string };
}): string {
  if (!context) {
    return '컨텍스트 정보 없음';
  }

  const parts: string[] = [];

  if (context.page?.current) {
    parts.push(`현재 페이지: ${context.page.current}`);
  }
  if (context.page?.tab) {
    parts.push(`현재 탭: ${context.page.tab}`);
  }
  if (context.dateRange?.preset) {
    parts.push(`날짜 필터: ${context.dateRange.preset}`);
  } else if (context.dateRange?.startDate && context.dateRange?.endDate) {
    parts.push(`날짜 범위: ${context.dateRange.startDate} ~ ${context.dateRange.endDate}`);
  }

  return parts.length > 0 ? parts.join(', ') : '컨텍스트 정보 없음';
}
