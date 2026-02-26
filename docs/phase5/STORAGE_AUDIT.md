# Storage Bucket Audit Report

> 조회 시각: 2026-02-26 05:40 UTC
> 프로젝트: bdrvowacecxnraaivlhr

---

## 1. 버킷 설정 현황

| 버킷명 | Public | 파일 크기 제한 | 허용 MIME 타입 | 생성일 |
|--------|--------|--------------|---------------|--------|
| 3d-models | Yes | 없음 | 제한 없음 | 2025-11-25 |
| avatars | Yes | 없음 | 제한 없음 | 2025-12-04 |
| chat-attachments | Yes | 없음 | 제한 없음 | 2026-02-10 |
| store-data | **No** | 없음 | 제한 없음 | 2025-11-25 |
| user-imports | **No** | 50MB | csv, excel, json, tsv, glb, octet-stream | 2026-01-16 |

## 2. 버킷별 용량 통계

| 버킷명 | 파일 수 | 총 용량 | 가장 오래된 파일 | 가장 최근 파일 |
|--------|--------|---------|----------------|---------------|
| 3d-models | 307 | 119.9 MB | 2025-12-05 | 2026-02-23 |
| user-imports | 5 | 3.3 KB | 2026-01-19 | 2026-01-19 |
| avatars | 0 | 0 | - | - |
| chat-attachments | 0 | 0 | - | - |
| store-data | 0 | 0 | - | - |
| **합계** | **312** | **~119.9 MB** | | |

## 3. 3d-models 상세 분석 (307 파일, 119.9 MB)

### 3.1 Products (120 파일, 73.2 MB)

| 카테고리 | 파일 수 | 용량 | 비율 |
|---------|--------|------|------|
| outwear | 20 | 36.9 MB | 50.4% |
| bottoms | 32 | 16.0 MB | 21.8% |
| tops | 40 | 12.3 MB | 16.7% |
| accessories | 10 | 4.7 MB | 6.4% |
| shoes | 12 | 2.2 MB | 3.1% |
| giftbox | 2 | 616 KB | 0.8% |
| cosmetics | 4 | 498 KB | 0.7% |

### 3.2 비상품 에셋 (187 파일, 46.7 MB)

| 카테고리 | 파일 수 | 용량 | 비고 |
|---------|--------|------|------|
| store 렌더링 (PNG) | 4 | 19.8 MB | day/night 이미지 각 2장 (중복?) |
| furniture | 136 | 12.2 MB | 매장 가구 GLB |
| customers | 24 | 6.5 MB | 고객 아바타 GLB |
| staff | 16 | 4.2 MB | 직원 아바타 GLB |
| environment (baked) | 4 | 3.6 MB | 조명 baked 환경 GLB |
| space | 2 | 496 KB | 매장 공간 GLB |
| (빈 파일) | 1 | 0 | 빈 placeholder |

## 4. user-imports 상세 분석 (5 파일, 3.3 KB)

| 파일명 | 크기 | 업로드 시각 | 비고 |
|--------|------|-----------|------|
| products_template_ko.csv | 271 B | 2026-01-19 08:43 | 템플릿 파일 |
| products.csv (1768796674209) | 766 B | 2026-01-19 04:24 | **중복 #4** |
| products.csv (1768796570257) | 766 B | 2026-01-19 04:22 | **중복 #3** |
| products.csv (1768796539371) | 766 B | 2026-01-19 04:22 | **중복 #2** |
| products.csv (1768796214559) | 766 B | 2026-01-19 04:16 | 원본 |

### Upload Sessions 현황

| 상태 | 건수 |
|------|------|
| parsed | 3 |
| validated | 2 |
| **합계** | **5** |

모든 파일이 upload_sessions에 매칭됨 — 고아 파일 없음.

## 5. 빈 버킷 분석

| 버킷명 | 상태 | 분석 |
|--------|------|------|
| avatars | 파일 0개 | 프로필 이미지 기능 미사용 또는 미구현 |
| chat-attachments | 파일 0개 | 채팅 첨부 기능 미사용 또는 미구현 |
| store-data | 파일 0개 | 매장 데이터 저장 기능 미사용 |

## 6. 고아 파일 식별

### 6.1 user-imports → upload_sessions

| 결과 | 설명 |
|------|------|
| 고아 파일 0건 | 5개 파일 모두 upload_sessions에 매칭 |

### 6.2 chat-attachments → 대화 참조

해당 없음 (버킷 비어 있음)

### 6.3 avatars → 프로필 참조

해당 없음 (버킷 비어 있음)

### 6.4 user-imports 중복 파일

- `products.csv` 동일 파일이 **4건 중복** (766B × 4 = 3,064B)
- 약 5분간 반복 업로드 — 테스트 또는 업로드 재시도로 추정
- **정리 가능 용량**: ~2.3 KB (3건 삭제 가능)

### 6.5 3d-models 잠재적 중복

- store 렌더링 PNG 파일이 2쌍(day/night) 각 2장씩 존재
- 동일 org/store 경로 내 중복 가능성 — 확인 필요
- **잠재 정리 가능 용량**: ~19.8 MB (중복 확인 시)

## 7. 보안 점검

| # | 이슈 | 심각도 | 설명 |
|---|------|--------|------|
| 1 | 3d-models public 노출 | Low | GLB 파일 public — 의도된 설정 (Three.js 로딩용) |
| 2 | avatars public + 제한 없음 | **Medium** | 파일 크기/MIME 제한 없이 public — 악용 가능 |
| 3 | chat-attachments public + 제한 없음 | **Medium** | 파일 크기/MIME 제한 없이 public — 악용 가능 |
| 4 | store-data 제한 없음 | Low | private이지만 파일 크기/MIME 제한 없음 |

## 8. 분석 요약 및 권장 조치

### 핵심 지표

| 항목 | 값 |
|------|-----|
| 총 버킷 수 | 5 |
| 활성 버킷 | 2 (3d-models, user-imports) |
| 빈 버킷 | 3 (avatars, chat-attachments, store-data) |
| 총 파일 수 | 312 |
| 총 사용 용량 | ~119.9 MB |
| 중복/정리 가능 | ~19.8 MB (최대 16.5%) |

### 권장 조치

| # | 조치 | 우선순위 | 예상 효과 |
|---|------|---------|----------|
| 1 | `avatars` 버킷에 file_size_limit (5MB) + 이미지 MIME 제한 추가 | **High** | 악용 방지 |
| 2 | `chat-attachments` 버킷에 file_size_limit (10MB) + MIME 제한 추가 | **High** | 악용 방지 |
| 3 | user-imports 중복 products.csv 3건 삭제 | Low | 2.3 KB 회수 |
| 4 | 3d-models store 렌더링 PNG 중복 확인 후 정리 | Medium | ~19.8 MB 회수 가능 |
| 5 | 빈 버킷 3개(avatars, chat-attachments, store-data) 사용 계획 확인 — 미사용 시 삭제 검토 | Low | 관리 간소화 |
| 6 | store-data에 file_size_limit + MIME 제한 추가 | Medium | 보안 강화 |
