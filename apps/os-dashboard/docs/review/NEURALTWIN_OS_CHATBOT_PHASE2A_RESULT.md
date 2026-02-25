# 기능 개발 결과 문서

## 1. 기본 정보
- **기능명**: NEURALTWIN OS 챗봇 Phase 2-A 패턴 매칭 인텐트 분류기 + 네비게이션 액션
- **개발 완료일**: 2026-02-05
- **기반 요청서**: `NEURALTWIN_OS_CHATBOT_PHASE2A_REQUEST.md` (v1.0)

## 2. 개발 요약
사용자 메시지에서 `navigate` 인텐트를 패턴 매칭으로 분류하고, 해당 인텐트에 대한 네비게이션 액션을 반환하는 기능을 구현했습니다. "인사이트 허브로 가줘" 같은 명령 시 백엔드에서 `navigate` 액션과 대상 페이지 정보를 반환합니다. 프론트엔드 통합은 Phase 2-C에서 진행 예정입니다.

## 3. 변경 파일 목록

### 신규 생성 파일
| 파일 경로 | 설명 |
|-----------|------|
| `supabase/functions/neuraltwin-assistant/intent/patterns.ts` | navigate 인텐트 패턴 정의 + PAGE_MAP |
| `supabase/functions/neuraltwin-assistant/intent/classifier.ts` | 하이브리드 인텐트 분류기 (현재 패턴 매칭만) |
| `supabase/functions/neuraltwin-assistant/actions/navigationActions.ts` | navigate 액션 처리 + 페이지별 후속 제안 |

### 수정된 파일
| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `supabase/functions/neuraltwin-assistant/index.ts` | classifyIntent, dispatchNavigationAction import 및 연동 |

### 삭제된 파일
| 파일 경로 | 사유 |
|-----------|------|
| (없음) | |

## 4. 구현 상세

### 4.1 PAGE_MAP (페이지 매핑)
| 키워드 | 대상 경로 |
|--------|-----------|
| 인사이트, 인사이트 허브, insight, insights | `/insights` |
| 스튜디오, 디지털트윈, studio | `/studio` |
| ROI, roi, 알오아이, ROI 측정 | `/roi` |
| 설정, settings, 세팅 | `/settings` |
| 데이터 컨트롤타워, 컨트롤타워 | `/data/control-tower` |

### 4.2 navigate 인텐트 패턴 (3개)
```typescript
/(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings|데이터\s*컨트롤|컨트롤타워).*(?:로|으로|에)?\s*(?:가|이동|열|보여|가줘|이동해|열어|보여줘)/i
/(?:가|이동|열|보여)\s*(?:줘|해)?\s*(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings)/i
/(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings|컨트롤타워)\s*(?:페이지|화면)?\s*(?:열어|보여|가)/i
```

### 4.3 페이지별 후속 제안
| 페이지 | 제안 목록 |
|--------|-----------|
| `/insights` | 고객탭 보여줘, 오늘 매출 얼마야?, 최근 7일 데이터로 변경해줘 |
| `/studio` | AI 시뮬레이션 탭 열어줘, 시뮬레이션 돌려줘, 최적화 해줘 |
| `/roi` | 90일 기간으로 변경해줘, 적용된 전략 보여줘 |
| `/settings` | 매장 관리 탭 열어줘, 데이터 연결 추가해줘 |
| `/data/control-tower` | 새 연결 추가해줘, 데이터 품질 확인해줘 |

## 5. 커밋 이력
| 커밋 해시 | 메시지 | 주요 변경 |
|-----------|--------|-----------|
| `95df610` | `feat: Phase 2-A 패턴 매칭 인텐트 분류기 + 네비게이션 액션 구현` | intent/, actions/ 신규 + index.ts 연동 |

## 6. 사용자 수행 필요 작업

| 작업 | 상세 설명 | 완료 여부 |
|------|-----------|-----------|
| Edge Function 배포 | `supabase functions deploy neuraltwin-assistant` 명령으로 배포 | ⬜ 미완료 |

## 7. 테스트 확인 사항

### Edge Function 테스트
```bash
# Edge Function 로컬 실행
supabase functions serve neuraltwin-assistant --no-verify-jwt

# 테스트 1: navigate 인텐트
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "message": "인사이트 허브로 가줘",
    "context": {
      "page": { "current": "settings" },
      "store": { "id": "store-uuid", "name": "테스트 매장" }
    }
  }'

# 예상 응답:
# {
#   "message": "인사이트 허브 페이지로 이동합니다.",
#   "actions": [{ "type": "navigate", "target": "/insights" }],
#   "suggestions": ["고객탭 보여줘", "오늘 매출 얼마야?", ...],
#   "meta": { "intent": "navigate", "confidence": 0.95, ... }
# }

# 테스트 2: general_chat 폴백
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "message": "안녕",
    "context": {
      "page": { "current": "insights" },
      "store": { "id": "store-uuid", "name": "테스트 매장" }
    }
  }'

# 예상 응답:
# {
#   "meta": { "intent": "general_chat", "confidence": 0.5, ... }
# }
```

### 확인 체크리스트
- [ ] "인사이트 허브로 가줘" → navigate 인텐트 + `/insights` 반환
- [ ] "스튜디오 열어줘" → navigate 인텐트 + `/studio` 반환
- [ ] "ROI 페이지 보여줘" → navigate 인텐트 + `/roi` 반환
- [ ] "설정으로 이동해" → navigate 인텐트 + `/settings` 반환
- [ ] "컨트롤타워 가줘" → navigate 인텐트 + `/data/control-tower` 반환
- [ ] "안녕" → general_chat 폴백 (confidence: 0.5)

## 8. 알려진 제한사항 / 참고사항

### 현재 제한사항
1. **패턴 매칭만 지원**: AI 기반 인텐트 분류는 Phase 3-A에서 추가 예정
2. **navigate 인텐트만 지원**: set_tab, set_date_range 등은 Phase 2-B에서 추가 예정
3. **프론트엔드 미연동**: 프론트엔드에서 actions를 받아 실제 네비게이션 수행은 Phase 2-C에서 구현

### 다음 Phase 예고
**Phase 2-B**: 엔티티 추출 + 탭/날짜 액션
- `intent/entityExtractor.ts` — 날짜, 탭명 추출
- `intent/patterns.ts` 확장 — set_tab, set_date_range 패턴 추가
- `actions/navigationActions.ts` 확장 — handleSetTab, handleSetDateRange 구현

### 참고 문서
| 문서 | 경로 |
|------|------|
| Phase 2-A 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_PHASE2A_REQUEST.md` |
| 마스터 요청서 | `docs/review/NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md` |

---

**Phase 2-A 기능 개발 결과 문서 끝**
