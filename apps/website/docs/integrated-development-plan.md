# NEURALTWIN 통합 개발 계획

## 프로젝트 개요

NEURALTWIN은 라이선스 기반 구독 모델을 사용하는 3개의 병렬 프로젝트로 구성됩니다:
1. **웹사이트** - 고객 대상 회원가입 및 온보딩
2. **고객 대시보드** - 조직 관리 및 운영 (ORG_HQ, ORG_STORE, ORG_VIEWER)
3. **관리자 대시보드** - 시스템 전체 관리 및 모니터링 (NEURALTWIN_MASTER)

---

## 1. 웹사이트 (Customer-Facing Website)

### 목적
- 고객 획득 및 초기 온보딩
- 구독 상품 소개 및 판매
- 회원가입 및 초기 조직 생성

### 주요 기능

#### 1.1 랜딩 페이지
- 제품 소개 및 주요 기능 설명
- 가격 정책 (HQ License $500/월, Store License $250/월, Viewer 무료)
- 고객 후기 및 사례 연구
- CTA (Call-to-Action) 버튼

#### 1.2 회원가입 플로우
```
1. 이메일 입력 → 인증
2. 역할 선택 (Admin/Manager/Analyst/Viewer)
   - Admin → ORG_HQ
   - Manager → ORG_STORE
   - Analyst/Viewer → ORG_VIEWER
3. 조직 정보 입력
4. 결제 정보 입력 (HQ/Store 선택 시)
5. 초기 라이선스 구매
6. 계정 생성 완료
```

#### 1.3 결제 시스템
- Stripe 연동
- 라이선스 단위 구매
- 자동 청구 및 갱신
- 영수증 발급

#### 1.4 초대 시스템
- Viewer 초대 링크 생성
- 이메일 발송
- 토큰 기반 회원가입 (7일 유효)

### 기술 스택
- React + TypeScript
- Tailwind CSS
- React Router
- Supabase Auth
- Stripe Payment Integration

### 개발 우선순위
1. **Phase 1**: 랜딩 페이지 + 기본 회원가입
2. **Phase 2**: 결제 시스템 연동
3. **Phase 3**: 초대 시스템
4. **Phase 4**: 마케팅 페이지 완성

---

## 2. 고객 대시보드 (Customer Dashboard)

### 목적
- 조직 내부 데이터 관리 및 분석
- 매장, 제품, 재고 등 운영 데이터 관리
- 역할별 접근 제어

### 역할별 권한

#### 2.1 ORG_HQ (조직 본부 관리자)
- **조직 관리**
  - 조직 정보 수정
  - 멤버 초대 및 관리
  - 라이선스 추가 구매
  - 구독 관리
- **전사 데이터 접근**
  - 모든 매장 데이터 조회
  - 통합 대시보드 및 분석
  - 시나리오 시뮬레이션
- **권한 관리**
  - 멤버 역할 변경
  - Store 라이선스 할당

#### 2.2 ORG_STORE (매장 관리자)
- **매장 데이터 관리**
  - 할당된 매장 데이터만 접근
  - 제품, 재고 관리
  - 방문자 데이터 분석
- **제한된 분석 기능**
  - 매장별 대시보드
  - 매장 KPI 모니터링

#### 2.3 ORG_VIEWER (읽기 전용)
- **읽기 전용 접근**
  - 할당된 데이터 조회만 가능
  - 대시보드 보기
  - 보고서 다운로드

### 주요 기능 모듈

#### 2.4 대시보드
- 실시간 KPI 모니터링
- 매출, 방문자, 전환율 등
- 역할별 맞춤 위젯

#### 2.5 매장 관리
- 매장 등록 및 정보 수정
- 매장 코드 관리
- 라이선스 할당

#### 2.6 제품 및 재고 관리
- 제품 카탈로그
- 재고 수준 모니터링
- 자동 발주 제안

#### 2.7 분석 및 시뮬레이션
- 고객 행동 분석
- 매장 시뮬레이션
- 예측 분석

#### 2.8 데이터 연동
- ETL 파이프라인 설정
- 외부 데이터 소스 연결
- 스케줄링된 동기화

#### 2.9 설정
- 프로필 관리
- 알림 설정
- 멤버 관리 (ORG_HQ만)

### 기술 스택
- React + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query (React Query)
- Recharts (데이터 시각화)
- Supabase Client SDK

### 개발 우선순위
1. **Phase 1**: 인증 + 역할별 라우팅 + 기본 대시보드
2. **Phase 2**: 매장 관리 + 제품/재고 CRUD
3. **Phase 3**: 분석 대시보드 + KPI 위젯
4. **Phase 4**: 시뮬레이션 + 데이터 연동

---

## 3. 관리자 대시보드 (Admin Dashboard)

### 목적
- 전체 시스템 모니터링 및 관리
- 조직 및 구독 관리
- 시스템 설정 및 운영

### 접근 권한
- **NEURALTWIN_MASTER 전용**
- 수동으로만 할당 가능
- 고객은 접근 불가

### 주요 기능 모듈

#### 3.1 대시보드 (현재 구현됨)
- 전체 조직 수
- 활성 사용자 수
- 월별 매출
- 파이프라인 작업 현황
- 최근 조직 목록
- 시스템 알림

#### 3.2 조직 관리 (Organizations)
- **조직 목록**
  - 전체 조직 조회
  - 검색 및 필터링
  - 멤버 수, 구독 상태 표시
- **조직 상세**
  - 조직 정보 수정
  - 멤버 목록 및 역할 관리
  - 매장 목록
  - 구독 내역
  - 라이선스 할당 현황

#### 3.3 구독 관리 (Subscriptions)
- **구독 목록**
  - 전체 구독 조회
  - 상태별 필터링 (active, cancelled, expired)
  - 라이선스 수 및 월 비용 표시
- **구독 상세**
  - 라이선스 내역
  - 청구 내역
  - 구독 상태 변경 (활성화/비활성화)

#### 3.4 온톨로지 스키마 (Schemas)
- 마스터 스키마 관리
- 엔티티 타입 정의
- 관계 타입 정의
- 버전 관리

#### 3.5 ETL 파이프라인 (Pipelines)
- 파이프라인 목록 및 상태
- 파이프라인 생성 및 수정
- 실행 로그 조회
- 스케줄 관리

#### 3.6 시뮬레이션 (Simulations)
- 전체 시뮬레이션 조회
- 시뮬레이션 결과 분석
- 성능 모니터링

#### 3.7 분석 (Analytics)
- 시스템 전체 통계
- 조직별 사용 현황
- 매출 분석
- 성능 지표

### 기술 스택
- React + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- Recharts
- Lucide React Icons
- Supabase Client SDK

### 개발 우선순위
1. **Phase 1**: 조직 관리 페이지 (Organizations)
2. **Phase 2**: 구독 관리 페이지 (Subscriptions)
3. **Phase 3**: 온톨로지 스키마 페이지 (Schemas)
4. **Phase 4**: ETL 파이프라인 페이지 (Pipelines)
5. **Phase 5**: 시뮬레이션 페이지 (Simulations)
6. **Phase 6**: 분석 페이지 (Analytics)

---

## 공통 아키텍처

### 인증 및 권한

#### 인증 플로우
```
1. Supabase Auth를 통한 이메일/비밀번호 인증
2. JWT 토큰 발급
3. organization_members 테이블에서 역할 조회
4. 역할 기반 라우팅 및 UI 렌더링
```

#### 권한 검증
- **클라이언트**: 역할 기반 라우팅, UI 숨김
- **서버**: RLS 정책으로 데이터 접근 제어
- **함수**: is_org_member(), is_org_admin(), is_neuraltwin_admin()

### 데이터베이스 스키마

#### 핵심 테이블
- `organizations`: 조직 정보
- `organization_members`: 조직-사용자-역할 매핑
- `subscriptions`: 구독 정보 (라이선스 집계)
- `licenses`: 개별 라이선스 (HQ_SEAT, STORE)
- `invitations`: 초대 토큰
- `stores`: 매장 정보
- `products`: 제품 정보
- ... (기타 도메인 테이블)

#### RLS 정책
- 각 테이블에 user_id 및 org_id 기반 정책
- NEURALTWIN_MASTER는 모든 데이터 접근 가능
- ORG_HQ는 조직 내 모든 데이터 접근
- ORG_STORE는 할당된 매장 데이터만 접근
- ORG_VIEWER는 읽기 전용 접근

### 상태 관리
- TanStack Query (React Query) 사용
- Supabase Realtime 구독 (선택적)
- 낙관적 업데이트

### UI/UX 일관성
- shadcn/ui 컴포넌트 라이브러리
- Tailwind CSS 디자인 시스템 (index.css, tailwind.config.ts)
- 일관된 색상, 타이포그래피, 간격

---

## 개발 일정

### Month 1: 기반 구축
- Week 1-2: 데이터베이스 마이그레이션 완료 (✅ 완료)
- Week 3: 관리자 대시보드 기본 구조 (✅ 완료)
- Week 4: 웹사이트 랜딩 페이지 및 회원가입 UI

### Month 2: 핵심 기능 개발
- Week 1-2: 관리자 대시보드 조직 관리 + 구독 관리
- Week 3-4: 웹사이트 결제 연동 + 초대 시스템

### Month 3: 고객 대시보드 개발
- Week 1-2: 인증 + 역할 라우팅 + 기본 대시보드
- Week 3-4: 매장 관리 + 제품/재고 CRUD

### Month 4: 고급 기능 및 분석
- Week 1-2: 고객 대시보드 분석 기능
- Week 3-4: 관리자 대시보드 ETL 파이프라인 + 시뮬레이션

### Month 5: 테스트 및 최적화
- Week 1-2: 통합 테스트 및 버그 수정
- Week 3-4: 성능 최적화 및 UX 개선

### Month 6: 배포 준비
- Week 1-2: 문서화 및 사용자 가이드
- Week 3-4: 프로덕션 배포 및 모니터링

---

## 배포 전략

### 환경 분리
- **Development**: 로컬 개발 환경
- **Staging**: 테스트 및 QA 환경
- **Production**: 프로덕션 환경

### CI/CD
- GitHub Actions
- 자동 테스트 실행
- Vercel/Netlify 배포

### 모니터링
- Supabase Analytics
- Sentry (에러 추적)
- Google Analytics (사용자 행동)

---

## 보안 고려사항

### 인증
- Supabase Auth 사용
- JWT 토큰 기반 인증
- 세션 관리

### 권한
- RLS 정책으로 데이터 보호
- 역할 기반 접근 제어
- 클라이언트 + 서버 이중 검증

### 데이터 보호
- HTTPS 강제
- 민감 정보 암호화
- 정기적인 백업

### 라이선스 무결성
- CHECK 제약으로 역할-라이선스 매핑 강제
- 트리거로 라이선스 카운트 자동 업데이트
- has_valid_license() 함수로 검증

---

## 성공 지표 (KPI)

### 비즈니스 지표
- 월 활성 사용자 수 (MAU)
- 구독 전환율
- 월 반복 매출 (MRR)
- 고객 이탈률 (Churn Rate)
- 평균 고객 생애 가치 (LTV)

### 기술 지표
- 페이지 로드 시간
- API 응답 시간
- 에러율
- 가동 시간 (Uptime)

---

## 다음 단계

현재 상태:
- ✅ 데이터베이스 스키마 완성
- ✅ 관리자 대시보드 기본 구조 완성

즉시 착수 가능:
1. **관리자 대시보드 - 조직 관리 페이지 (Organizations)**
2. **관리자 대시보드 - 구독 관리 페이지 (Subscriptions)**
3. **웹사이트 - 랜딩 페이지 + 회원가입 플로우**

---

## 참고 문서

- [Supabase 공식 문서](https://supabase.com/docs)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query)
- [Stripe 결제 연동](https://stripe.com/docs)

---

## 연락처

프로젝트 관련 문의: neuraltwin.hq@neuraltwin.io
