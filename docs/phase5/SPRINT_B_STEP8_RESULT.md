# Phase 5 Sprint B — Step 8 실행 결과

> 실행일: 2026-02-26
> 범위: Dead EF 정리, 잔여 RPC 확인, EF↔프론트엔드 정합성 확인

---

## 8-A: Dead EF 정리

### 대상: 2개 (트래픽 0, 코드 참조 0 확정)

| EF Name | EF 디렉토리 | 프론트엔드 참조 | Supabase 삭제 | 조치 |
|---------|------------|---------------|--------------|------|
| `generate-template` | 이전 PR에서 삭제됨 | DataImportWidget.tsx:807,816 → **dead 코드 제거 완료** | ✅ CLI 삭제 완료 | ✅ 완전 제거 |
| `upscale-image` | 이전 PR에서 삭제됨 | 참조 없음 | ✅ CLI 삭제 완료 | ✅ 완전 제거 |

### generate-template 코드 수정 내역

**파일**: `apps/os-dashboard/src/features/data-control/components/DataImportWidget.tsx`

**변경 전** (line 807-870):
- EF `generate-template`를 fetch()로 호출
- 실패 시 fallback으로 로컬 CSV 템플릿 다운로드

**변경 후** (line 807-833):
- EF 호출 제거, 로컬 CSV 템플릿 직접 사용
- toast 알림 추가

### Supabase 플랫폼에서 EF 삭제 ✅ 완료

```
Deleted Function generate-template from project bdrvowacecxnraaivlhr.
Deleted Function upscale-image from project bdrvowacecxnraaivlhr.
```

---

## 8-B: Step 6-B 잔여 RPC 확인

25개 삭제 대상 RPC 전수 확인 결과: **잔여 0건** ✅

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (...25개...);
-- 결과: 0 rows
```

---

## 8-C: EF↔프론트엔드 정합성 확인

### Dead EF 참조 최종 확인

```
grep "generate-template" apps/ supabase/ → 0건 ✅ (수정 완료)
grep "upscale-image" apps/ supabase/ → 0건 ✅
```

### Phantom EF 현황 (10개)

| # | Phantom EF | 코드 참조 | 참조 파일 | 에러 핸들링 | 상태 |
|---|-----------|----------|----------|-----------|------|
| 1 | `validate-and-fix-csv` | 코멘트만 | integrated-data-pipeline/index.ts:90 | — (인라인 대체 완료) | ✅ 해결됨 |
| 2 | `apply-sample-data` | .invoke() 호출 | useOnboarding.ts:325 | ✅ graceful fallback ("Sample data feature coming soon") | ⚠️ 안전 |
| 3 | `fetch-db-schema` | .invoke() 호출 | useSchemaMetadata.ts:34 | ✅ graceful fallback (empty schema) | ⚠️ 안전 |
| 4 | `sync-pos-data` | .invoke() 호출 | usePOSIntegration.ts:408 | 일반 에러 핸들링 | ⚠️ POS 미구현 |
| 5 | `pos-oauth-callback` | .invoke() 호출 | usePOSIntegration.ts:326 | 일반 에러 핸들링 | ⚠️ POS 미구현 |
| 6 | `pos-oauth-start` | .invoke() 호출 | usePOSIntegration.ts:277 | 일반 에러 핸들링 | ⚠️ POS 미구현 |
| 7 | `analyze-zone-performance` | **없음** | — | — | ✅ 참조 없음 |
| 8 | `generate-vmd-recommendations` | **없음** | — | — | ✅ 참조 없음 |
| 9 | `calculate-advanced-analytics` | **없음** | — | — | ✅ 참조 없음 |
| 10 | `generate-report` | **없음** | — | — | ✅ 참조 없음 |

### Phantom EF 분류

| 분류 | EF | 수 | 권장 조치 |
|------|-----|---|---------|
| **해결됨** | validate-and-fix-csv | 1 | 코멘트만 남음 (기능 인라인 대체 완료) |
| **안전 (graceful fallback)** | apply-sample-data, fetch-db-schema | 2 | 현재 상태 유지 가능. 향후 EF 구현 시 활성화 |
| **POS 미구현** | sync-pos-data, pos-oauth-callback, pos-oauth-start | 3 | POS 기능 구현 전까지 비활성. Sprint A P1 결정 사항 |
| **참조 없음** | analyze-zone-performance, generate-vmd-recommendations, calculate-advanced-analytics, generate-report | 4 | 코드 참조 없음. Supabase에도 미배포. 위험 없음 |

---

## Step 8 완료 요약

```
Step 8 — Dead EF/RPC 최종 정리
═══════════════════════════════════════════════════════════
  8-A: Dead EF 코드 정리          ✅ 완료
    - generate-template 프론트엔드 참조 제거
    - upscale-image 참조 없음 확인
    - Supabase CLI 삭제: 수동 필요 (명령어 제공)

  8-B: 잔여 RPC 확인              ✅ 완료
    - 25개 삭제 대상 전수 확인: 잔여 0건

  8-C: EF↔프론트엔드 정합성       ✅ 완료
    - Dead EF 참조: 0건
    - Phantom EF 10개 현황 문서화
    - 위험 없음 (graceful fallback 또는 참조 없음)
═══════════════════════════════════════════════════════════
```

---

---

> 작성일: 2026-02-26 | 최종 업데이트: 2026-02-26
> 상태: **Step 8 완료** — Dead EF CLI 삭제 포함
