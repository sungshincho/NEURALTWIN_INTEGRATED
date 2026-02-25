# 📊 통합 데이터 관리 시스템 가이드

## 개요

NEURALTWIN 프로젝트의 데이터 흐름을 최적화하기 위한 중앙 집중식 데이터 관리 시스템입니다.

## 🎯 주요 기능

### 1. 타입 안전성
- TypeScript 타입 완벽 지원
- 데이터 파일별 전용 타입 (`CustomerData`, `ProductData` 등)
- IDE 자동완성 및 타입 체크

### 2. React Query 기반 캐싱
- 5분간 자동 캐싱 (staleTime)
- 중복 요청 방지
- 백그라운드 자동 갱신

### 3. Storage 경로 관리
- 일관된 경로 구조 (`{userId}/{storeId}/{fileName}`)
- 자동 경로 생성 및 검증
- 안전한 파일명 sanitization

### 4. 자동 Fallback
- Storage에 파일 없을 시 `public/samples` 자동 사용
- 데모/테스트 환경 지원

## 📁 구조

```
src/
├── lib/storage/          # 핵심 라이브러리
│   ├── types.ts          # 타입 정의
│   ├── paths.ts          # 경로 관리
│   ├── parser.ts         # 파일 파싱
│   ├── loader.ts         # 파일 로더
│   └── index.ts          # Export
└── hooks/
    └── useStoreData.ts   # React Hooks
```

## 🚀 사용 방법

### 1. 전체 데이터셋 로드

```tsx
import { useStoreDataset } from '@/hooks/useStoreData';

function MyComponent() {
  const { data, isLoading, error } = useStoreDataset();
  
  if (isLoading) return <Loader />;
  if (error) return <Error />;
  
  const customers = data?.customers || [];
  const products = data?.products || [];
  
  return <div>...</div>;
}
```

### 2. 단일 파일 로드 (타입 안전)

```tsx
import { useVisits, useProducts } from '@/hooks/useStoreData';

function AnalysisPage() {
  // 자동으로 VisitData[] 타입 추론
  const { data: visitsResult } = useVisits();
  const visits = visitsResult?.data || [];
  
  // 자동으로 ProductData[] 타입 추론
  const { data: productsResult } = useProducts();
  const products = productsResult?.data || [];
  
  return <Chart data={visits} />;
}
```

### 3. 여러 파일 동시 로드

```tsx
import { useMultipleStoreDataFiles } from '@/hooks/useStoreData';

function FunnelPage() {
  const dataQueries = useMultipleStoreDataFiles(['visits', 'purchases']);
  const [visitsQuery, purchasesQuery] = dataQueries;
  
  const visits = visitsQuery.data?.data || [];
  const purchases = purchasesQuery.data?.data || [];
  const loading = visitsQuery.isLoading || purchasesQuery.isLoading;
  
  return <Funnel visits={visits} purchases={purchases} />;
}
```

### 4. 저수준 API 직접 사용

```tsx
import { loadDataFile } from '@/lib/storage/loader';

async function loadCustomData() {
  const result = await loadDataFile(
    userId,
    storeId,
    'customers',
    { fallbackToSample: true }
  );
  
  console.log('Data source:', result.source); // 'storage' | 'sample'
  console.log('Data:', result.data);
}
```

## 📝 타입 정의

### 주요 데이터 타입

```typescript
// 고객 데이터
interface CustomerData {
  customer_id: string;
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
}

// 상품 데이터
interface ProductData {
  product_id: string;
  name?: string;
  category?: string;
  price?: number;
  sku?: string;
}

// 방문 데이터
interface VisitData {
  visit_id: string;
  customer_id?: string;
  entry_time?: string;
  exit_time?: string;
  zone?: string;
}

// WiFi 트래킹
interface WiFiTrackingData {
  mac_address: string;
  sensor_id: string;
  timestamp: string;
  rssi?: number;
  x?: number;
  z?: number;
}
```

## 🔄 마이그레이션 가이드

### Before (기존 코드)

```tsx
import { loadStoreFile } from '@/utils/storageDataLoader';
import { useAuth } from '@/hooks/useAuth';

function OldComponent() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (user && selectedStore) {
      setLoading(true);
      loadStoreFile(user.id, selectedStore.id, 'visits.csv')
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [user, selectedStore]);
  
  return <Chart data={data} />;
}
```

### After (새로운 코드)

```tsx
import { useVisits } from '@/hooks/useStoreData';

function NewComponent() {
  const { data: result, isLoading } = useVisits();
  const data = result?.data || [];
  
  return <Chart data={data} />;
}
```

## ⚡ 성능 최적화

### 1. 자동 캐싱
- 5분간 데이터 캐싱
- 같은 데이터 재요청 시 캐시 사용
- 네트워크 트래픽 최소화

### 2. 병렬 로딩
```tsx
// ❌ 순차 로딩 (느림)
const visits = await loadStoreFile(userId, storeId, 'visits.csv');
const purchases = await loadStoreFile(userId, storeId, 'purchases.csv');

// ✅ 병렬 로딩 (빠름)
const queries = useMultipleStoreDataFiles(['visits', 'purchases']);
```

### 3. 선택적 로딩
```tsx
// 필요한 데이터만 로드
const { data } = useProducts(); // products.csv만
// const { data } = useStoreDataset(); // 모든 파일 (무거움)
```

## 🛠 Storage 경로 유틸리티

```tsx
import { buildStoragePath, sanitizeFileName } from '@/lib/storage/paths';

// 경로 생성
const path = buildStoragePath(userId, storeId, 'data.csv');
// => { bucket: 'store-data', path: 'user123/store456/data.csv' }

// 파일명 정리
const safe = sanitizeFileName('고객 데이터 (2024).csv');
// => '_2024_.csv'
```

## 📊 파일 파싱

```tsx
import { parseCSV, validateData } from '@/lib/storage/parser';

const csvData = parseCSV(csvText);
const isValid = validateData(csvData, ['customer_id', 'name']);
```

## 🔍 디버깅

### 데이터 소스 확인
```tsx
const { data: result } = useVisits();
console.log('Source:', result?.source); // 'storage' | 'sample' | 'cache'
console.log('Loaded at:', new Date(result?.loadedAt || 0));
```

### React Query DevTools
```tsx
// 개발 환경에서 자동 활성화
// 브라우저에서 React Query 상태 확인 가능
```

## 🚨 주의사항

1. **기존 코드 호환성**
   - `loadStoreDataset()`, `loadStoreFile()`은 deprecated
   - 하위 호환성 유지되지만 새 코드에서는 Hook 사용

2. **매장 선택 필수**
   - `useSelectedStore()`로 매장 선택되어야 동작
   - 선택 안 되면 자동으로 `enabled: false`

3. **타입 캐스팅**
   - `any[]` 대신 구체적 타입 사용
   - 타입 추론 활용

## 📚 참고 자료

- React Query: https://tanstack.com/query/latest
- TypeScript: https://www.typescriptlang.org/
- Supabase Storage: https://supabase.com/docs/guides/storage
