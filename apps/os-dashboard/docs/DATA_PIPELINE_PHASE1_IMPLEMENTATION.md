# Phase 1: 데이터 파이프라인 통합 구현

## 개요
API 연동 및 CSV 업로드 데이터를 온톨로지(지식 그래프)로 자동 변환하는 통합 데이터 파이프라인을 구현하였습니다.

## 구현 완료 사항

### 1. API → 온톨로지 자동 변환 ✅

#### Edge Function 수정: `sync-api-data`
- **온톨로지 변환 플래그 추가**: `convert_to_ontology` 옵션
- **자동 변환 프로세스**:
  1. API 데이터를 일반 테이블에 저장
  2. `convert_to_ontology` 옵션이 활성화된 경우
  3. `user_data_imports` 레코드 자동 생성
  4. `integrated-data-pipeline` Edge Function 호출
  5. AI 기반 온톨로지 매핑 (`smart-ontology-mapping`)
  6. 엔티티 및 관계 자동 생성 (`schema-etl`)

#### 주요 기능
```typescript
// sync_config에 온톨로지 변환 옵션 추가
sync_config: {
  target_table: 'customers',
  field_mapping: { /* ... */ },
  convert_to_ontology: true,  // ✅ 온톨로지 자동 변환 활성화
  ontology_entity_type: '<entity_type_id>',  // 선택적 엔티티 타입 지정
}
```

### 2. CSV → 온톨로지 자동 변환 ✅

**이미 완벽하게 구현됨** - `integrated-data-pipeline` Edge Function에서 처리:
1. CSV 파일 업로드
2. 데이터 검증 및 수정 (`validate-and-fix-csv`)
3. AI 기반 온톨로지 매핑 (`smart-ontology-mapping`)
4. 엔티티 및 관계 생성 (`schema-etl`)

### 3. 필드 매핑 UI에 온톨로지 옵션 추가 ✅

#### API 연동 페이지 (`APIIntegrationPage.tsx`)

**새로운 UI 컴포넌트**:
- **온톨로지 자동 변환** 체크박스
- **엔티티 타입 선택** 드롭다운 (선택사항)
  - 기존 엔티티 타입 목록 표시
  - "자동 감지" 옵션 (AI가 자동 생성)

**스크린샷 위치**: 스케줄 생성 폼 → 필드 매핑 섹션 다음

```tsx
// 온톨로지 변환 옵션 UI
<div className="온톨로지-자동-변환-섹션">
  <input type="checkbox" checked={convertToOntology} />
  
  {convertToOntology && (
    <Select value={selectedOntologyEntityType}>
      <SelectItem value="">자동 감지</SelectItem>
      {entityTypes.map(et => (
        <SelectItem value={et.id}>{et.label}</SelectItem>
      ))}
    </Select>
  )}
</div>
```

## 기술 아키텍처

### 데이터 플로우

```
┌─────────────┐
│  API 연동   │
│  또는 CSV   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ sync-api-data 또는  │
│ integrated-pipeline │
└──────┬──────────────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌──────────────┐       ┌────────────────────┐
│ 일반 테이블  │       │ convert_to_ontology│
│  저장        │       │  옵션 확인         │
└──────────────┘       └─────────┬──────────┘
                                 │
                                 ▼
                       ┌──────────────────────┐
                       │ user_data_imports    │
                       │  레코드 생성         │
                       └─────────┬────────────┘
                                 │
                                 ▼
                       ┌──────────────────────┐
                       │ smart-ontology-      │
                       │  mapping (AI)        │
                       └─────────┬────────────┘
                                 │
                                 ▼
                       ┌──────────────────────┐
                       │  schema-etl          │
                       │  (엔티티/관계 생성)   │
                       └─────────┬────────────┘
                                 │
                                 ▼
                       ┌──────────────────────┐
                       │ graph_entities       │
                       │ graph_relations      │
                       └──────────────────────┘
```

## 사용 방법

### API 연동 데이터 → 온톨로지 변환

1. **API 연동 페이지** (`/data-management/api`) 접속
2. **스케줄 생성 탭** 선택
3. 스케줄 정보 입력:
   - 스케줄 이름
   - API 연결 선택
   - 대상 테이블
   - Cron 표현식
4. **"API 응답 미리보기 & 필드 매핑"** 버튼 클릭
5. 필드 매핑 설정
6. **"온톨로지 자동 변환"** 체크박스 활성화 ✅
7. (선택사항) 엔티티 타입 선택 또는 자동 감지
8. **"스케줄 추가"** 버튼 클릭

### CSV 업로드 → 온톨로지 변환

1. **통합 데이터 관리 페이지** (`/data-management/import`) 접속
2. **통합 업로드 탭** 선택
3. CSV 파일 업로드
4. 자동으로 온톨로지 변환 파이프라인 실행

## 데이터베이스 테이블

### 주요 테이블
- `graph_entities`: 온톨로지 엔티티 저장
- `graph_relations`: 온톨로지 관계 저장
- `ontology_entity_types`: 엔티티 타입 정의
- `ontology_relation_types`: 관계 타입 정의
- `user_data_imports`: 임포트 이력 및 원본 데이터
- `data_sync_schedules`: API 동기화 스케줄
- `data_sync_logs`: 동기화 실행 로그

### sync_config 스키마 확장

```typescript
interface SyncConfig {
  target_table: string;
  field_mapping: Record<string, string>;
  data_path?: string;
  store_id?: string;
  convert_to_ontology: boolean;  // ✅ 새로 추가
  ontology_entity_type?: string; // ✅ 새로 추가 (선택적)
}
```

## Edge Functions

### 수정된 함수
1. **`sync-api-data`**: 온톨로지 변환 로직 추가
   - `convert_to_ontology` 플래그 처리
   - `user_data_imports` 레코드 생성
   - `integrated-data-pipeline` 호출

### 재사용 함수
2. **`integrated-data-pipeline`**: CSV와 API 데이터 모두 처리
3. **`smart-ontology-mapping`**: AI 기반 자동 매핑
4. **`schema-etl`**: 엔티티/관계 생성
5. **`validate-and-fix-csv`**: 데이터 검증 및 수정

## AI 활용

### 온톨로지 자동 매핑 (AI)
- **모델**: `google/gemini-2.5-pro`
- **기능**:
  - 데이터 구조 분석
  - 엔티티 타입 추론
  - 관계 타입 감지
  - 필드 매핑 자동 생성
  - ID 컬럼 및 외래 키 식별

### 매핑 캐시
- 동일한 데이터 타입에 대한 매핑 재사용
- 신뢰도 점수 기반 캐싱
- 사용 횟수 추적

## 성능 최적화

1. **배치 처리**: 엔티티 1000개씩 일괄 삽입
2. **매핑 캐시**: 반복되는 데이터 타입 빠른 처리
3. **백그라운드 처리**: 대용량 데이터(100개 이상) 비동기 처리
4. **진행상황 추적**: 실시간 진행률 업데이트

## 통합 효과

### 데이터 사일로 제거
✅ API 데이터 → 온톨로지  
✅ CSV 데이터 → 온톨로지  
✅ 실시간 데이터 동기화

### AI 분석 강화
- 지식 그래프 기반 추론
- 엔티티 간 관계 분석
- 다차원 데이터 연결
- 고급 추천 알고리즘

### 데이터 통합
- 모든 데이터 소스 단일 온톨로지로 통합
- 일관된 데이터 구조
- 자동화된 데이터 변환

## 다음 단계 (Phase 2)

### Phase 2: 실시간 동기화
- [ ] 데이터베이스 트리거 구현
- [ ] 실시간 엔티티 생성
- [ ] 관계 자동 추론
- [ ] 변경 이력 추적

### Phase 3: AI 추론 엔진
- [ ] 온톨로지 기반 추천
- [ ] 이상 탐지
- [ ] 패턴 분석
- [ ] 예측 모델링

## 참고 문서
- [온톨로지 스키마 구조](./CURRENT_ONTOLOGY_SCHEMA.md)
- [데이터 관리 가이드](./DATA_MANAGEMENT_GUIDE.md)
- [API 동기화 설정](./API_SYNC_CRON_SETUP.md)
- [통합 아키텍처](./INTEGRATED_ARCHITECTURE_GUIDE.md)
