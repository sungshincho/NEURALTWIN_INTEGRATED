/**
 * Jina Reader — Phase 5 (Layer 2 Enhancement)
 *
 * r.jina.ai를 사용하여 URL의 전체 페이지 콘텐츠를 마크다운으로 추출
 * 검색 결과의 snippet만으로는 부족한 정보를 보충
 *
 * 사용 조건:
 * - 고급 질문 (advanced depth) 시에만 활성화
 * - 상위 1~2개 URL만 추출 (토큰 예산 고려)
 * - 3초 타임아웃으로 전체 응답 지연 최소화
 */

const JINA_READER_BASE = 'https://r.jina.ai/';
const JINA_TIMEOUT_MS = 3000;
const MAX_CONTENT_LENGTH = 2000; // 토큰 예산: 약 500 토큰

export interface JinaReaderResult {
  url: string;
  title: string;
  content: string;    // 마크다운 형태의 추출된 콘텐츠
  truncated: boolean;
  success: boolean;
  error?: string;
}

/**
 * 단일 URL의 전문 콘텐츠 추출
 */
export async function fetchPageContent(url: string): Promise<JinaReaderResult> {
  try {
    const response = await Promise.race([
      fetch(`${JINA_READER_BASE}${url}`, {
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'text',
        },
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Jina timeout')), JINA_TIMEOUT_MS)
      ),
    ]);

    if (!response.ok) {
      return {
        url,
        title: '',
        content: '',
        truncated: false,
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const text = await response.text();

    // 제목 추출 (첫 번째 # 헤딩 또는 첫 줄)
    const titleMatch = text.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : text.split('\n')[0].trim().slice(0, 100);

    // 불필요한 부분 제거 (네비게이션, 푸터, 광고 등)
    const cleaned = cleanExtractedContent(text);

    // 길이 제한
    const truncated = cleaned.length > MAX_CONTENT_LENGTH;
    const content = truncated ? cleaned.slice(0, MAX_CONTENT_LENGTH) + '…' : cleaned;

    return { url, title, content, truncated, success: true };
  } catch (err) {
    return {
      url,
      title: '',
      content: '',
      truncated: false,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * 여러 URL의 콘텐츠를 병렬로 추출 (상위 N개)
 */
export async function fetchMultiplePages(
  urls: string[],
  maxPages: number = 2
): Promise<JinaReaderResult[]> {
  const targets = urls.slice(0, maxPages);

  const results = await Promise.allSettled(
    targets.map(url => fetchPageContent(url))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<JinaReaderResult> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(r => r.success && r.content.length > 50);
}

/**
 * Jina Reader 결과를 AI 컨텍스트 텍스트로 변환
 */
export function formatJinaResultsForContext(results: JinaReaderResult[]): string {
  if (results.length === 0) return '';

  const parts: string[] = ['\n[상세 페이지 콘텐츠]'];

  for (const r of results) {
    parts.push(`\n--- ${r.title} (${r.url}) ---`);
    parts.push(r.content);
  }

  parts.push('\n위 상세 콘텐츠에서 정확한 수치와 사례를 인용하세요.');

  return parts.join('\n');
}

/**
 * 추출된 콘텐츠에서 불필요한 부분 제거
 */
function cleanExtractedContent(text: string): string {
  return text
    // 연속 빈 줄 정리
    .replace(/\n{3,}/g, '\n\n')
    // 네비게이션/메뉴 패턴 제거
    .replace(/^(Home|About|Contact|Menu|Skip to|Navigation|Footer|Copyright).*$/gm, '')
    // 쿠키/개인정보 패턴 제거
    .replace(/^.*cookie.*policy.*$/gim, '')
    .replace(/^.*privacy.*policy.*$/gim, '')
    // 소셜 미디어 공유 버튼
    .replace(/^(Share|Tweet|Pin|Like|Follow)[\s:].*$/gm, '')
    // 구독 CTA
    .replace(/^.*subscribe.*newsletter.*$/gim, '')
    // 이미지 alt 태그 잔여
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 연속 공백 정리
    .replace(/[ \t]{3,}/g, ' ')
    .trim();
}
