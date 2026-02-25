## 변경 유형

<!-- 해당하는 항목에 x 표시 -->

- [ ] 🟦 UI/UX (프론트엔드 컴포넌트, 스타일)
- [ ] 🟩 Web Bot (웹사이트 챗봇 백엔드)
- [ ] 🟧 OS Bot (OS 챗봇 백엔드)
- [ ] 🟪 공유/계약 (타입, 스키마, 유틸)
- [ ] 📝 문서 (README, 가이드)
- [ ] 🔧 설정 (package.json, tsconfig 등)
- [ ] 🐛 버그 수정
- [ ] ♻️ 리팩토링

## 변경 내용

<!-- 무엇을 변경했는지 간단히 설명해주세요 -->



## 인터페이스 변경 여부

<!-- 계약 파일을 수정했나요? 해당하는 항목에 x 표시 -->

- [ ] 예 - `src/shared/chat/types/chat.types.ts` 수정
- [ ] 예 - `src/features/website-chatbot/types/website.types.ts` 수정
- [ ] 예 - `src/features/ai-assistant/types/assistant.types.ts` 수정
- [ ] 예 - `supabase/functions/_shared/chatTypes.ts` 수정
- [ ] 예 - DB 스키마 (`supabase/migrations/`) 수정
- [ ] 아니오 - 인터페이스 변경 없음

> ⚠️ **계약 파일 수정 시 필수**: Slack #chatbot-dev 채널에 알림 후 10분 대기했나요?

## 테스트 체크리스트

<!-- 수행한 테스트에 x 표시 -->

### 공통
- [ ] 타입 체크 통과 (`npm run typecheck` 또는 IDE 에러 없음)
- [ ] 빌드 성공 (`npm run build`)
- [ ] 린트 통과 (`npm run lint`)

### 프론트엔드 (🟦 UI/UX)
- [ ] 브라우저에서 기능 동작 확인
- [ ] 반응형 확인 (Desktop/Tablet/Mobile)
- [ ] 다크모드 확인 (해당 시)

### 백엔드 (🟩🟧 Edge Function)
- [ ] 로컬 Supabase에서 curl 테스트 완료
- [ ] 인증 토큰 포함 테스트 (OS Bot)
- [ ] 에러 케이스 테스트

### 연동 테스트
- [ ] Mock → 실제 API 전환 테스트 (해당 시)
- [ ] SSE 스트리밍 파싱 검증 (Web Bot)
- [ ] UIAction 실행 검증 (OS Bot)

## 스크린샷 / 응답 예시

<!-- UI 변경 시 스크린샷, EF 변경 시 curl 응답 예시를 첨부해주세요 -->



## 관련 이슈

<!-- 관련 GitHub 이슈 번호 (없으면 삭제) -->

Closes #

## 추가 노트

<!-- 리뷰어가 알아야 할 특이사항, 논의 필요 사항 -->



---

### 리뷰어 가이드

| 변경 영역 | 자동 지정 리뷰어 | 필요 승인 수 |
|:---|:---|:---|
| 🟦 UI/UX 본인 영역 | - | Self-merge 가능 |
| 🟩 Web Bot 본인 영역 | - | Self-merge 가능 |
| 🟧 OS Bot 본인 영역 | - | Self-merge 가능 |
| 🟪 공유 타입 | 영향 받는 개발자 | 1명 이상 |
| 🟪 DB 스키마 | @dev-b @dev-c | 2명 |
| 🟪 프로젝트 설정 | 전원 | 2명 |

<!-- CODEOWNERS에 의해 자동으로 리뷰어가 지정됩니다 -->
