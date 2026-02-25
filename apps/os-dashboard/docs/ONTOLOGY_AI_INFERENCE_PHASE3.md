# Phase 3: AI 추론 엔진 - 온톨로지 기반 고급 분석

## 📋 개요

Phase 3은 온톨로지와 지식 그래프를 활용한 고급 AI 추론 기능을 제공합니다. 단순한 데이터 조회를 넘어 **관계 기반 추론**, **패턴 발견**, **이상 탐지**를 통해 비즈니스 인사이트를 자동으로 생성합니다.

## 🎯 핵심 기능

### 1. 온톨로지 기반 추천 시스템

지식 그래프의 관계를 분석하여 제품, 고객, 카테고리 추천을 수행합니다.

**추천 방식:**
- **협업 필터링 (Collaborative Filtering)**: 유사한 고객들이 구매한 제품 추천
- **콘텐츠 기반 (Content-Based)**: 유사한 속성을 가진 엔티티 추천  
- **그래프 탐색 (Graph Traversal)**: 관계 체인을 따라 연결된 엔티티 추천
- **하이브리드 (Hybrid)**: 여러 방식을 결합한 추천

**예시:**
- "제품 A를 구매한 고객들은 제품 B도 구매했습니다"
- "고객 C와 유사한 고객들은 카테고리 X의 제품을 선호합니다"
- "이 제품과 함께 구매하면 좋은 제품 3가지"

### 2. 지식 그래프 기반 이상 탐지

그래프 구조와 엔티티 속성을 분석하여 비정상 패턴을 탐지합니다.

**이상 유형:**
- **구조적 이상 (Structural Anomalies)**
  - 고립된 노드 (Isolated Nodes): 연결이 없는 제품/고객
  - 비정상 허브 (Abnormal Hubs): 너무 많은 연결을 가진 노드
  - 예상치 못한 관계: 정상적이지 않은 연결

- **행동적 이상 (Behavioral Anomalies)**
  - 평소와 다른 구매 패턴
  - 갑작스러운 판매량 변화
  - 비정상적인 고객 행동

- **값 이상 (Value Anomalies)**
  - 통계적 이상치 (Statistical Outliers)
  - 예상 범위를 벗어난 속성 값

**예시:**
- "제품 X는 다른 제품과 연결이 없습니다 (판매 데이터 누락?)"
- "고객 Y의 구매 패턴이 평소와 크게 다릅니다"
- "이번 주 제품 Z의 판매량이 평균 대비 300% 증가했습니다"

### 3. 관계 패턴 분석

지식 그래프에서 의미 있는 패턴을 발견하고 비즈니스 기회를 제안합니다.

**패턴 유형:**
- **빈발 패턴 (Frequent Patterns)**: 자주 등장하는 관계 구조
- **연관 규칙 (Association Rules)**: A가 있으면 B도 있을 확률
- **순차 패턴 (Sequential Patterns)**: 시간 순서를 가진 행동 패턴
- **클러스터 (Clusters)**: 유사한 특성을 가진 엔티티 그룹

**예시:**
- "제품 A와 제품 B는 80% 확률로 함께 구매됩니다 (Association)"
- "카테고리 X의 제품들은 3개의 명확한 고객 세그먼트로 나뉩니다 (Cluster)"
- "신규 고객은 보통 제품 A → 제품 B → 제품 C 순서로 구매합니다 (Sequential)"

## 🛠️ 구현 아키텍처

### Edge Function: `ontology-ai-inference`

```
supabase/functions/ontology-ai-inference/index.ts
```

**역할:**
1. 지식 그래프 데이터 로드 (`graph_entities`, `graph_relations`)
2. Lovable AI (Google Gemini 2.5 Flash) 호출하여 고급 추론 수행
3. 추천, 이상 탐지, 패턴 분석 결과 생성
4. 추천 결과를 `ai_recommendations` 테이블에 자동 저장

**API 엔드포인트:**
```typescript
POST /functions/v1/ontology-ai-inference
Content-Type: application/json
Authorization: Bearer <user_jwt>

{
  "inference_type": "recommendation" | "anomaly_detection" | "pattern_analysis",
  "store_id": "store-uuid",
  "entity_id": "entity-uuid" (optional),
  "parameters": {
    "recommendation_type": "product" | "customer" | "category",
    "sensitivity": "high" | "medium" | "low",
    "analysis_type": "all" | "frequency" | "sequential" | "co-occurrence"
  }
}
```

### Frontend Hook: `useOntologyInference`

```typescript
import { useOntologyInference } from '@/hooks/useOntologyInference';

const { 
  generateRecommendations,
  detectAnomalies,
  analyzePatterns,
  loading,
  error 
} = useOntologyInference();
```

**사용 예시:**

```typescript
// 1. 온톨로지 기반 제품 추천
const recommendations = await generateRecommendations(
  storeId,
  productId, // 특정 제품 기준 추천 (optional)
  'product'
);

// 2. 이상 탐지
const anomalyResults = await detectAnomalies(storeId, 'medium');
console.log(anomalyResults.anomalies); // 탐지된 이상 목록
console.log(anomalyResults.summary.graph_health_score); // 그래프 건강도 점수

// 3. 패턴 분석
const patternResults = await analyzePatterns(storeId, 'all');
console.log(patternResults.patterns); // 발견된 패턴
console.log(patternResults.association_rules); // 연관 규칙
console.log(patternResults.insights); // AI가 생성한 인사이트
```

## 📊 데이터 흐름

```
1. 프론트엔드에서 useOntologyInference 호출
   ↓
2. Edge Function: ontology-ai-inference 호출
   ↓
3. 지식 그래프 데이터 로드
   - graph_entities (엔티티)
   - graph_relations (관계)
   - ontology_entity_types (엔티티 타입)
   - ontology_relation_types (관계 타입)
   ↓
4. 통계적 분석 수행
   - 관계 패턴 추출
   - 구조적 이상 탐지
   - 빈도 분석
   ↓
5. Lovable AI 호출 (Google Gemini 2.5 Flash)
   - 그래프 데이터를 프롬프트에 포함
   - JSON 구조화된 응답 요청
   ↓
6. AI 추론 결과 생성
   - 추천: OntologyRecommendation[]
   - 이상: OntologyAnomaly[]
   - 패턴: GraphPattern[], AssociationRule[]
   ↓
7. 추천 결과를 ai_recommendations 테이블에 저장
   ↓
8. 프론트엔드로 결과 반환
```

## 🎨 UI 통합 예시

### 1. 대시보드에 온톨로지 추천 표시

```typescript
import { useOntologyInference } from '@/hooks/useOntologyInference';
import { useSelectedStore } from '@/hooks/useSelectedStore';

function DashboardPage() {
  const { selectedStore } = useSelectedStore();
  const { generateRecommendations, loading } = useOntologyInference();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (selectedStore) {
      generateRecommendations(selectedStore.id, undefined, 'product')
        .then(recs => setRecommendations(recs || []));
    }
  }, [selectedStore]);

  return (
    <div>
      <h2>온톨로지 기반 추천</h2>
      {loading ? <Spinner /> : (
        <div className="grid gap-4">
          {recommendations.map(rec => (
            <Card key={rec.entity_id}>
              <h3>{rec.entity_label}</h3>
              <Badge>신뢰도: {(rec.confidence * 100).toFixed(0)}%</Badge>
              <p>{rec.reasoning}</p>
              {rec.expected_impact && (
                <div>
                  <p>예상 매출: ₩{rec.expected_impact.estimated_revenue?.toLocaleString()}</p>
                  <p>전환 확률: {(rec.expected_impact.conversion_probability! * 100).toFixed(1)}%</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. 이상 탐지 알림

```typescript
function AnomalyMonitor() {
  const { detectAnomalies } = useOntologyInference();
  const { selectedStore } = useSelectedStore();

  const checkAnomalies = async () => {
    const result = await detectAnomalies(selectedStore.id, 'high');
    
    if (result) {
      const criticalAnomalies = result.anomalies.filter(a => a.severity === 'critical');
      
      if (criticalAnomalies.length > 0) {
        toast.error(`${criticalAnomalies.length}개의 중요 이상 징후 발견!`);
      }
    }
  };

  return (
    <Button onClick={checkAnomalies}>이상 탐지 실행</Button>
  );
}
```

### 3. 패턴 분석 시각화

```typescript
function PatternAnalysisPage() {
  const { analyzePatterns } = useOntologyInference();
  const [patterns, setPatterns] = useState<GraphPattern[]>([]);
  const [rules, setRules] = useState<AssociationRule[]>([]);

  const runAnalysis = async () => {
    const result = await analyzePatterns(storeId, 'all');
    if (result) {
      setPatterns(result.patterns);
      setRules(result.association_rules);
    }
  };

  return (
    <div>
      <h2>관계 패턴 분석</h2>
      
      <section>
        <h3>발견된 패턴</h3>
        {patterns.map(pattern => (
          <Card key={pattern.pattern_id}>
            <Badge>{pattern.pattern_type}</Badge>
            <h4>{pattern.description}</h4>
            <p>{pattern.business_interpretation}</p>
            <p className="font-semibold">{pattern.actionable_insight}</p>
          </Card>
        ))}
      </section>

      <section>
        <h3>연관 규칙</h3>
        {rules.map((rule, idx) => (
          <Card key={idx}>
            <p>If {rule.antecedent.join(', ')} → Then {rule.consequent.join(', ')}</p>
            <div>
              <span>Support: {(rule.support * 100).toFixed(1)}%</span>
              <span>Confidence: {(rule.confidence * 100).toFixed(1)}%</span>
              <span>Lift: {rule.lift.toFixed(2)}</span>
            </div>
            <p>{rule.interpretation}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
```

## 🔧 Helper Functions

Edge Function 내부에서 사용되는 주요 헬퍼 함수들:

### `analyzeRelationPatterns(graphData)`
관계 타입별 빈도, 엔티티 쌍 패턴 추출

### `detectStructuralAnomalies(graphData)`
고립된 노드, 허브 노드 등 구조적 이상 탐지

### `detectValueAnomalies(graphData)`
엔티티 속성의 통계적 이상치 탐지

### `extractFrequencyPatterns(graphData)`
관계/엔티티 타입별 빈도 패턴 추출

### `extractCoOccurrencePatterns(graphData)`
동시 발생 패턴 (함께 구매된 제품 등)

### `saveRecommendationsToDatabase(supabase, storeId, recommendations)`
추천 결과를 `ai_recommendations` 테이블에 저장

## 📈 성능 최적화

1. **그래프 크기 제한**: 샘플링 사용 (대규모 그래프의 경우 최대 500개 노드/1000개 엣지)
2. **AI 모델 선택**: `google/gemini-2.5-flash` 사용 (빠르고 비용 효율적)
3. **캐싱**: 자주 사용되는 패턴 분석 결과 캐싱 가능
4. **배치 처리**: 여러 매장의 추론을 주기적으로 배치 실행

## 🔒 보안

- Edge Function은 JWT 인증 필요 (`verify_jwt = true`)
- 사용자는 자신의 `org_id`와 `store_id`에 해당하는 데이터만 접근
- AI 추론 결과는 사용자별로 격리

## 🚀 향후 확장 가능성

1. **실시간 추론**: 데이터 변경 시 자동으로 추론 재실행
2. **설명 가능한 AI**: 추천/이상 탐지의 근거를 더 상세히 제공
3. **A/B 테스트**: 추천 전략을 실험하고 성과 측정
4. **자동화된 액션**: 이상 탐지 시 자동으로 알림 발송 또는 조치 실행
5. **시계열 패턴**: 시간에 따른 그래프 변화 분석

## 📚 관련 문서

- [Phase 1: 데이터 파이프라인 통합](./DATA_PIPELINE_PHASE1_IMPLEMENTATION.md)
- [Phase 2: 실시간 동기화](./PHASE2_REALTIME_SYNC_IMPLEMENTATION.md)
- [온톨로지 완전 아키텍처](./ONTOLOGY_COMPLETE_ARCHITECTURE.md)
- [온톨로지 추론 Cron 설정](./ONTOLOGY_INFERENCE_CRON_SETUP.md)

## ✅ Phase 3 체크리스트

- [x] Edge Function `ontology-ai-inference` 생성
- [x] 온톨로지 기반 추천 시스템 구현
- [x] 지식 그래프 기반 이상 탐지 구현
- [x] 관계 패턴 분석 구현
- [x] Frontend Hook `useOntologyInference` 생성
- [x] Helper Functions 구현 (패턴 추출, 이상 탐지)
- [x] AI 추천을 `ai_recommendations` 테이블에 자동 저장
- [x] Supabase config.toml 업데이트
- [x] 문서화 완료

Phase 3 구현이 완료되었습니다! 🎉
