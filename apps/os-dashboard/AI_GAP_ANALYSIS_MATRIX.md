# AI 갭 분석 매트릭스

## 작성일: 2026-01-12
## 프로젝트: NEURALTWIN - AI 고도화 스프린트

---

## 전략 문서 요구사항 vs 현재 상태 매트릭스

### 범례
- ✅ 구현됨
- 🟡 부분 구현
- 🔴 미구현
- 갭 크기: S(Small), M(Medium), L(Large)
- 구현 난이도: 1(쉬움) ~ 5(어려움)
- 우선순위: P0(즉시) ~ P3(백로그)

---

## Pillar 1: 도메인 지식 구조화

| 요구사항 | 전략문서 출처 | 현재 상태 | 갭 크기 | 구현 난이도 | 우선순위 | Sprint |
|----------|-------------|----------|--------|------------|----------|--------|
| Zone_Type 정의 (entrance, main, display 등) | Pillar 1 / Phase 1 | ✅ zones_dim.zone_type | S | 1 | P3 | - |
| Zone VMD 속성 (Golden Zone, Dead Space) | Pillar 1 / Phase 1 | 🔴 미구현 | M | 2 | P1 | Sprint 2 |
| Fixture 속성 (Capacity, Face 수) | Pillar 1 / Phase 1 | 🟡 부분 구현 | M | 2 | P1 | Sprint 2 |
| SKU 속성 (margin, turnover, cross-sell) | Pillar 1 / Phase 1 | 🔴 미구현 | M | 3 | P2 | Sprint 2 |
| VMD 룰셋 DB (Butt-Brush Effect 등) | Pillar 1 / Phase 1 | 🟡 코드북만 정의 | M | 3 | P2 | Sprint 2 |
| 리테일 온톨로지 스키마 | Phase 1 | 🟡 기본 구조만 | M | 3 | P1 | Sprint 2 |
| VMD 룰셋 Vector DB (RAG) | Phase 1 | 🔴 미구현 | L | 4 | P2 | Backlog |

---

## Pillar 2: 시뮬레이션 및 추론 엔진

| 요구사항 | 전략문서 출처 | 현재 상태 | 갭 크기 | 구현 난이도 | 우선순위 | Sprint |
|----------|-------------|----------|--------|------------|----------|--------|
| What-If 시뮬레이터 | Pillar 2 / Phase 2 | 🟡 기본 구현 | M | 3 | P1 | Sprint 1 |
| 레이아웃 변경 → 결과 예측 | Pillar 2 | 🟡 AI 추측 기반 | M | 3 | P1 | Sprint 1 |
| ROI 예측 수식 (노출수 × 전환율 × 객단가) | Pillar 2 | 🔴 AI 추측 | L | 3 | P0 | Sprint 1 |
| 이상 징후 탐지 | Pillar 2 | 🟡 진단 이슈 생성 | S | 2 | P2 | Sprint 2 |
| Function Calling 구현 | Phase 2 | 🔴 미구현 | L | 4 | P0 | Sprint 1 |
| LLM → Python 계산 모듈 호출 | Phase 2 | 🔴 미구현 | L | 4 | P0 | Sprint 1 |
| 인과 추론 모델링 | Phase 2 | 🔴 미구현 | L | 5 | P3 | Backlog |
| 가상 대조군 생성 | Phase 2 | 🔴 미구현 | L | 5 | P3 | Backlog |

---

## Pillar 3: 응답 구조화

| 요구사항 | 전략문서 출처 | 현재 상태 | 갭 크기 | 구현 난이도 | 우선순위 | Sprint |
|----------|-------------|----------|--------|------------|----------|--------|
| Prescriptive JSON Schema | Pillar 3 / Phase 3 | 🟡 generate-optimization만 | M | 2 | P0 | Sprint 0 |
| action_type, coordinates, reasoning | Pillar 3 | ✅ 구현됨 | S | 1 | P3 | - |
| expected_outcome 구조화 | Pillar 3 | ✅ 구현됨 | S | 1 | P3 | - |
| XAI 모듈 (근거 생성) | Pillar 3 | 🟡 ai_insights만 | M | 3 | P1 | Sprint 2 |
| Response Schema 강제 (Gemini API) | Phase 3 | 🟡 부분 적용 | M | 2 | P0 | Sprint 0 |
| Prescriptive JSON만 출력 | Phase 3 | 🟡 일부 함수만 | M | 2 | P0 | Sprint 0 |
| 파싱 에러 폴백 로직 | Phase 3 | 🔴 미구현 | M | 2 | P0 | Sprint 0 |

---

## Pillar 4: MLOps 및 지속적 학습

| 요구사항 | 전략문서 출처 | 현재 상태 | 갭 크기 | 구현 난이도 | 우선순위 | Sprint |
|----------|-------------|----------|--------|------------|----------|--------|
| Accept/Reject/Modify 피드백 파이프라인 | Pillar 4 / Phase 4 | 🟡 Accept/Reject만 | M | 3 | P1 | Sprint 3 |
| 피드백 기반 모델 개선 | Pillar 4 | 🔴 테이블만 존재 | L | 4 | P1 | Sprint 3 |
| RAG 구축 (매장별 기억) | Pillar 4 | 🔴 미구현 | L | 5 | P2 | Backlog |
| 암묵적 피드백 루프 | Phase 4 | 🔴 미구현 | L | 4 | P1 | Sprint 3 |
| Store Persona 주입 | Phase 4 | 🔴 미구현 | M | 3 | P1 | Sprint 3 |
| 매장별 System Prompt | Phase 4 | 🔴 미구현 | M | 3 | P1 | Sprint 3 |

---

## 우선순위별 요약

### P0 - 즉시 실행 (Sprint 0, 1주 내)

| ID | 요구사항 | 갭 크기 | 난이도 | 비고 |
|----|----------|--------|--------|------|
| P0-1 | Response Schema 전면 적용 | M | 2 | run-simulation 수정 필요 |
| P0-2 | 파싱 에러 폴백 로직 | M | 2 | 모든 Edge Function |
| P0-3 | 3D UI 렌더링 에러 처리 | S | 1 | 프론트엔드 |

### P1 - 단기 (Sprint 1-3, 2-6주)

| ID | 요구사항 | 갭 크기 | 난이도 | 비고 |
|----|----------|--------|--------|------|
| P1-1 | Function Calling 구현 | L | 4 | Gemini Tool Use |
| P1-2 | ROI 예측 수식 모듈화 | L | 3 | TypeScript 함수 |
| P1-3 | Zone VMD 속성 확장 | M | 2 | DB 스키마 수정 |
| P1-4 | 피드백 학습 파이프라인 | L | 4 | 자동 학습 활성화 |
| P1-5 | Store Persona 시스템 | M | 3 | 매장별 프롬프트 |

### P2 - 중기 (Sprint 4+)

| ID | 요구사항 | 갭 크기 | 난이도 | 비고 |
|----|----------|--------|--------|------|
| P2-1 | VMD 룰셋 Vector DB | L | 4 | pgvector 설정 |
| P2-2 | RAG 기반 룰셋 검색 | L | 5 | Embedding + 검색 |
| P2-3 | SKU 속성 확장 | M | 3 | margin, turnover |

### P3 - 장기 (Backlog)

| ID | 요구사항 | 갭 크기 | 난이도 | 비고 |
|----|----------|--------|--------|------|
| P3-1 | 인과 추론 모델 | L | 5 | 고급 ML |
| P3-2 | A/B 테스트 프레임워크 | L | 4 | 실험 인프라 |
| P3-3 | 실시간 동선 분석 | L | 5 | WiFi/비콘 연동 |

---

## 갭 크기별 분포

```
┌─────────────────────────────────────────┐
│ 갭 크기 분포                            │
├──────────┬──────────────────────────────┤
│ Small    │ ████ 4건 (14%)               │
│ Medium   │ ████████████ 12건 (43%)      │
│ Large    │ ████████████ 12건 (43%)      │
└──────────┴──────────────────────────────┘
```

---

## 구현 난이도별 분포

```
┌─────────────────────────────────────────┐
│ 구현 난이도 분포                        │
├──────────┬──────────────────────────────┤
│ 1 (쉬움) │ ██ 2건                        │
│ 2        │ ████████ 8건                  │
│ 3        │ ██████████ 10건               │
│ 4        │ ████████ 8건                  │
│ 5 (어려움)│ ████ 4건                      │
└──────────┴──────────────────────────────┘
```

---

## 전략적 권장사항

### 1. Quick Wins (빠른 성과)
- Response Schema 전면 적용 → **파싱 에러 0% 달성**
- 에러 핸들링 강화 → **Demo Day 안정성**

### 2. High Impact (높은 영향도)
- Function Calling 구현 → **수치 정확도 20% 향상**
- 피드백 학습 활성화 → **지속적 개선 체계**

### 3. Strategic Enablers (전략적 기반)
- 온톨로지 확장 → **도메인 지식 체계화**
- Store Persona → **매장별 차별화**

### 4. Future Investment (미래 투자)
- RAG 시스템 → **맥락 기반 추천**
- 인과 추론 → **과학적 예측**

---

*문서 버전: 1.0*
*최종 수정: 2026-01-12*
