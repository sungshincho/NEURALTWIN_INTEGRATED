# 시뮬레이션 기능 가이드

## 개요
NeuralTwin의 시뮬레이션 기능은 AI 기반 예측을 통해 매장 운영 최적화 시나리오를 테스트하고 비교할 수 있습니다.

## 지원 시나리오 타입

### 1. Layout Simulation (레이아웃 시뮬레이션)
- **목적**: 매장 레이아웃 변경의 영향 예측
- **파라미터**: 구역 변경, 가구 이동, 제품 배치
- **결과**: 고객 동선, 체류 시간, 전환율 변화 예측

### 2. Pricing Simulation (가격 최적화)
- **목적**: 가격 변경이 매출/마진에 미치는 영향
- **파라미터**: 제품별 가격 조정, 할인율
- **결과**: 수요 탄력성, 최적 가격대, 매출 예측

### 3. Demand & Inventory (수요-재고 시뮬레이션)
- **목적**: 수요 예측 및 재고 최적화
- **파라미터**: 예상 수요, 리드타임, 안전재고
- **결과**: 최적 발주량, 재고 회전율, 품절 위험도

### 4. Recommendation Strategy (추천 전략)
- **목적**: AI 추천 시스템의 효과 예측
- **파라미터**: 추천 알고리즘, 타겟 세그먼트
- **결과**: 교차판매 증가율, 객단가 상승률

## 사용 흐름

### 1. Scenario Lab (시나리오 생성)
```
/simulation/lab → 비즈니스 목표 입력 → AI 추천 받기 → 시나리오 선택
```

### 2. 시뮬레이션 실행
```
파라미터 입력 → "Run Simulation" → AI 예측 결과 확인 → KPI 비교
```

### 3. 시나리오 저장 및 비교
```
"Save Scenario" → 이름 지정 → 여러 시나리오 비교 분석
```

## 주요 기능

### AI 예측 엔진
- **Hook**: `useAIInference()`
- **기능**: 매장 컨텍스트 기반 KPI 예측
- **입력**: 시나리오 타입, 파라미터, 매장 데이터
- **출력**: 예측 KPI, 신뢰도, AI 인사이트

### 시나리오 관리
- **Hook**: `useScenarioManager()`
- **기능**: 시나리오 CRUD, 비교 분석
- **저장 정보**: 파라미터, Baseline KPI, Predicted KPI

### KPI 비교
- **Before/After**: 기준선 vs 예측 결과
- **Delta Chart**: 주요 지표 변화율 시각화
- **Confidence Score**: 예측 신뢰도 표시

## 데이터 구조

### Scenario 테이블
```sql
scenarios (
  id, name, scenario_type, params,
  baseline_kpi, predicted_kpi, 
  confidence_score, ai_insights,
  store_id, user_id, status
)
```

### KPI Snapshot 구조
```typescript
{
  conversionRate: number;
  avgTransactionValue: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  inventoryTurnover: number;
  customerSatisfaction: number;
}
```

## 베스트 프랙티스

### 1. 시나리오 생성 전
- ✅ 매장 데이터가 충분히 입력되어 있는지 확인
- ✅ 현재 운영 상태를 Baseline으로 측정
- ✅ 명확한 비즈니스 목표 설정

### 2. 파라미터 설정
- ✅ 현실적인 범위 내에서 변경
- ✅ 한 번에 너무 많은 변수를 변경하지 않기
- ✅ 점진적 변화로 인과관계 파악

### 3. 결과 해석
- ✅ Confidence Score 확인 (70% 이상 권장)
- ✅ AI Insights의 근거 검토
- ✅ 여러 시나리오 비교 후 의사결정

## 제한사항

1. **데이터 품질**: 입력 데이터가 부족하면 예측 정확도 하락
2. **외부 요인**: 시장 변화, 경쟁사 등 외부 변수는 반영 제한
3. **실시간성**: 과거 데이터 기반 예측이므로 급격한 변화 대응 어려움

## 문제 해결

### Q: 예측 결과가 신뢰할 수 없어요
- 매장 데이터를 더 많이 입력하세요 (최소 3개월 이상)
- Confidence Score가 낮으면 파라미터를 조정해보세요

### Q: 시뮬레이션이 너무 오래 걸려요
- AI 모델 처리 시간은 약 3-10초입니다
- 네트워크 상태를 확인하세요

### Q: 저장한 시나리오를 어디서 보나요?
- Dashboard → Simulation Hub → Saved Scenarios

## 관련 파일

### Frontend
- `src/features/simulation/pages/` - 시뮬레이션 페이지들
- `src/features/simulation/hooks/useAIInference.ts` - AI 예측
- `src/features/simulation/hooks/useScenarioManager.ts` - 시나리오 관리
- `src/features/simulation/types/` - 타입 정의

### Backend
- `supabase/functions/advanced-ai-inference/` - AI 추론 엔진

## 다음 단계

1. **Scenario Lab**에서 목표 입력
2. 추천된 시뮬레이션 타입 선택
3. 파라미터 조정 후 실행
4. 결과 분석 및 시나리오 저장
5. 최적 시나리오 선택 후 실제 적용
