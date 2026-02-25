## 변경 유형

<!-- 해당하는 항목에 체크하세요 [x] -->

- [ ] 🟦 **UI/UX** (프론트엔드 컴포넌트, 스타일, 레이아웃)
- [ ] 🟩 **Web Bot Backend** (retail-chatbot EF, 웹 챗봇 훅/타입)
- [ ] 🟧 **OS Bot Backend** (neuraltwin-assistant EF, OS 챗봇 훅/타입/store)
- [ ] 🟪 **공유 영역** (계약 타입, DB 스키마, 공유 유틸, package.json)
- [ ] ⬜ **기타** (문서, 설정, 리팩토링)

---

## 변경 내용

<!-- 이 PR에서 무엇을 변경했는지 간략히 설명하세요 -->

### 주요 변경사항
-

### 관련 파일
-

---

## 인터페이스 변경 여부

<!-- 하나만 선택하세요 -->

- [ ] ✅ 인터페이스 변경 **없음** - 기존 계약 유지
- [ ] ⚠️ 인터페이스 변경 **있음** - 아래 상세 내용 필수 작성

<!--
인터페이스 변경 시 반드시 작성하세요.
계약 파일: chat.types.ts, website.types.ts, assistant.types.ts, chatTypes.ts
-->

<details>
<summary>인터페이스 변경 상세 (해당 시 펼쳐서 작성)</summary>

### 변경된 파일
- `src/.../types.ts`

### 변경 내용
```typescript
// Before
interface Example {
  existingField: string;
}

// After
interface Example {
  existingField: string;
  newField: number;  // 추가됨
}
```

### Breaking Change 여부
- [ ] Yes - 기존 코드 수정 필요
- [ ] No - 하위 호환 (필드 추가만)

### 영향 받는 코드 및 담당자
| 파일 | 담당자 | 필요한 조치 |
|:---|:---|:---|
| `src/.../Component.tsx` | A | 새 필드 UI 반영 |
| `supabase/functions/.../index.ts` | B/C | 새 필드 반환 로직 추가 |

</details>

---

## 테스트 체크리스트

### 필수 테스트
- [ ] 로컬에서 `npm run build` 성공
- [ ] 로컬에서 `npm run lint` 통과 (에러 없음)

### UI 변경 시 (🟦)
- [ ] Chrome에서 수동 테스트 완료
- [ ] 모바일 반응형 확인 (Chrome DevTools)
- [ ] 다크 모드 확인 (해당 시)

### Backend 변경 시 (🟩🟧)
- [ ] curl 테스트 완료 (명령어 아래 첨부)
- [ ] 에러 케이스 처리 확인
- [ ] Rate Limiting 동작 확인 (해당 시)

### DB 스키마 변경 시 (🟪)
- [ ] 마이그레이션 SQL 검토 완료
- [ ] 기존 데이터 영향도 확인
- [ ] RLS 정책 적용 확인

---

## 스크린샷 / 데모

<!-- UI 변경 시 스크린샷을 첨부하세요 -->

<!-- EF 변경 시 curl 응답 예시를 첨부하세요 -->
```bash
# curl 테스트 명령어 (해당 시)

# 응답 예시

```

---

## 관련 이슈

<!-- 관련 이슈가 있으면 연결하세요 -->
<!-- Closes #123 형식으로 작성하면 PR 머지 시 이슈가 자동으로 닫힙니다 -->

Closes #

---

## 리뷰 요청 사항

<!-- 특별히 리뷰어에게 확인받고 싶은 부분이 있으면 작성하세요 -->

-

---

## 체크리스트 (PR 작성자용)

- [ ] 커밋 메시지가 컨벤션을 따르고 있나요? (`feat(scope): message`)
- [ ] 불필요한 console.log나 디버깅 코드를 제거했나요?
- [ ] 새로운 의존성을 추가했다면 팀에 알렸나요?
- [ ] 문서 업데이트가 필요한 변경인가요? (필요시 docs/ 수정)

---

<!--
리뷰어 참고사항:
- CODEOWNERS에 따라 자동으로 리뷰어가 할당됩니다
- 🟪 공유 영역 변경 시 2명 이상의 Approve가 필요합니다
- 긴급 Hotfix는 제목에 [HOTFIX] 태그를 붙이고 1명 Approve로 머지 가능합니다
-->
