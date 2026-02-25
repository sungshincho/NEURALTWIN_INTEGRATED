/** 공백 제거 후 소문자 변환 — 한국어 띄어쓰기 변형 대응 ("폴로셔츠" vs "폴로 셔츠") */
export function normalizeForMatch(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '');
}
