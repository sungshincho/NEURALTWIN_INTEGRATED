/**
 * Layout Hint Extractor (v2 — 강화)
 *
 * 웹 검색 결과에서 매장 레이아웃/공간 관련 정보를 추출하여
 * AI가 VizDirective 존 배치 시 참조할 구조화된 힌트를 생성.
 *
 * v2 강화 사항:
 *   1. 존별 위치 추론 (ZonePositionHint) — "테스터 바 입구 근처" → front
 *   2. 신뢰도 점수 (confidence) — 매칭 패턴 수 기반
 *   3. 업종 감지 (detectedIndustry) — 검색 컨텍스트에서 업종 추론
 *   4. 구조화된 좌표 힌트 포맷 — AI에게 구체적 좌표 범위 제공
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export type ZonePosition = 'front' | 'center' | 'back' | 'left' | 'right' | 'wall';

export interface ZonePositionHint {
  zone: string;           // 존 이름 (한국어)
  zoneId: string;         // 영문 존 ID (viz에서 매칭용)
  position: ZonePosition; // 추론된 위치
  coordHint: string;      // 좌표 힌트 (예: "z: 4~6")
}

export interface LayoutHint {
  checkoutPosition?: 'front' | 'back' | 'side';
  flowPattern?: 'free' | 'grid' | 'loop' | 'linear';
  keyZones?: string[];
  spatialNotes?: string[];
  zonePositions?: ZonePositionHint[];
  detectedIndustry?: string;
  confidence: number;     // 0.0~1.0 — 추출 신뢰도
}

// ═══════════════════════════════════════════
//  업종 감지
// ═══════════════════════════════════════════

const INDUSTRY_PATTERNS: { industry: string; patterns: RegExp[] }[] = [
  {
    industry: 'beauty',
    patterns: [
      /올리브영|세포라|랄라블라|이니스프리|아리따움|미샤|더페이스샵|에뛰드/i,
      /뷰티|화장품|코스메틱|드럭스토어|drug\s*store/i,
      /스킨케어|메이크업|테스터\s*바|기초\s*화장/i,
    ],
  },
  {
    industry: 'electronics',
    patterns: [
      /삼성\s*(?:스토어|디지털|전자)|하이마트|전자\s*랜드|일렉트로마트/i,
      /애플\s*(?:스토어|매장)|다이슨|LG\s*(?:베스트|시그니처)/i,
      /전자\s*제품|가전|electronics/i,
    ],
  },
  {
    industry: 'grocery',
    patterns: [
      /이마트|홈플러스|코스트코|트레이더스|롯데마트|하나로마트/i,
      /마트|식료품|슈퍼마켓|grocery/i,
      /신선\s*식품|농산물|수산물|정육/i,
    ],
  },
  {
    industry: 'convenience',
    patterns: [
      /GS25|CU|세븐일레븐|이마트24|미니스톱/i,
      /편의점|convenience\s*store/i,
    ],
  },
  {
    industry: 'cafe',
    patterns: [
      /스타벅스|투썸|이디야|블루보틀|카페|커피/i,
      /베이커리|디저트|F&B/i,
    ],
  },
  {
    industry: 'fashion',
    patterns: [
      /자라|유니클로|H&M|무신사|나이키|아디다스|zara|uniqlo/i,
      /패션|의류|어패럴|apparel/i,
      /피팅\s*룸|fitting\s*room/i,
    ],
  },
  {
    industry: 'popup',
    patterns: [
      /팝업\s*(?:스토어|매장)|pop-?up/i,
      /한정\s*(?:판매|에디션)|리미티드|기간\s*한정/i,
    ],
  },
];

function detectIndustryFromContext(text: string): string | undefined {
  let bestIndustry: string | undefined;
  let bestScore = 0;

  for (const { industry, patterns } of INDUSTRY_PATTERNS) {
    const score = patterns.filter(p => p.test(text)).length;
    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
    }
  }

  return bestScore > 0 ? bestIndustry : undefined;
}

// ═══════════════════════════════════════════
//  패턴 정의
// ═══════════════════════════════════════════

// 계산대 위치 패턴
const CHECKOUT_BACK_PATTERNS = [
  /계산대.{0,15}(안쪽|뒤쪽|맞은편|반대|끝|후방)/,
  /(?:안쪽|뒤쪽|맞은편|후방).{0,15}계산/,
  /(?:checkout|counter|register).{0,15}(back|rear|far|opposite|end)/i,
  /입구.{0,15}(?:반대편|맞은편).{0,15}(?:계산|카운터|결제)/,
  /(?:계산|결제|카운터).{0,15}입구.{0,8}(?:반대|맞은)/,
  /매장.{0,8}(?:가장|제일).{0,8}(?:안쪽|깊숙|뒤).{0,15}(?:계산|결제|카운터)/,
];

const CHECKOUT_FRONT_PATTERNS = [
  /계산대.{0,15}(입구|앞쪽|옆|근처|전면)/,
  /입구.{0,15}(옆|근처|바로).{0,10}(?:계산|카운터)/,
  /(?:checkout|counter).{0,15}(front|near|entrance)/i,
];

const CHECKOUT_SIDE_PATTERNS = [
  /계산대.{0,15}(측면|옆면|벽면|좌측|우측|왼쪽|오른쪽)/,
  /(?:측면|벽면|옆).{0,10}(?:계산대|카운터|결제)/,
];

// 동선 패턴
const FLOW_LOOP_PATTERNS = [
  /루프|순환|loop|racetrack|회유|U자/,
  /벽면.{0,10}따라.{0,10}(돌|이동|순회|진행)/,
  /(?:외곽|둘레).{0,10}(?:동선|이동|순회)/,
];

const FLOW_GRID_PATTERNS = [
  /격자|grid|그리드/,
  /진열대.{0,8}열/,
  /통로.{0,8}직선/,
  /(?:일자|일렬|직선).{0,8}(?:배치|진열|통로)/,
];

const FLOW_LINEAR_PATTERNS = [
  /직선\s*동선|linear\s*flow/i,
  /입구.{0,10}(?:에서|부터).{0,10}(?:안쪽|뒤쪽|끝).{0,5}(?:까지|으로)/,
  /일직선.{0,8}(?:배치|동선|이동)/,
];

// 존 명칭 패턴 + 위치 추론용 확장
const ZONE_PATTERNS: { pattern: RegExp; zoneId: string; label: string }[] = [
  { pattern: /테스터\s*(?:바|존|구역|코너)/, zoneId: 'testerBar', label: '테스터 바' },
  { pattern: /스킨케어\s*(?:존|구역|코너|섹션)/, zoneId: 'skincare', label: '스킨케어' },
  { pattern: /메이크업\s*(?:존|구역|코너|섹션)/, zoneId: 'makeup', label: '메이크업' },
  { pattern: /프로모션\s*(?:존|구역|코너|섹션)/, zoneId: 'promotion', label: '프로모션' },
  { pattern: /체험\s*(?:존|구역|코너)/, zoneId: 'experience', label: '체험존' },
  { pattern: /포토\s*(?:존|구역|스팟)/, zoneId: 'photoZone', label: '포토존' },
  { pattern: /신상품?\s*(?:코너|존|구역)/, zoneId: 'newArrivals', label: '신상품 코너' },
  { pattern: /시식\s*(?:코너|존|구역)/, zoneId: 'tasting', label: '시식 코너' },
  { pattern: /피팅\s*(?:룸|존|구역)/, zoneId: 'fittingRoom', label: '피팅룸' },
  { pattern: /컨설팅\s*(?:존|구역|코너)/, zoneId: 'consultation', label: '컨설팅존' },
  { pattern: /(?:VIP|프리미엄)\s*(?:존|구역|라운지)/i, zoneId: 'vip', label: 'VIP 존' },
  { pattern: /헬스\s*(?:앤|&)\s*뷰티/, zoneId: 'healthBeauty', label: '헬스&뷰티' },
  { pattern: /향수\s*(?:존|구역|코너)/, zoneId: 'fragrance', label: '향수 존' },
  { pattern: /네일\s*(?:존|구역|코너)/, zoneId: 'nail', label: '네일 존' },
  { pattern: /남성\s*(?:존|구역|코너|그루밍)/, zoneId: 'mens', label: '남성 존' },
  { pattern: /신선\s*(?:식품|코너|구역|매대)/, zoneId: 'produce', label: '신선식품' },
  { pattern: /음료\s*(?:존|구역|코너|매대|벽면)/, zoneId: 'beverage', label: '음료' },
  { pattern: /간편식\s*(?:존|구역|코너|매대)/, zoneId: 'readyMeal', label: '간편식' },
  { pattern: /주문\s*(?:카운터|대)/, zoneId: 'counter', label: '주문 카운터' },
  { pattern: /좌석\s*(?:구역|존|공간)/, zoneId: 'seating', label: '좌석 구역' },
  { pattern: /진열\s*(?:대|존|구역|매대)/, zoneId: 'display', label: '진열대' },
  { pattern: /AS\s*(?:센터|구역|존|접수)/, zoneId: 'service', label: 'AS센터' },
  { pattern: /파워\s*월/, zoneId: 'powerWall', label: '파워월' },
];

// 존별 위치 문맥 패턴: "존이름 + 위치 관계어"
const POSITION_FRONT_KW = /입구|앞쪽|전면|정면|들어서자마자|들어가면|바로|front|near\s*entrance/i;
const POSITION_BACK_KW = /안쪽|뒤쪽|맞은편|반대|끝|후방|깊숙|가장\s*안|back|rear|far\s*end/i;
const POSITION_CENTER_KW = /중앙|가운데|중심|center|middle/i;
const POSITION_WALL_KW = /벽면|벽쪽|외곽|둘레|wall|perimeter/i;
const POSITION_LEFT_KW = /좌측|왼쪽|왼편|left/i;
const POSITION_RIGHT_KW = /우측|오른쪽|오른편|right/i;

const COORD_MAP: Record<ZonePosition, string> = {
  front: 'z: 4~7',
  center: 'x: -2~2, z: -2~2',
  back: 'z: -5~-8',
  left: 'x: -5~-7',
  right: 'x: 5~7',
  wall: 'x: ±7 또는 z: ±7 (벽면)',
};

// 공간 배치 관련 문장 추출 패턴
const SPATIAL_SENTENCE_PATTERN =
  /(입구|계산대|카운터|진열|매대|존|구역|코너|벽면|중앙|안쪽|뒤쪽|앞쪽|테스터|스킨케어|메이크업|프로모션|체험|신선|음료|피팅).{5,80}(배치|위치|설치|구성|배열|자리|놓|두|있|이동|진행|연결|인접|옆|바로|근처)/;

// ═══════════════════════════════════════════
//  존별 위치 추론
// ═══════════════════════════════════════════

function inferZonePositions(text: string): ZonePositionHint[] {
  const hints: ZonePositionHint[] = [];
  const sentences = text.split(/[.。\n]/).filter(s => s.length > 5);

  for (const { pattern, zoneId, label } of ZONE_PATTERNS) {
    for (const sentence of sentences) {
      const m = sentence.match(pattern);
      if (!m) continue;

      // 존 명칭 주변 문맥에서 위치 추론 (존 명칭 기준 앞뒤 50자)
      const idx = m.index!;
      const context = sentence.substring(Math.max(0, idx - 50), Math.min(sentence.length, idx + m[0].length + 50));

      let position: ZonePosition | null = null;

      if (POSITION_FRONT_KW.test(context)) position = 'front';
      else if (POSITION_BACK_KW.test(context)) position = 'back';
      else if (POSITION_CENTER_KW.test(context)) position = 'center';
      else if (POSITION_WALL_KW.test(context)) position = 'wall';
      else if (POSITION_LEFT_KW.test(context)) position = 'left';
      else if (POSITION_RIGHT_KW.test(context)) position = 'right';

      if (position) {
        // 중복 방지: 같은 zoneId에 대해 이미 추론된 힌트가 있으면 스킵
        if (!hints.some(h => h.zoneId === zoneId)) {
          hints.push({
            zone: label,
            zoneId,
            position,
            coordHint: COORD_MAP[position],
          });
        }
      }
      break; // 한 존당 첫 매칭만
    }
  }

  return hints;
}

// ═══════════════════════════════════════════
//  메인 추출 함수
// ═══════════════════════════════════════════

/**
 * 검색 결과 텍스트에서 매장 레이아웃 힌트를 추출 (v2 강화)
 * - 업종 감지, 존별 위치 추론, 컨피던스 점수 포함
 */
export function extractLayoutHints(searchContext: string): LayoutHint | null {
  if (!searchContext || searchContext.length < 50) return null;

  const hint: LayoutHint = { confidence: 0 };
  let matchCount = 0;

  // 0. 업종 감지
  const industry = detectIndustryFromContext(searchContext);
  if (industry) {
    hint.detectedIndustry = industry;
    matchCount += 1;
  }

  // 1. 계산대 위치 추론
  const backMatches = CHECKOUT_BACK_PATTERNS.filter(p => p.test(searchContext)).length;
  const frontMatches = CHECKOUT_FRONT_PATTERNS.filter(p => p.test(searchContext)).length;
  const sideMatches = CHECKOUT_SIDE_PATTERNS.filter(p => p.test(searchContext)).length;

  if (backMatches > 0 && backMatches >= frontMatches) {
    hint.checkoutPosition = 'back';
    matchCount += backMatches;
  } else if (frontMatches > 0) {
    hint.checkoutPosition = 'front';
    matchCount += frontMatches;
  } else if (sideMatches > 0) {
    hint.checkoutPosition = 'side';
    matchCount += sideMatches;
  }

  // 2. 동선 패턴 추론
  if (FLOW_LOOP_PATTERNS.some(p => p.test(searchContext))) {
    hint.flowPattern = 'loop';
    matchCount += 1;
  } else if (FLOW_GRID_PATTERNS.some(p => p.test(searchContext))) {
    hint.flowPattern = 'grid';
    matchCount += 1;
  } else if (FLOW_LINEAR_PATTERNS.some(p => p.test(searchContext))) {
    hint.flowPattern = 'linear';
    matchCount += 1;
  }

  // 3. 존 이름 수집
  const keyZones: string[] = [];
  for (const { pattern, label } of ZONE_PATTERNS) {
    if (pattern.test(searchContext)) {
      keyZones.push(label);
    }
  }
  if (keyZones.length > 0) {
    hint.keyZones = [...new Set(keyZones)];
    matchCount += keyZones.length;
  }

  // 4. 존별 위치 추론 (핵심 강화)
  const zonePositions = inferZonePositions(searchContext);
  if (zonePositions.length > 0) {
    hint.zonePositions = zonePositions;
    matchCount += zonePositions.length * 2; // 존+위치 매칭은 가중치 높음
  }

  // 5. 공간 관련 서술 문장 추출 (최대 3개)
  const sentences = searchContext.split(/[.。\n]/).filter(s => s.length > 10 && s.length < 200);
  const spatialNotes = sentences
    .filter(s => SPATIAL_SENTENCE_PATTERN.test(s))
    .slice(0, 3)
    .map(s => s.trim());
  if (spatialNotes.length > 0) {
    hint.spatialNotes = spatialNotes;
    matchCount += spatialNotes.length;
  }

  // 6. 신뢰도 계산 (매칭 수 기반, 0~1)
  // 1개 매칭 → 0.2, 3개 → 0.5, 5개 → 0.7, 8+ → 0.9
  hint.confidence = Math.min(1.0, matchCount * 0.12);

  return matchCount > 0 ? hint : null;
}

// ═══════════════════════════════════════════
//  포맷팅 함수 (v2 — 좌표 힌트 구조화)
// ═══════════════════════════════════════════

/**
 * LayoutHint → AI 프롬프트용 구조화된 텍스트 블록 생성
 * v2: 좌표 힌트를 구체적으로 포함하여 AI가 정확한 좌표를 생성하도록 유도
 */
export function formatLayoutHintForPrompt(hint: LayoutHint): string {
  const lines: string[] = ['', `[매장 레이아웃 힌트 — 웹 검색 기반, 신뢰도: ${(hint.confidence * 100).toFixed(0)}%]`];
  lines.push('아래는 웹 검색 결과에서 추출한 실제 매장 레이아웃 정보입니다.');
  lines.push('VizDirective 존 배치 시 이 정보를 반드시 반영하세요.');

  if (hint.confidence >= 0.5) {
    lines.push('⚠️ 신뢰도가 높습니다. 아래 좌표 힌트를 우선 적용하세요.');
  }
  lines.push('');

  if (hint.detectedIndustry) {
    const industryNames: Record<string, string> = {
      beauty: '뷰티/드럭스토어',
      electronics: '전자제품',
      grocery: '식료품/마트',
      convenience: '편의점',
      cafe: '카페/F&B',
      fashion: '패션',
      popup: '팝업',
    };
    lines.push(`- 감지된 업종: ${industryNames[hint.detectedIndustry] || hint.detectedIndustry}`);
  }

  if (hint.checkoutPosition) {
    const posMap: Record<string, string> = {
      back: '매장 안쪽/뒤쪽 → checkout 좌표: x: 0, z: -6 (d: 3)',
      front: '입구 근처 → checkout 좌표: x: 0, z: 6 (d: 3)',
      side: '측면 → checkout 좌표: x: -6, z: 0 (d: 3)',
    };
    lines.push(`- 계산대 위치: ${posMap[hint.checkoutPosition]}`);
  }

  if (hint.flowPattern) {
    const flowMap: Record<string, string> = {
      loop: '루프형/순환 → flowPath: 입구→벽면→안쪽→반대벽→입구 순 (존 ID 배열)',
      grid: '격자형 → flowPath: 직선 통로 순서 (입구→중앙→안쪽)',
      free: '자유형 → flowPath: true',
      linear: '직선형 → flowPath: 입구에서 안쪽으로 직선 순서',
    };
    lines.push(`- 동선 패턴: ${flowMap[hint.flowPattern]}`);
  }

  // 핵심: 존별 좌표 힌트 테이블
  if (hint.zonePositions && hint.zonePositions.length > 0) {
    lines.push('');
    lines.push('[존별 좌표 힌트 — 검색 결과 기반 추론]');
    lines.push('| 존 | zoneId | 위치 | 좌표 힌트 |');
    lines.push('|-----|--------|------|-----------|');
    for (const zp of hint.zonePositions) {
      const posKo: Record<ZonePosition, string> = {
        front: '입구 근처', center: '중앙', back: '안쪽',
        left: '좌측', right: '우측', wall: '벽면',
      };
      lines.push(`| ${zp.zone} | ${zp.zoneId} | ${posKo[zp.position]} | ${zp.coordHint} |`);
    }
    lines.push('');
    lines.push('위 좌표 힌트를 viz 블록의 해당 존 x, z 값에 반영하세요.');
  }

  if (hint.keyZones && hint.keyZones.length > 0) {
    lines.push(`- 검색에서 언급된 주요 존: ${hint.keyZones.join(', ')}`);
  }

  if (hint.spatialNotes && hint.spatialNotes.length > 0) {
    lines.push('- 공간 배치 참고 (원문):');
    for (const note of hint.spatialNotes) {
      lines.push(`  · ${note}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ═══════════════════════════════════════════
//  후처리 검증 유틸리티
// ═══════════════════════════════════════════

interface DynamicZone {
  id: string;
  label: string;
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
}

/**
 * AI가 생성한 viz zones를 layout hint와 비교하여 정합성 검증 및 자동 보정
 * 검색 결과에서 "계산대가 안쪽"이라고 했는데 AI가 z: 6에 놓았으면 → z: -6으로 보정
 */
export function validateAndCorrectZones(
  zones: DynamicZone[],
  hint: LayoutHint
): { corrected: DynamicZone[]; corrections: string[] } {
  const corrected = zones.map(z => ({ ...z }));
  const corrections: string[] = [];

  // 1. 계산대 위치 보정
  if (hint.checkoutPosition) {
    const checkoutZone = corrected.find(z =>
      /checkout|계산|counter|register|결제|카운터/.test(z.id + z.label)
    );

    if (checkoutZone) {
      if (hint.checkoutPosition === 'back' && checkoutZone.z > 0) {
        const oldZ = checkoutZone.z;
        checkoutZone.z = -6;
        corrections.push(`checkout z: ${oldZ} → ${checkoutZone.z} (힌트: 안쪽)`);
      } else if (hint.checkoutPosition === 'front' && checkoutZone.z < 0) {
        const oldZ = checkoutZone.z;
        checkoutZone.z = 6;
        corrections.push(`checkout z: ${oldZ} → ${checkoutZone.z} (힌트: 입구 근처)`);
      } else if (hint.checkoutPosition === 'side' && Math.abs(checkoutZone.x) < 4) {
        const oldX = checkoutZone.x;
        checkoutZone.x = -6;
        corrections.push(`checkout x: ${oldX} → ${checkoutZone.x} (힌트: 측면)`);
      }
    }
  }

  // 2. 존별 위치 보정 (zonePositions 기반)
  if (hint.zonePositions) {
    for (const zp of hint.zonePositions) {
      const zone = corrected.find(z =>
        z.id === zp.zoneId || z.id.toLowerCase() === zp.zoneId.toLowerCase()
      );
      if (!zone) continue;

      const positionRanges: Record<ZonePosition, { xRange: [number, number]; zRange: [number, number] }> = {
        front: { xRange: [-7, 7], zRange: [3, 8] },
        center: { xRange: [-3, 3], zRange: [-3, 3] },
        back: { xRange: [-7, 7], zRange: [-8, -3] },
        left: { xRange: [-8, -4], zRange: [-7, 7] },
        right: { xRange: [4, 8], zRange: [-7, 7] },
        wall: { xRange: [-8, 8], zRange: [-8, 8] },
      };

      const range = positionRanges[zp.position];
      if (!range) continue;

      // z 범위를 벗어나면 보정 (wall은 보정 생략 — 벽면은 다양한 위치 가능)
      if (zp.position !== 'wall') {
        if (zone.z < range.zRange[0] || zone.z > range.zRange[1]) {
          const oldZ = zone.z;
          zone.z = (range.zRange[0] + range.zRange[1]) / 2;
          corrections.push(`${zone.id} z: ${oldZ} → ${zone.z} (힌트: ${zp.position})`);
        }
        // 좌/우 위치는 x도 보정
        if (zp.position === 'left' || zp.position === 'right') {
          if (zone.x < range.xRange[0] || zone.x > range.xRange[1]) {
            const oldX = zone.x;
            zone.x = (range.xRange[0] + range.xRange[1]) / 2;
            corrections.push(`${zone.id} x: ${oldX} → ${zone.x} (힌트: ${zp.position})`);
          }
        }
      }
    }
  }

  // 3. 보정 후 겹침 재검사 (간이)
  if (corrections.length > 0 && corrected.length > 1) {
    for (let i = 0; i < corrected.length; i++) {
      for (let j = i + 1; j < corrected.length; j++) {
        const a = corrected[i];
        const b = corrected[j];
        const overlapX = (a.w / 2 + b.w / 2) - Math.abs(a.x - b.x);
        const overlapZ = (a.d / 2 + b.d / 2) - Math.abs(a.z - b.z);
        if (overlapX > 0.5 && overlapZ > 0.5) {
          const dx = b.x - a.x || 0.1;
          const dz = b.z - a.z || 0.1;
          const dist = Math.sqrt(dx * dx + dz * dz) || 1;
          b.x = Math.min(10, Math.max(-10, b.x + (dx / dist) * overlapX * 0.6));
          b.z = Math.min(10, Math.max(-10, b.z + (dz / dist) * overlapZ * 0.6));
        }
      }
    }
  }

  return { corrected, corrections };
}
