# 미사용 코드 분석 보고서

**분석일**: 2025-12-16
**분석 기준**: 현재 App.tsx 라우팅 기준 (4개 메인 페이지)

---

## 현재 사용 중인 페이지 구조

```
App.tsx 라우팅:
├── /auth        → AuthPage (core/pages)
├── /insights    → InsightHubPage (features/insights)
├── /studio      → DigitalTwinStudioPage (features/studio)
├── /roi         → ROIMeasurementPage (features/roi)
├── /settings    → SettingsPage (features/settings)
└── /*           → NotFoundPage (core/pages)

+ OnboardingWizard (features/onboarding) - 팝업으로 사용
```

---

## 1. 삭제 가능한 폴더/모듈 (완전 미사용)

### 1.1 `src/features/overview/` - 전체 삭제 가능

| 파일 | 크기 | 사유 |
|------|------|------|
| `components/GuidelineForm.tsx` | 7.3KB | App.tsx에서 미참조 |
| `components/GuidelineList.tsx` | 3.6KB | App.tsx에서 미참조 |
| `components/NotificationPanel.tsx` | 3.8KB | App.tsx에서 미참조 |
| `components/StoreForm.tsx` | 6.4KB | App.tsx에서 미참조 |
| `components/UnifiedMessageThread.tsx` | 9.2KB | App.tsx에서 미참조 |
| `components/index.ts` | 0.3KB | - |
| `index.ts` | 0.03KB | - |

**총 크기**: ~30.6KB
**삭제 가능**: YES (전체 폴더)

---

### 1.2 `src/core/pages/` 내 미사용 파일

| 파일 | 크기 | 사유 |
|------|------|------|
| `DashboardPage.tsx` | 22.8KB | App.tsx에서 미참조, features/insights로 대체됨 |
| `SettingsPage.tsx` | 39.7KB | App.tsx에서 미참조, features/settings로 대체됨 |

**총 크기**: ~62.5KB
**삭제 가능**: YES

**참고**: `AuthPage.tsx`, `NotFoundPage.tsx`, `index.ts`는 사용 중

---

## 2. 삭제 가능한 Hooks

### 2.1 `src/hooks/` 내 미사용 훅

| 파일 | 크기 | 사유 |
|------|------|------|
| `useHQCommunication.ts` | - | features/overview에서만 사용 (overview 삭제 시 같이 삭제) |
| `usePurchasePatterns.ts` | - | index.ts에서만 export, 실제 사용처 없음 |
| `useRealSampleData.ts` | - | usePurchasePatterns에서만 사용 |
| `useRetailData.ts` | - | index.ts에서만 export, 실제 사용처 없음 |

**삭제 조건**: features/overview 삭제 후 같이 삭제

---

## 3. 삭제 가능한 Components

### 3.1 `src/components/` 내 미사용 컴포넌트

| 파일 | 크기 | 사유 |
|------|------|------|
| `StatCard.tsx` | - | core/pages/DashboardPage에서만 사용 |
| `DataReadinessGuard.tsx` | - | core/pages/DashboardPage에서만 사용 |
| `LockedFeature.tsx` | - | 어디서도 사용되지 않음 |
| `RoleGuard.tsx` | - | 어디서도 사용되지 않음 |

### 3.2 `src/components/dashboard/` 내 미사용 컴포넌트

| 파일 | 크기 | 사유 |
|------|------|------|
| `AIRecommendationCard.tsx` | - | core/pages/DashboardPage에서만 사용 |
| `DashboardFilters.tsx` | - | core/pages/DashboardPage에서만 사용 |
| `FunnelVisualization.tsx` | - | core/pages/DashboardPage에서만 사용 |

**참고**: `AIRecommendationEffectWidget.tsx`는 features/insights에서 사용 중 (유지)

---

## 4. 삭제 검토 필요한 파일 (features/simulation/)

### 4.1 `src/features/simulation/views/`

| 파일 | 크기 | 사유 |
|------|------|------|
| `SimulationPage.tsx` | 8.4KB | App.tsx에서 직접 라우팅 없음, 독립 페이지로 미사용 |

### 4.2 `src/features/simulation/components/` 내 미사용 컴포넌트

**index.ts에서만 export되고 실제 import되지 않는 컴포넌트:**

| 파일 | 크기 | 사유 |
|------|------|------|
| `SimulationControls.tsx` | 8.2KB | SimulationPage에서만 사용 |
| `SimulationHistoryPanel.tsx` | 14.4KB | index.ts에서만 export |
| `SimulationMetrics.tsx` | 9.8KB | index.ts에서만 export |
| `SimulationResultCard.tsx` | 10.3KB | index.ts에서만 export |
| `SimulationScene.tsx` | 6.2KB | index.ts에서만 export |
| `LayoutComparisonView.tsx` | 23.9KB | index.ts에서만 export |
| `DataSourceMappingCard.tsx` | 19.6KB | index.ts에서만 export |
| `AIModelSelector.tsx` | 16.8KB | index.ts에서만 export |
| `IntegratedDataAnalysis.tsx` | 57KB | index.ts에서만 export |
| `OntologyInsightChart.tsx` | 16.4KB | index.ts에서만 export |
| `ROIResultCard.tsx` | 16.4KB | index.ts에서만 export |
| `DemandForecastResult.tsx` | 10.8KB | index.ts에서만 export |
| `InventoryOptimizationResult.tsx` | 9.5KB | index.ts에서만 export |
| `PricingOptimizationResult.tsx` | 10.3KB | index.ts에서만 export |
| `RecommendationStrategyResult.tsx` | 10.4KB | index.ts에서만 export |

**주의**: simulation 폴더 내 hooks와 utils는 features/studio에서 사용 중이므로 유지 필요

---

## 5. 중복 코드 분석

### 5.1 SettingsPage 중복

| 위치 | 크기 | 상태 |
|------|------|------|
| `src/core/pages/SettingsPage.tsx` | 39.7KB | 미사용 (삭제 가능) |
| `src/features/settings/SettingsPage.tsx` | 40.2KB | 사용 중 |

**분석**: 두 파일이 유사한 기능을 하지만 features/ 버전이 실제 사용됨

### 5.2 buildRetailOntologyGraph 중복

| 위치 | 크기 |
|------|------|
| `src/features/data-management/ontology/components/buildRetailOntologyGraph.ts` | 6.1KB |
| `src/features/data-management/ontology/utils/buildRetailOntologyGraph.ts` | 4.6KB |

**분석**: 동일한 기능의 파일이 components와 utils에 중복 존재

---

## 6. 삭제 우선순위 및 영향도

### 우선순위 1 (안전하게 삭제 가능) 🟢

```
src/features/overview/              # 전체 폴더
src/core/pages/DashboardPage.tsx
src/core/pages/SettingsPage.tsx
src/components/LockedFeature.tsx
src/components/RoleGuard.tsx
```

**예상 절감**: ~95KB

### 우선순위 2 (의존성 확인 후 삭제) 🟡

```
src/hooks/useHQCommunication.ts     # overview 삭제 후
src/hooks/usePurchasePatterns.ts
src/hooks/useRealSampleData.ts
src/hooks/useRetailData.ts
src/components/StatCard.tsx          # DashboardPage 삭제 후
src/components/DataReadinessGuard.tsx
src/components/dashboard/AIRecommendationCard.tsx
src/components/dashboard/DashboardFilters.tsx
src/components/dashboard/FunnelVisualization.tsx
```

**예상 절감**: ~30KB

### 우선순위 3 (신중한 검토 필요) 🔴

```
src/features/simulation/views/SimulationPage.tsx
src/features/simulation/components/ 내 다수 컴포넌트
```

**주의**: simulation 폴더의 hooks, utils, types는 studio에서 의존하므로 유지 필요

---

## 7. 권장 삭제 목록 요약

### 즉시 삭제 가능 (총 ~95KB)

```bash
# 폴더 삭제
rm -rf src/features/overview/

# 파일 삭제
rm src/core/pages/DashboardPage.tsx
rm src/core/pages/SettingsPage.tsx
rm src/components/LockedFeature.tsx
rm src/components/RoleGuard.tsx
```

### 이후 삭제 검토 (총 ~200KB)

```bash
# Hooks (overview 삭제 후)
rm src/hooks/useHQCommunication.ts
rm src/hooks/usePurchasePatterns.ts
rm src/hooks/useRealSampleData.ts
rm src/hooks/useRetailData.ts

# Components (DashboardPage 삭제 후)
rm src/components/StatCard.tsx
rm src/components/DataReadinessGuard.tsx
rm src/components/dashboard/AIRecommendationCard.tsx
rm src/components/dashboard/DashboardFilters.tsx
rm src/components/dashboard/FunnelVisualization.tsx

# Simulation 미사용 컴포넌트 (선택적)
rm src/features/simulation/views/SimulationPage.tsx
# 기타 simulation/components 내 미사용 파일들...
```

---

## 8. 삭제 전 체크리스트

- [ ] 백업 생성
- [ ] 각 파일의 import 체인 최종 확인
- [ ] TypeScript 빌드 테스트 (`npm run build`)
- [ ] 런타임 테스트
- [ ] index.ts 파일에서 export 제거

---

## 9. 유지해야 할 파일 (삭제 금지)

### features/simulation/ 내 필수 파일

```
hooks/useStoreContext.ts        # studio에서 사용
hooks/useEnhancedAIInference.ts # studio에서 사용
utils/bakedMaterialUtils.ts     # studio에서 사용
utils/coordinateMapper.ts       # hooks에서 사용
utils/modelLayerLoader.ts       # studio에서 사용
utils/modelStorageManager.ts    # studio에서 사용
utils/modelFilenameParser.ts    # studio에서 사용
utils/sceneRecipeGenerator.ts   # studio에서 사용
types/iot.types.ts              # hooks에서 사용
types/avatar.types.ts           # types/index.ts에서 사용
types/overlay.types.ts          # types/index.ts에서 사용
components/digital-twin/        # data-management에서 사용
```

---

**문서 끝**
