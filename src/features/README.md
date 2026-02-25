# Features 폴더 구조

이 폴더는 비즈니스 도메인별로 기능을 구조화한 Feature-based 아키텍처입니다.

## 폴더 구조 원칙

각 feature는 다음과 같은 구조를 따릅니다:

```
feature-name/
├── pages/           # 페이지 컴포넌트
│   ├── index.ts     # 배럴 익스포트
│   └── *.tsx
├── components/      # 해당 feature 전용 컴포넌트
│   ├── index.ts
│   └── *.tsx
├── hooks/           # 커스텀 훅 (필요시)
├── utils/           # 유틸리티 함수 (필요시)
└── types.ts         # 타입 정의 (필요시)
```

## 4개 핵심 도메인

### 1. data-management (데이터 관리)
데이터 수집, 분석, 스키마 관리

- `import/` - 데이터 임포트 및 ETL
- `analysis/` - 분석 툴 및 AI 인사이트  
- `ontology/` - 온톨로지 스키마 및 그래프

### 2. store-analysis (매장 현황)
실시간 매장 운영 현황 모니터링

- `stores/` - 매장 관리 및 본사 동기화
- `footfall/` - 방문자 분석 (트래픽, 퍼널, 동선)
- `inventory/` - 재고 현황

### 3. profit-center (매출 증대)
수익성 향상을 위한 기능들

- `demand-inventory/` - 수요 예측 및 재고 최적화
- `pricing/` - 가격 최적화
- `personalization/` - 고객 개인화 및 추천

### 4. cost-center (비용 절감)
운영 효율화 및 자동화

- `automation/` - 직원 효율성 및 프로세스 자동화

## 사용 예시

### Import 방식

```typescript
// 배럴 익스포트 활용 (권장)
import { 
  DataImportPage 
} from '@/features/data-management/import/pages';

import { 
  AIAnalysisButton,
  AIInsights 
} from '@/features/data-management/analysis/components';

// 직접 import
import { TrafficHeatmap } from '@/features/store-analysis/footfall/components/TrafficHeatmap';
```

### 새 Feature 추가

1. 적절한 도메인 하위에 폴더 생성
2. pages/, components/ 폴더 생성
3. index.ts 파일로 배럴 익스포트 설정
4. 필요시 types.ts, hooks/, utils/ 추가

## 주의사항

### ✅ Do
- 각 feature는 독립적으로 동작해야 함
- 공유 컴포넌트는 `src/shared/`에 배치
- 배럴 익스포트를 통해 import 경로 단순화

### ❌ Don't
- Feature 간 직접 참조 최소화
- 순환 참조 금지
- Feature 내부 구현 외부 노출 금지

## 마이그레이션

기존 코드와의 호환을 위해 `src/pages/`와 `src/components/`에 re-export 파일이 존재합니다.
점진적으로 새 import 경로로 마이그레이션하세요.
