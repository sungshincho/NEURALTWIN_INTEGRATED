# 기능 개발 결과 문서

## 1. 기본 정보
- **기능명**: NEURALTWIN OS 챗봇 Phase 2-B 엔티티 추출기 + 탭/날짜 액션
- **개발 완료일**: 2026-02-05
- **기반 요청서**: `NEURALTWIN_OS_CHATBOT_PHASE2B_REQUEST.md` (v1.0)

## 2. 개발 요약
사용자 메시지에서 탭명, 날짜 범위를 추출하는 엔티티 추출기를 구현하고, `set_tab`, `set_date_range`, `composite_navigate` 인텐트를 처리하는 액션 핸들러를 추가했습니다. "고객탭 보여줘", "11/4~11/15 기간으로 설정해줘" 같은 명령을 처리할 수 있습니다.

## 3. 변경 파일 목록

### 신규 생성 파일
| 파일 경로 | 설명 |
|-----------|------|
| `supabase/functions/neuraltwin-assistant/intent/entityExtractor.ts` | TAB_MAP, DATE_PRESET_MAP, 엔티티 추출 함수 |

### 수정된 파일
| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `supabase/functions/neuraltwin-assistant/intent/patterns.ts` | set_tab, set_date_range, composite_navigate 패턴 추가 |
| `supabase/functions/neuraltwin-assistant/intent/classifier.ts` | currentPage 컨텍스트 전달 추가 |
| `supabase/functions/neuraltwin-assistant/actions/navigationActions.ts` | handleSetTab, handleSetDateRange, handleCompositeNavigate 추가 |
| `supabase/functions/neuraltwin-assistant/index.ts` | 새로운 인텐트 처리 분기 추가 |

### 삭제된 파일
| 파일 경로 | 사유 |
|-----------|------|
| (없음) | |

## 4. 구현 상세

### 4.1 TAB_MAP (페이지별 탭 매핑)

**insights 페이지**
| 키워드 | 탭 값 |
|--------|-------|
| 개요, overview | `overview` |
| 매장, store | `store` |
| 고객, customer | `customer` |
| 상품, product | `product` |
| 재고, inventory | `inventory` |
| 예측, prediction | `prediction` |
| AI추천, ai | `ai` |

**settings 페이지**
| 키워드 | 탭 값 |
|--------|-------|
| 매장 관리, stores | `stores` |
| 데이터, data | `data` |
| 사용자, users | `users` |
| 시스템, system | `system` |
| 플랜, license | `license` |

**studio 페이지**
| 키워드 | 탭 값 |
|--------|-------|
| 레이어, layer | `layer` |
| AI 시뮬레이션, 시뮬레이션 | `ai-simulation` |
| AI 최적화, 최적화 | `ai-optimization` |
| 적용, apply | `apply` |

### 4.2 DATE_PRESET_MAP (날짜 프리셋 매핑)
| 키워드 | 프리셋 값 |
|--------|-----------|
| 오늘, today | `today` |
| 7일, 일주일, 1주일 | `7d` |
| 30일, 한달, 1개월 | `30d` |
| 90일, 3개월 | `90d` |

### 4.3 새로운 인텐트 패턴

**set_tab**
- `고객탭 보여줘`
- `매장 탭 열어줘`
- `예측탭으로 이동`

**set_date_range**
- `11/4~11/15` (커스텀 범위)
- `오늘 데이터로 변경`
- `최근 7일로 설정`
- `30일 기간으로`

**composite_navigate**
- `인사이트 허브 고객탭에서 11/4~11/15 보여줘`
- `고객탭에서 오늘 데이터로`

## 5. 커밋 이력
| 커밋 해시 | 메시지 | 주요 변경 |
|-----------|--------|-----------|
| `ec844e9` | `feat: Phase 2-B 엔티티 추출기 + 탭/날짜 액션 구현` | entityExtractor 신규 + patterns/actions/index 수정 |

## 6. 사용자 수행 필요 작업

| 작업 | 상세 설명 | 완료 여부 |
|------|-----------|-----------|
| Edge Function 배포 | `supabase functions deploy neuraltwin-assistant` (Phase 2-C 완료 후 진행) | ⬜ 미완료 |

## 7. 테스트 확인 사항

### Edge Function 테스트
```bash
# Edge Function 로컬 실행
supabase functions serve neuraltwin-assistant --no-verify-jwt

# 테스트 1: set_tab 인텐트
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "message": "고객탭 보여줘",
    "context": {
      "page": { "current": "/insights" },
      "store": { "id": "store-uuid", "name": "테스트 매장" }
    }
  }'

# 예상 응답:
# {
#   "message": "고객 탭으로 이동합니다.",
#   "actions": [{ "type": "navigate", "target": "/insights?tab=customer" }],
#   "meta": { "intent": "set_tab", "confidence": 0.90, ... }
# }

# 테스트 2: set_date_range 인텐트 (프리셋)
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "message": "최근 7일로 변경해줘",
    "context": {
      "page": { "current": "/insights" },
      "store": { "id": "store-uuid", "name": "테스트 매장" }
    }
  }'

# 예상 응답:
# {
#   "message": "기간을 최근 7일로 설정합니다.",
#   "actions": [{ "type": "set_date_range", "preset": "7d" }],
#   "meta": { "intent": "set_date_range", ... }
# }

# 테스트 3: set_date_range 인텐트 (커스텀 범위)
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "message": "11/4~11/15 기간으로 설정해줘",
    "context": {
      "page": { "current": "/insights" },
      "store": { "id": "store-uuid", "name": "테스트 매장" }
    }
  }'

# 예상 응답:
# {
#   "message": "기간을 2026-11-04 ~ 2026-11-15로 설정합니다.",
#   "actions": [{ "type": "set_date_range", "startDate": "2026-11-04", "endDate": "2026-11-15" }],
#   "meta": { "intent": "set_date_range", ... }
# }
```

### 확인 체크리스트
- [ ] "고객탭 보여줘" → set_tab 인텐트 + tab=customer
- [ ] "최근 7일로 변경해줘" → set_date_range + preset=7d
- [ ] "11/4~11/15 기간으로" → set_date_range + startDate/endDate
- [ ] "인사이트 허브 고객탭에서 7일" → composite_navigate
- [ ] 탭에서 페이지 추론 동작 확인 (고객탭 → /insights)

## 8. 알려진 제한사항 / 참고사항

### 현재 제한사항
1. **패턴 매칭만 지원**: AI 기반 인텐트 분류는 Phase 3-A에서 추가 예정
2. **composite_navigate 패턴 제한**: 복잡한 복합 명령은 패턴 매칭 한계로 인식 실패 가능
3. **프론트엔드 미연동**: 프론트엔드에서 actions를 받아 실제 탭/날짜 변경은 Phase 2-C에서 구현

### 다음 Phase 예고
**Phase 2-C**: 프론트엔드 통합
- `src/hooks/useAssistantChat.ts` — 실제 AI 연동 훅
- `src/features/assistant/utils/actionDispatcher.ts` — UIAction 실행
- `DashboardLayout.tsx` 최소 수정 — useChatPanel → useAssistantChat

### 참고 문서
| 문서 | 경로 |
|------|------|
| Phase 2-B 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE2B_REQUEST.md` |
| Phase 2-A 결과 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE2A_RESULT.md` |
| 마스터 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md` |

---

**Phase 2-B 기능 개발 결과 문서 끝**
