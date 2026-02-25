# NEURALTWIN 마스터 온톨로지 스키마 최종 정의

> **버전**: 2.0
> **작성일**: 2025-12-16
> **기반 마이그레이션**: `001_master_ontology_migration_full.sql`, `004_master_schema_expansion.sql`

---

## 개요

NEURALTWIN 마스터 온톨로지는 리테일 매장의 모든 개념을 표현하는 표준 스키마입니다.

| 구분 | 수량 |
|------|------|
| **마스터 엔티티 타입** | 185개 |
| **마스터 관계 타입** | 110개 |
| **도메인** | 7개 |
| **서브카테고리** | 28개 |

---

## 마스터 vs 커스텀 구분

```
마스터 타입: org_id IS NULL AND user_id IS NULL
커스텀 타입: user_id IS NOT NULL (사용자별) 또는 org_id IS NOT NULL (조직별)
```

---

## 1. 엔티티 타입 (185개)

### DOMAIN 1: PHYSICAL (54개)

물리적 공간, 가구, 인프라, 센서를 정의합니다.

#### 1-1. space (12개)
| Name | Label | Description | Icon | 3D |
|------|-------|-------------|------|-----|
| Store | 매장 | 물리적 리테일 매장 | Store | ✓ |
| Zone | 구역 | 매장 내 기능 영역 | BoxSelect | ✓ |
| SubZone | 세부구역 | 구역 내 세부 영역 | Grid3X3 | ✓ |
| Entrance | 출입구 | 매장 출입구 | DoorOpen | ✓ |
| Exit | 비상구 | 비상 출구 | DoorClosed | ✓ |
| Aisle | 통로 | 고객 이동 통로 | MoveHorizontal | ✓ |
| FittingRoom | 탈의실 | 의류 착용 공간 | Shirt | ✓ |
| CheckoutArea | 계산대 구역 | 결제 구역 | CreditCard | ✓ |
| StorageRoom | 창고 | 재고 보관 공간 | Warehouse | ✓ |
| ServiceArea | 서비스 구역 | 고객 서비스 공간 | HeadphonesIcon | ✓ |
| RestArea | 휴식 공간 | 고객 휴식 공간 | Coffee | ✓ |
| Floor | 층 | 건물 층 | Layers | ✓ |

#### 1-2. furniture (18개)
| Name | Label | Description | Icon | 3D |
|------|-------|-------------|------|-----|
| Shelf | 선반 | 상품 진열 선반 | Layers | ✓ |
| Rack | 행거 | 의류 걸이 랙 | Minimize2 | ✓ |
| DisplayTable | 디스플레이 테이블 | 상품 진열 테이블 | Table | ✓ |
| Gondola | 곤돌라 | 양면 진열대 | LayoutGrid | ✓ |
| EndCap | 엔드캡 | 진열대 끝 매대 | SquareStack | ✓ |
| Showcase | 쇼케이스 | 유리 진열장 | Eye | ✓ |
| Mannequin | 마네킹 | 의류 마네킹 | User | ✓ |
| CheckoutCounter | 계산대 | 결제 카운터 | Calculator | ✓ |
| ServiceDesk | 서비스 데스크 | 고객 서비스 데스크 | Desk | ✓ |
| DigitalSignage | 디지털 사이니지 | 디지털 광고판 | Monitor | ✓ |
| Kiosk | 키오스크 | 셀프 서비스 단말기 | TabletSmartphone | ✓ |
| Mirror | 거울 | 피팅룸 거울 | ScanFace | ✓ |
| **Display** | 디스플레이 | 상품 디스플레이 | Monitor | ✓ |
| **Wall** | 벽면 | 매장 벽면 | Square | ✓ |
| **Window** | 창문 | 매장 창문/쇼윈도 | Maximize2 | ✓ |
| **ClothingRack** | 의류 행거 | 의류 전용 행거 | Shirt | ✓ |
| **WallShelf** | 벽면 선반 | 벽면 부착 선반 | Layers | ✓ |
| **CosmeticsCounter** | 화장품 카운터 | 화장품 전용 카운터 | Sparkles | ✓ |

#### 1-3. infrastructure (12개)
| Name | Label | Description | Icon | 3D |
|------|-------|-------------|------|-----|
| HVAC | 공조 시스템 | 냉난방 시스템 | Wind | ✗ |
| Lighting | 조명 | 매장 조명 시스템 | Lightbulb | ✓ |
| SpotLight | 스팟 조명 | 포인트 조명 | LampDesk | ✓ |
| AudioSystem | 오디오 시스템 | 매장 음향 시스템 | Volume2 | ✗ |
| Escalator | 에스컬레이터 | 층간 이동 설비 | ArrowUpDown | ✓ |
| Elevator | 엘리베이터 | 층간 이동 설비 | Square | ✓ |
| SecurityGate | 보안 게이트 | EAS 보안 게이트 | ShieldAlert | ✓ |
| PowerSystem | 전력 시스템 | 전력 공급 시스템 | Zap | ✗ |
| **ScentDiffuser** | 향기 디퓨저 | 매장 향기 연출 장치 | Wind | ✓ |
| **SmartMirror** | 스마트 미러 | 디지털 스마트 거울 | ScanFace | ✓ |
| **MusicPlaylist** | 음악 재생목록 | 매장 BGM 재생목록 | Music | ✗ |
| **POS** | POS 단말기 | 판매시점 관리 단말기 | CreditCard | ✓ |

#### 1-4. sensor (14개)
| Name | Label | Description | Icon | 3D |
|------|-------|-------------|------|-----|
| Camera | 카메라 | CCTV 카메라 | Video | ✓ |
| PeopleCounter | 인원 카운터 | 출입 인원 카운터 | Users2 | ✓ |
| WiFiSensor | WiFi 센서 | WiFi 신호 감지 | Wifi | ✗ |
| BluetoothBeacon | 블루투스 비콘 | BLE 비콘 | Bluetooth | ✗ |
| RFIDReader | RFID 리더 | RFID 태그 리더 | Nfc | ✗ |
| TemperatureSensor | 온도 센서 | 온도 측정 센서 | Thermometer | ✗ |
| HeatmapSensor | 히트맵 센서 | 동선 히트맵 센서 | Flame | ✗ |
| QueueSensor | 대기열 센서 | 줄서기 감지 센서 | AlignVerticalJustifyStart | ✗ |
| **Sensor** | 센서 | 일반 센서 | Radio | ✗ |
| **Beacon** | 비콘 | BLE 비콘 장치 | Bluetooth | ✗ |
| **WiFiProbe** | WiFi 프로브 | WiFi 신호 감지 장치 | Wifi | ✗ |
| **DoorSensor** | 도어 센서 | 출입문 감지 센서 | DoorOpen | ✗ |
| **HumiditySensor** | 습도 센서 | 습도 측정 센서 | Droplets | ✗ |
| **SensorEvent** | 센서 이벤트 | 센서 발생 이벤트 | Zap | ✗ |

---

### DOMAIN 2: HUMAN (30개)

고객, 고객 행동, 직원을 정의합니다.

#### 2-1. customer (8개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Customer | 고객 | 고객 정보 | User |
| CustomerSegment | 고객 세그먼트 | 고객 그룹 분류 | Users |
| CustomerProfile | 고객 프로필 | 상세 고객 정보 | UserCircle |
| LoyaltyAccount | 멤버십 계정 | 로열티 프로그램 | Award |
| CustomerPreference | 고객 선호도 | 고객 취향 정보 | Heart |
| CustomerFeedback | 고객 피드백 | 고객 의견/평가 | MessageSquare |
| CustomerWishlist | 위시리스트 | 고객 관심 상품 | Star |
| CustomerAddress | 고객 주소 | 배송/청구 주소 | MapPin |

#### 2-2. behavior (12개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Visit | 방문 | 고객 매장 방문 | UserCheck |
| ZoneDwell | 구역 체류 | 구역별 체류 시간 | Clock |
| CustomerJourney | 고객 여정 | 매장 내 이동 경로 | Route |
| PathSegment | 경로 세그먼트 | 여정의 개별 구간 | ArrowRight |
| ProductInteraction | 상품 상호작용 | 상품 터치/픽업 | Hand |
| FittingRoomSession | 피팅룸 세션 | 탈의실 사용 | Shirt |
| QueueEvent | 대기열 이벤트 | 줄서기 이벤트 | Clock |
| ServiceInteraction | 서비스 상호작용 | 직원 상담 | MessageCircle |
| DigitalInteraction | 디지털 상호작용 | 키오스크/앱 사용 | Smartphone |
| CartActivity | 장바구니 활동 | 장바구니 담기/빼기 | ShoppingCart |
| SearchQuery | 검색 쿼리 | 상품 검색 | Search |
| VisitIntent | 방문 의도 | 추론된 방문 목적 | Target |

#### 2-3. staff (10개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Staff | 직원 | 매장 직원 | Users |
| StaffRole | 직원 역할 | 직원 직책/역할 | BadgeCheck |
| Shift | 근무 시간 | 근무 시프트 | Clock |
| StaffSchedule | 직원 스케줄 | 근무 스케줄링 | Calendar |
| StaffAttendance | 직원 출근 | 출퇴근 기록 | UserCheck |
| Task | 작업 | 직원 작업 태스크 | CheckSquare |
| TaskAssignment | 작업 할당 | 작업 배정 | ClipboardList |
| StaffPerformance | 직원 성과 | 성과 지표 | TrendingUp |
| Training | 교육 | 직원 교육 프로그램 | GraduationCap |
| StaffTraining | 직원 교육 이수 | 교육 이수 기록 | Award |

---

### DOMAIN 3: COMMERCIAL (35개)

상품, 재고, 거래, 가격 정책을 정의합니다.

#### 3-1. product (12개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Product | 제품 | 판매 제품 | Package |
| ProductVariant | 제품 변형 | 색상/사이즈 변형 | Palette |
| Category | 카테고리 | 제품 카테고리 | FolderTree |
| SubCategory | 서브카테고리 | 세부 카테고리 | Folder |
| Brand | 브랜드 | 제품 브랜드 | Award |
| Supplier | 공급업체 | 제품 공급업체 | Truck |
| ProductBundle | 상품 번들 | 묶음 상품 | Package2 |
| ProductAttribute | 상품 속성 | 상품 특성 정보 | List |
| ProductImage | 상품 이미지 | 상품 사진 | Image |
| ProductReview | 상품 리뷰 | 고객 리뷰 | MessageSquare |
| Planogram | 플래노그램 | 진열 계획 | LayoutGrid |
| ProductPlacement | 상품 배치 | 상품 진열 위치 | MapPin |

#### 3-2. inventory (8개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Inventory | 재고 | 제품 재고 정보 | Archive |
| InventoryLocation | 재고 위치 | 재고 보관 위치 | MapPin |
| InventoryMovement | 재고 이동 | 입출고 이력 | ArrowLeftRight |
| StockReceipt | 입고 | 재고 입고 | PackagePlus |
| StockTransfer | 재고 이전 | 매장간 이전 | ArrowRightLeft |
| StockCount | 재고 실사 | 재고 조사 | ClipboardCheck |
| PurchaseOrder | 발주 | 구매 주문 | FileText |
| InventoryAlert | 재고 알림 | 재고 경고 | AlertTriangle |

#### 3-3. transaction (8개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Transaction | 거래 | 판매 거래 | Receipt |
| TransactionLine | 거래 라인 | 개별 구매 항목 | ListOrdered |
| Payment | 결제 | 결제 정보 | CreditCard |
| Discount | 할인 | 적용된 할인 | Percent |
| Return | 반품 | 상품 반품 | RotateCcw |
| Exchange | 교환 | 상품 교환 | ArrowLeftRight |
| GiftCard | 기프트카드 | 상품권 | Gift |
| Basket | 장바구니 | 구매 장바구니 | ShoppingBag |

#### 3-4. pricing (7개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Price | 가격 | 상품 가격 | DollarSign |
| PriceHistory | 가격 이력 | 가격 변동 이력 | History |
| Promotion | 프로모션 | 마케팅 프로모션 | Tag |
| Coupon | 쿠폰 | 할인 쿠폰 | Ticket |
| Campaign | 캠페인 | 마케팅 캠페인 | Megaphone |
| DynamicPricing | 동적 가격 | 실시간 가격 조정 | TrendingUp |
| Markdown | 마크다운 | 재고 할인 | ArrowDown |

---

### DOMAIN 4: ANALYTICS (28개)

지표, KPI, 리포트, 분석 결과를 정의합니다.

#### 4-1. metrics (18개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| DailyStoreMetrics | 일간 매장 지표 | 일간 매장 집계 | BarChart3 |
| HourlyStoreMetrics | 시간별 매장 지표 | 시간별 매장 집계 | Clock |
| ZoneDailyMetrics | 일간 구역 지표 | 일간 구역 집계 | BarChart2 |
| ZoneHourlyMetrics | 시간별 구역 지표 | 시간별 구역 집계 | Activity |
| ProductDailyMetrics | 일간 상품 지표 | 일간 상품 집계 | TrendingUp |
| CategoryMetrics | 카테고리 지표 | 카테고리별 집계 | PieChart |
| TrafficFlow | 동선 흐름 | 고객 동선 분석 | Route |
| QueueMetrics | 대기열 지표 | 대기 시간 분석 | Users |
| ConversionFunnel | 전환 퍼널 | 구매 전환 분석 | Filter |
| BasketAnalysis | 장바구니 분석 | 구매 패턴 분석 | ShoppingBasket |
| **Sale** | 매출 | 매출 거래 기록 | DollarSign |
| **DailySales** | 일간 매출 | 일별 매출 집계 | Calendar |
| **StoreMetrics** | 매장 메트릭 | 매장 성과 지표 | BarChart3 |
| **ZoneMetrics** | 구역 메트릭 | 구역별 성과 지표 | BarChart2 |
| **ProductMetrics** | 상품 메트릭 | 상품별 성과 지표 | TrendingUp |
| **ZonePerformance** | 구역 성과 | 구역 성과 분석 | Activity |
| **ZoneAnalysis** | 구역 분석 | 구역 상세 분석 | PieChart |
| **PurchaseConversion** | 구매 전환 | 방문→구매 전환 분석 | ArrowRight |

#### 4-2. kpi (6개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| KPIDefinition | KPI 정의 | 핵심 성과 지표 정의 | Target |
| KPITarget | KPI 목표 | KPI 목표치 | Flag |
| KPIActual | KPI 실적 | KPI 실제값 | CheckCircle |
| Scorecard | 스코어카드 | 성과 대시보드 | LayoutDashboard |
| Benchmark | 벤치마크 | 비교 기준 | Scale |
| Goal | 목표 | 비즈니스 목표 | Mountain |

#### 4-3. report (4개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| ReportDefinition | 리포트 정의 | 보고서 템플릿 | FileBarChart |
| Dashboard | 대시보드 | 실시간 대시보드 | LayoutDashboard |
| Alert | 알림 | 시스템 알림 | Bell |
| Annotation | 주석 | 데이터 주석 | StickyNote |

---

### DOMAIN 5: AI/ML (21개)

예측, 최적화, 추천, 시뮬레이션을 정의합니다.

#### 5-1. prediction (6개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| DemandForecast | 수요 예측 | AI 수요 예측 | TrendingUp |
| TrafficForecast | 방문객 예측 | 방문객 수 예측 | Users |
| StaffingForecast | 인력 예측 | 필요 인력 예측 | UserPlus |
| ChurnPrediction | 이탈 예측 | 고객 이탈 예측 | UserMinus |
| CLVPrediction | CLV 예측 | 고객 생애 가치 예측 | Gem |
| AnomalyDetection | 이상 탐지 | 이상 패턴 감지 | AlertOctagon |

#### 5-2. optimization (5개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| LayoutOptimization | 레이아웃 최적화 | 매장 배치 최적화 | LayoutGrid |
| PricingOptimization | 가격 최적화 | 동적 가격 최적화 | DollarSign |
| StaffScheduleOptimization | 인력 배치 최적화 | 근무 스케줄 최적화 | Calendar |
| ReplenishmentOptimization | 재고 보충 최적화 | 발주량 최적화 | Package |
| TrafficFlowOptimization | 동선 최적화 | 고객 동선 최적화 | Route |

#### 5-3. recommendation (5개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| ProductRecommendation | 상품 추천 | 개인화 상품 추천 | Sparkles |
| CrossSellRecommendation | 교차판매 추천 | 연관 상품 추천 | ArrowRightLeft |
| NextBestAction | 다음 최적 행동 | 직원 행동 가이드 | Navigation |
| PersonalizedOffer | 개인화 오퍼 | 맞춤 프로모션 | Gift |
| AIInsight | AI 인사이트 | AI 생성 인사이트 | Lightbulb |

#### 5-4. simulation (5개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| SimulationScenario | 시뮬레이션 시나리오 | What-if 가정 | Wand2 |
| SimulationRun | 시뮬레이션 실행 | 시나리오 실행 | Play |
| SimulationResult | 시뮬레이션 결과 | 실행 결과 | BarChartBig |
| SimulatedAgent | 시뮬레이션 에이전트 | 가상 고객 | Bot |
| CustomerPersona | 고객 페르소나 | 가상 고객 유형 | UserCircle2 |

---

### DOMAIN 6: EXTERNAL (10개)

외부 데이터 및 연동을 정의합니다.

#### 6-1. environment (5개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Weather | 날씨 | 기상 데이터 | Cloud |
| Holiday | 공휴일 | 휴일 및 이벤트 | Calendar |
| LocalEvent | 지역 이벤트 | 지역 행사 | MapPin |
| Competitor | 경쟁사 | 경쟁 매장 | Building2 |
| EconomicIndicator | 경제 지표 | 거시경제 지표 | LineChart |

#### 6-2. integration (5개)
| Name | Label | Description | Icon |
|------|-------|-------------|------|
| DataSource | 데이터 소스 | 원천 시스템 | Database |
| DataSourceTable | 데이터 테이블 | 원천 테이블 | Table2 |
| EntityMapping | 엔티티 매핑 | 온톨로지 매핑 | GitBranch |
| ETLJob | ETL 작업 | 데이터 파이프라인 | Workflow |
| SyncLog | 동기화 로그 | 데이터 동기화 이력 | FileText |

---

### DOMAIN 7: ORGANIZATION (4개)

조직 구조를 정의합니다.

| Name | Label | Description | Icon |
|------|-------|-------------|------|
| Organization | 조직 | 리테일 조직 | Building2 |
| Department | 부서 | 조직 부서 | Users |
| Region | 지역 | 영업 지역 | Map |
| StoreCluster | 매장 클러스터 | 매장 그룹 | Layers |

---

## 2. 관계 타입 (110개)

### CATEGORY 1: SPATIAL (15개)

공간 간 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| CONTAINS | 포함 | Store | Zone | directed |
| HAS_ZONE | 구역 보유 | Store | Zone | directed |
| HAS_SUBZONE | 세부구역 보유 | Zone | SubZone | directed |
| CONNECTED_TO | 연결됨 | Zone | Zone | bidirectional |
| ADJACENT_TO | 인접함 | Zone | Zone | undirected |
| HAS_ENTRANCE | 출입구 보유 | Store | Entrance | directed |
| HAS_EXIT | 출구 보유 | Store | Exit | directed |
| LEADS_TO | 통함 | Entrance | Zone | directed |
| HAS_FLOOR | 층 보유 | Store | Floor | directed |
| ON_FLOOR | 층 위치 | Zone | Floor | directed |
| HAS_CHECKOUT_AREA | 계산대 구역 보유 | Store | CheckoutArea | directed |
| HAS_FITTING_ROOM | 탈의실 보유 | Zone | FittingRoom | directed |
| HAS_STORAGE | 창고 보유 | Store | StorageRoom | directed |
| HAS_SERVICE_AREA | 서비스 구역 보유 | Store | ServiceArea | directed |
| HAS_AISLE | 통로 보유 | Zone | Aisle | directed |

### CATEGORY 2: FURNITURE (12개)

가구 배치 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| LOCATED_IN | 위치함 | Shelf | Zone | directed |
| HAS_SHELF | 선반 보유 | Zone | Shelf | directed |
| HAS_RACK | 랙 보유 | Zone | Rack | directed |
| HAS_DISPLAY_TABLE | 디스플레이 테이블 보유 | Zone | DisplayTable | directed |
| HAS_GONDOLA | 곤돌라 보유 | Zone | Gondola | directed |
| HAS_ENDCAP | 엔드캡 보유 | Gondola | EndCap | directed |
| HAS_SHOWCASE | 쇼케이스 보유 | Zone | Showcase | directed |
| HAS_CHECKOUT_COUNTER | 계산대 보유 | CheckoutArea | CheckoutCounter | directed |
| HAS_KIOSK | 키오스크 보유 | Zone | Kiosk | directed |
| HAS_DIGITAL_SIGNAGE | 사이니지 보유 | Zone | DigitalSignage | directed |
| NEAR_TO | 근접함 | * | * | undirected |
| FACES | 마주봄 | * | * | directed |

### CATEGORY 3: PRODUCT (15개)

상품 관련 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| BELONGS_TO_CATEGORY | 카테고리 소속 | Product | Category | directed |
| BELONGS_TO_SUBCATEGORY | 서브카테고리 소속 | Product | SubCategory | directed |
| MANUFACTURED_BY | 제조사 | Product | Brand | directed |
| SUPPLIED_BY | 공급됨 | Product | Supplier | directed |
| DISPLAYED_ON | 진열됨 | Product | Shelf | directed |
| PLACED_ON_RACK | 랙 배치 | Product | Rack | directed |
| PLACED_ON_TABLE | 테이블 배치 | Product | DisplayTable | directed |
| PLACED_IN_ZONE | 구역 배치 | Product | Zone | directed |
| HAS_VARIANT | 변형 보유 | Product | ProductVariant | directed |
| PART_OF_BUNDLE | 번들 구성 | Product | ProductBundle | directed |
| FREQUENTLY_BOUGHT_WITH | 함께 구매 | Product | Product | undirected |
| SIMILAR_TO | 유사함 | Product | Product | undirected |
| SUBSTITUTE_FOR | 대체품 | Product | Product | undirected |
| DEFINED_IN_PLANOGRAM | 플래노그램 정의 | Product | Planogram | directed |
| HAS_PLACEMENT | 배치 정보 | Product | ProductPlacement | directed |

### CATEGORY 4: INVENTORY (10개)

재고 관련 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| HAS_INVENTORY | 재고 보유 | Product | Inventory | directed |
| STORED_AT | 매장 재고 | Inventory | Store | directed |
| STORED_IN_LOCATION | 위치 재고 | Inventory | InventoryLocation | directed |
| STORED_IN_STORAGE | 창고 보관 | Inventory | StorageRoom | directed |
| RECEIVED_FROM | 입고처 | StockReceipt | Supplier | directed |
| TRANSFERRED_TO | 이전 대상 | StockTransfer | Store | directed |
| TRANSFERRED_FROM | 이전 출발 | StockTransfer | Store | directed |
| ORDERED_FROM | 발주처 | PurchaseOrder | Supplier | directed |
| ORDERS_PRODUCT | 발주 상품 | PurchaseOrder | Product | directed |
| TRIGGERS_ALERT | 알림 발생 | Inventory | InventoryAlert | directed |

### CATEGORY 5: CUSTOMER (18개)

고객 행동 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| HAS_VISIT | 방문 보유 | Customer | Visit | directed |
| VISITED_STORE | 매장 방문 | Visit | Store | directed |
| ENTERED_THROUGH | 출입구 진입 | Visit | Entrance | directed |
| ENTERED_ZONE | 구역 진입 | Visit | Zone | directed |
| DWELLED_IN | 체류함 | Visit | ZoneDwell | directed |
| HAS_JOURNEY | 여정 보유 | Visit | CustomerJourney | directed |
| HAS_PATH_SEGMENT | 경로 구간 | CustomerJourney | PathSegment | directed |
| BELONGS_TO_SEGMENT | 세그먼트 소속 | Customer | CustomerSegment | directed |
| HAS_PROFILE | 프로필 보유 | Customer | CustomerProfile | directed |
| HAS_LOYALTY_ACCOUNT | 멤버십 보유 | Customer | LoyaltyAccount | directed |
| HAS_PREFERENCE | 선호도 보유 | Customer | CustomerPreference | directed |
| INTERACTED_WITH_PRODUCT | 상품 상호작용 | Visit | ProductInteraction | directed |
| USED_FITTING_ROOM | 탈의실 사용 | Visit | FittingRoomSession | directed |
| WAITED_IN_QUEUE | 대기열 경험 | Visit | QueueEvent | directed |
| DETECTED_BY_SENSOR | 센서 감지 | Customer | WiFiSensor | directed |
| CAPTURED_BY_CAMERA | 카메라 촬영 | Customer | Camera | directed |
| INFERRED_INTENT | 의도 추론 | Visit | VisitIntent | directed |
| PROVIDED_FEEDBACK | 피드백 제공 | Customer | CustomerFeedback | directed |

### CATEGORY 6: TRANSACTION (15개)

거래 관련 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| MADE_TRANSACTION | 거래함 | Customer | Transaction | directed |
| RESULTED_FROM_VISIT | 방문 결과 | Transaction | Visit | directed |
| HAS_LINE_ITEM | 항목 보유 | Transaction | TransactionLine | directed |
| PURCHASED_PRODUCT | 제품 구매 | TransactionLine | Product | directed |
| PAID_WITH | 결제 수단 | Transaction | Payment | directed |
| APPLIED_DISCOUNT | 할인 적용 | Transaction | Discount | directed |
| APPLIED_PROMOTION | 프로모션 적용 | Transaction | Promotion | directed |
| USED_COUPON | 쿠폰 사용 | Transaction | Coupon | directed |
| CHECKED_OUT_AT | 계산대 결제 | Transaction | CheckoutCounter | directed |
| OCCURRED_AT_STORE | 매장 거래 | Transaction | Store | directed |
| HAS_RETURN | 반품 발생 | Transaction | Return | directed |
| HAS_EXCHANGE | 교환 발생 | Transaction | Exchange | directed |
| FROM_BASKET | 장바구니 기반 | Transaction | Basket | directed |
| ADDED_TO_BASKET | 장바구니 추가 | Product | Basket | directed |
| USED_GIFT_CARD | 기프트카드 사용 | Transaction | GiftCard | directed |

### CATEGORY 7: STAFF (10개)

직원 관련 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| WORKS_AT | 근무함 | Staff | Store | directed |
| HAS_ROLE | 역할 보유 | Staff | StaffRole | directed |
| SCHEDULED_FOR | 스케줄 배정 | Staff | StaffSchedule | directed |
| ASSIGNED_TO_SHIFT | 시프트 배정 | Staff | Shift | directed |
| ASSIGNED_TO_ZONE | 구역 배정 | Staff | Zone | directed |
| ASSIGNED_TO_TASK | 작업 배정 | Staff | Task | directed |
| COMPLETED_TASK | 작업 완료 | Staff | Task | directed |
| HAS_PERFORMANCE | 성과 기록 | Staff | StaffPerformance | directed |
| PROCESSED_TRANSACTION | 거래 처리 | Staff | Transaction | directed |
| REPORTS_TO | 보고 관계 | Staff | Staff | directed |

### CATEGORY 8: AI (10개)

AI/ML 관련 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| PREDICTED_FOR_PRODUCT | 상품 예측 | DemandForecast | Product | directed |
| PREDICTED_FOR_STORE | 매장 예측 | TrafficForecast | Store | directed |
| OPTIMIZES_LAYOUT | 레이아웃 최적화 | LayoutOptimization | Zone | directed |
| OPTIMIZES_PRICE | 가격 최적화 | PricingOptimization | Product | directed |
| OPTIMIZES_STAFFING | 인력 최적화 | StaffScheduleOptimization | Store | directed |
| RECOMMENDS_TO_CUSTOMER | 고객 추천 | ProductRecommendation | Customer | directed |
| RECOMMENDS_PRODUCT | 상품 추천 | ProductRecommendation | Product | directed |
| SUGGESTS_ACTION | 행동 제안 | NextBestAction | Staff | directed |
| GENERATED_INSIGHT | 인사이트 생성 | AIInsight | Store | directed |
| SIMULATES_SCENARIO | 시나리오 시뮬레이션 | SimulationRun | SimulationScenario | directed |

### CATEGORY 9: ORGANIZATION (5개)

조직 관련 관계를 정의합니다.

| Name | Label | Source | Target | Direction |
|------|-------|--------|--------|-----------|
| OPERATES | 운영함 | Organization | Store | directed |
| HAS_DEPARTMENT | 부서 보유 | Organization | Department | directed |
| MANAGES_REGION | 지역 관리 | Organization | Region | directed |
| IN_REGION | 지역 소속 | Store | Region | directed |
| BELONGS_TO_CLUSTER | 클러스터 소속 | Store | StoreCluster | directed |

---

## 3. ID 체계

### 엔티티 타입 ID 패턴
```
a[DOMAIN][SUBCATEGORY]-[SEQ1]-4000-8000-[SEQ2]

예시:
a0000001-0001-4000-8000-000000000001  → PHYSICAL/space/Store
a0000002-0002-4000-8000-000000000005  → HUMAN/behavior/ProductInteraction
a0000003-0001-4000-8000-000000000001  → COMMERCIAL/product/Product
a0000004-0001-4000-8000-000000000001  → ANALYTICS/metrics/DailyStoreMetrics
a0000004-0004-4000-8000-000000000001  → ANALYTICS/metrics/Sale (v1.1 확장)
```

### 관계 타입 ID 패턴
```
b[CATEGORY]-[SEQ1]-4000-8000-[SEQ2]

예시:
b0000001-0001-4000-8000-000000000001  → SPATIAL/CONTAINS
b0000003-0001-4000-8000-000000000005  → PRODUCT/DISPLAYED_ON
b0000006-0001-4000-8000-000000000001  → TRANSACTION/MADE_TRANSACTION
```

---

## 4. 우선순위

| Priority | 설명 | 사용 예시 |
|----------|------|----------|
| **critical** | 핵심 필수 | Store, Zone, Product, Customer, Transaction |
| **high** | 중요 | Shelf, Visit, Inventory, Staff |
| **medium** | 선택적 | Mannequin, QueueEvent, Coupon |
| **low** | 부가 | RestArea, Mirror, ScentDiffuser |

---

## 5. 버전 이력

| 버전 | 일자 | 변경 사항 |
|------|------|----------|
| v1.0 | 2025-12-14 | 초기 마스터 스키마 (160 엔티티 + 100 관계) |
| v1.1 | 2025-12-15 | 확장 스키마 (+24 엔티티, 중복 정리) |
| v2.0 | 2025-12-16 | 최종 정리 (185 엔티티 + 110 관계) |

---

## 6. 사용법

### 마스터 타입 조회
```sql
-- 마스터 엔티티 타입 조회
SELECT name, label, color, icon, properties
FROM ontology_entity_types
WHERE org_id IS NULL AND user_id IS NULL
ORDER BY properties->>'category', name;

-- 마스터 관계 타입 조회
SELECT name, label, source_entity_type, target_entity_type, properties
FROM ontology_relation_types
WHERE org_id IS NULL AND user_id IS NULL
ORDER BY properties->>'category', name;
```

### 도메인별 통계
```sql
SELECT
  properties->>'category' as domain,
  COUNT(*) as count
FROM ontology_entity_types
WHERE org_id IS NULL AND user_id IS NULL
GROUP BY properties->>'category'
ORDER BY count DESC;
```

---

**© 2025 NEURALTWIN. All rights reserved.**
