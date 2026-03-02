-- =============================================================================
-- NeuralTwin RAG Knowledge Base — Seed Data
-- =============================================================================
-- Version: 1.0 | 2026-03-02
-- Purpose: 200+ Korean retail domain knowledge chunks for AI RAG system
-- Table:   retail_knowledge_chunks
-- Usage:   psql -f seed-knowledge.sql  OR  run via Supabase SQL editor
-- Note:    embedding column left NULL — generate via Edge Function later
-- =============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 1: store_operations (매장 운영)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 레이아웃 기본 원칙',
'매장 레이아웃은 고객 동선을 자연스럽게 유도하는 것이 핵심입니다. 입구에서 우측으로 이동하는 자연스러운 동선(반시계 방향)을 활용하고, 주력 상품은 골든존(눈높이 120~150cm)에 배치합니다. 통로 폭은 최소 90cm(1인), 권장 120cm(2인 교차) 이상을 확보해야 하며, 막다른 골목(dead-end) 구간을 최소화하여 고객이 매장 전체를 순회하도록 설계합니다. 계산대는 출구 근처에 배치하되 충동구매 상품을 주변에 진열합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["레이아웃","동선","골든존","기본"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 동선 설계 전략',
'효과적인 매장 동선은 그리드형, 자유형, 루프형 세 가지 기본 패턴이 있습니다. 그리드형은 슈퍼마켓처럼 직선 통로로 상품 노출을 극대화하고, 자유형은 부티크처럼 탐색을 유도하며, 루프형은 IKEA처럼 정해진 경로로 전체 매장을 순회시킵니다. WiFi 센서나 카메라 히트맵으로 실제 고객 동선을 분석한 후, 데드존(방문율 낮은 구역)에 매력적인 상품을 배치하거나 조명/사이니지로 시선을 유도하여 개선합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["동선","그리드","루프","히트맵"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', 'VMD(Visual Merchandising) 기초',
'VMD는 VP(Visual Presentation), PP(Point of sale Presentation), IP(Item Presentation)의 3단계로 구성됩니다. VP는 쇼윈도와 매장 입구에서 브랜드 이미지를 전달하고, PP는 매대 위 마네킹이나 디스플레이로 코디네이션을 제안하며, IP는 개별 상품의 정리 정돈과 사이즈별 배열입니다. 시즌별 VMD 교체 주기는 2~4주가 적절하며, 신상품 입고 시 72시간 내 디스플레이 변경을 권장합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["VMD","VP","PP","IP","디스플레이"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '재고 관리 ABC 분석법',
'ABC 분석은 파레토 법칙(80/20)을 재고 관리에 적용한 기법입니다. A등급(매출 상위 20% 품목, 매출 기여 약 80%)은 재고를 충분히 확보하고 일일 모니터링합니다. B등급(다음 30% 품목, 매출 기여 약 15%)은 주간 단위로 관리하고, C등급(나머지 50% 품목, 매출 기여 약 5%)은 최소 재고만 유지합니다. 분기별로 등급을 재분류하며, 시즌 전환기에는 월별 재분류를 권장합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["재고관리","ABC분석","파레토"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 조명 설계 가이드',
'매장 조명은 전반조명(300~500lux), 포인트조명(1000~2000lux), 장식조명 3종을 조합합니다. 의류 매장은 연색성(CRI) 90 이상, 색온도 3000~4000K의 따뜻한 조명이 적합하고, 화장품 매장은 CRI 95 이상의 자연광에 가까운 5000K 조명을 사용합니다. LED 조명은 기존 할로겐 대비 전력 소비 70% 절감 효과가 있으며, 조광(디밍) 시스템으로 시간대별 분위기를 조절할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["조명","LED","CRI","색온도"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 청결 관리 체크리스트',
'매장 청결은 고객 만족도와 재방문율에 직접 영향을 미칩니다. 일일 체크리스트에는 바닥 청소(오픈 전/후), 진열대 먼지 제거, 피팅룸 정리, 화장실 점검을 포함합니다. 주간 체크에는 유리면 세척, 조명 기구 점검, 공조 필터 확인을 추가합니다. 월간으로는 전문 업체 정밀 청소, 해충 방역을 실시합니다. 청결 점수를 100점 만점으로 기록하고 90점 미만 시 즉시 시정 조치를 취합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["청결","체크리스트","위생"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'fashion', '패션 매장 시즌 전환 운영',
'패션 리테일의 시즌 전환은 S/S(2~3월), F/W(8~9월) 연 2회 대규모로 진행됩니다. 전환 2주 전부터 이월 상품 할인(30~50%)을 시작하고, 전환 주간에는 VMD 전면 교체, 마네킹 스타일링 변경, POP 물 교체를 3일 내 완료합니다. 신상품은 입구와 골든존에 우선 배치하고, 이월 상품은 매장 후방 또는 별도 세일 존으로 이동시킵니다. 시즌 전환 기간 매출 하락은 15~25%가 일반적이며, 전환 완료 후 2주 내 회복됩니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","시즌전환","VMD","이월상품"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'fnb', 'F&B 매장 주방 동선 최적화',
'주방 동선은 식재료 입고 → 보관 → 전처리 → 조리 → 서빙 → 퇴식의 일방향 흐름이 원칙입니다. 교차 오염을 방지하기 위해 생식재료와 조리 완료 음식의 동선이 겹치지 않아야 합니다. 주방 면적은 전체 매장의 30~40%가 적정하며, 조리대 간격은 최소 120cm를 확보합니다. 피크 타임(11:30~13:00, 18:00~20:00)에는 사전 준비(미장플라스) 체계를 갖추어 주문 후 제공 시간을 평균 15분 이내로 유지합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","주방동선","위생","미장플라스"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'beauty', '뷰티 매장 테스터 존 관리',
'테스터 제품은 고객 체험의 핵심이므로 철저한 위생 관리가 필수입니다. 립 제품은 1회용 어플리케이터를 비치하고, 스킨케어 테스터는 펌프형 용기를 사용합니다. 테스터 교체 주기는 파운데이션/립 2주, 스킨케어 1개월, 향수 3개월이 기준입니다. 테스터 존에는 손 세정제, 화장솜, 거울을 반드시 비치하고, 조명은 CRI 95 이상의 자연광 색온도(5000K)를 적용하여 정확한 색상 확인이 가능하도록 합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","테스터","위생","조명"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'department_store', '백화점 층별 구성 전략',
'백화점의 전통적 층별 구성은 지하(식품관), 1층(화장품/잡화), 2~3층(여성복), 4층(남성복), 5층(스포츠/캐주얼), 6~7층(리빙/문화)입니다. 1층에 화장품을 배치하는 이유는 높은 객단가와 회전율, 그리고 향기 마케팅 효과 때문입니다. 최근에는 MZ세대 유입을 위해 1층에 팝업 스토어나 카페를 배치하는 파격적인 층별 개편이 트렌드입니다. 식품관은 집객 효과가 크므로 지하층에서 고객을 끌어올리는 앵커(anchor) 역할을 합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","층별구성","앵커","식품관"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'lifestyle', '라이프스타일 편집샵 큐레이션 원칙',
'라이프스타일 편집샵은 단일 카테고리가 아닌 라이프스타일 테마로 상품을 큐레이션합니다. 예를 들어 "미니멀 라이프" 테마로 의류, 문구, 인테리어 소품을 함께 진열합니다. 큐레이션 변경은 월 1~2회가 적정하며, SNS 트렌드와 계절감을 반영합니다. 매장 내 체험 공간(워크숍, 시음 등)을 20% 이상 확보하면 체류 시간이 평균 40% 증가하고, 구매 전환율도 15~20% 향상되는 것으로 나타났습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","편집샵","큐레이션","체험"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 온도 및 습도 관리',
'쾌적한 매장 환경의 적정 온도는 여름 24~26°C, 겨울 20~22°C이며, 습도는 40~60%를 유지합니다. 입구 에어커튼은 냉난방 효율을 30% 이상 높여주며, IoT 센서를 활용한 자동 제어 시스템을 도입하면 에너지 비용을 20~25% 절감할 수 있습니다. 식품 매장은 냉장 구역(2~5°C)과 상온 구역의 온도 경계를 명확히 관리해야 하며, 30분 단위로 온도 로그를 기록합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["온도","습도","에너지","IoT"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '오픈/클로징 체크리스트',
'매장 오픈 절차는 보안 해제 → 조명/공조 가동 → 금전 등록기 준비 → 진열 상태 점검 → 청결 확인 → POS 테스트 → 오픈 순으로 진행합니다. 클로징은 마지막 고객 확인 → 매출 정산 → 재고 점검(고가 품목) → 진열 정리 → 청소 → 공조/조명 OFF → 보안 설정 순입니다. 체크리스트를 태블릿에 디지털화하면 완료율이 95% 이상으로 향상되고, 본사에서 실시간 모니터링이 가능합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["오픈","클로징","체크리스트","SOP"],"difficulty":"basic"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 2: customer_behavior (고객 행동)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '고객 체류 시간과 매출 상관관계',
'고객 체류 시간은 구매 전환율과 강한 양의 상관관계(r=0.72~0.85)를 보입니다. 평균 체류 시간이 5분 미만이면 전환율이 10% 이하이지만, 15분 이상이면 전환율이 40~60%까지 상승합니다. 체류 시간을 늘리는 전략으로는 체험 공간 마련, 편안한 휴식 공간, 배경 음악(BPM 60~80의 느린 템포), 향기 마케팅(바닐라/시트러스 계열) 등이 효과적입니다. WiFi 프로브 센서로 체류 시간을 자동 측정하면 데이터 기반 매장 최적화가 가능합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["체류시간","전환율","상관관계","센서"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '고객 구매 여정(Customer Journey) 분석',
'오프라인 매장의 고객 구매 여정은 인지 → 방문 → 탐색 → 비교 → 구매 → 재방문의 6단계로 구성됩니다. 각 단계별 이탈률을 측정하여 병목 구간을 파악합니다. 평균적으로 매장 앞 통행 → 입장 전환율 5~15%, 입장 → 구매 전환율 20~40%입니다. 입장 전환율이 낮으면 쇼윈도/파사드 개선이 필요하고, 입장 후 구매 전환율이 낮으면 매장 내 경험(동선, 접객, 상품구성) 개선이 필요합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["구매여정","전환율","이탈률","퍼널"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '고객 재방문율 개선 전략',
'재방문율은 리테일 비즈니스의 핵심 지표로, 신규 고객 획득 비용이 기존 고객 유지 비용의 5~7배입니다. 재방문율을 높이는 핵심 전략은: 1) 멤버십 포인트 적립(재방문율 +20~30%), 2) 개인화된 SMS/앱 푸시 알림(재방문 +15%), 3) 생일/기념일 쿠폰(사용률 35~45%), 4) 한정판/신상품 입고 알림, 5) 매장 내 긍정적 경험 제공(NPS 8점 이상 고객의 재방문율 3배)입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["재방문율","멤버십","CRM","고객유지"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '고객 세그먼테이션 RFM 분석',
'RFM 분석은 Recency(최근 방문일), Frequency(방문 빈도), Monetary(구매 금액)의 3가지 지표로 고객을 세분화합니다. 각 지표를 1~5점으로 점수화하여 총 125개 세그먼트를 만들고, 이를 VIP(555), 충성고객(X5X), 이탈위험(1XX), 신규유망(5X1) 등 8~10개 그룹으로 재분류합니다. VIP 고객(상위 5%)이 전체 매출의 25~35%를 차지하므로 전담 관리가 필요하며, 이탈위험 고객에게는 윈백 캠페인을 실시합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["RFM","세그먼테이션","VIP","CRM"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '피크 타임 고객 행동 패턴',
'리테일 매장의 피크 타임은 업종별로 다릅니다. 패션/잡화는 토요일 14~17시, F&B는 평일 12~13시/18~19시, 대형마트는 주말 10~12시가 최대 피크입니다. 피크 타임에는 고객의 체류 시간이 평균 20% 감소하고 스트레스 수준이 높아져 충동구매가 오히려 줄어듭니다. 피크 관리 전략으로 대기 시간 표시, 셀프 계산대 확충, 직원 배치 강화를 적용하면 피크 타임 고객 만족도를 15~25% 향상시킬 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["피크타임","고객패턴","대기시간","만족도"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'fashion', '패션 매장 피팅룸 이용 행동',
'피팅룸 이용 고객의 구매 전환율은 67%로, 미이용 고객(10%)의 6.7배입니다. 피팅룸 최적화 포인트: 1) 대기 시간 5분 이내(이탈률 급증 기점), 2) 피팅룸 내 조명은 따뜻한 톤(3000K)으로 피부색을 좋게 보이게, 3) 전신 거울과 다각도 거울 설치, 4) 코디 제안 스크린 또는 스마트미러 도입, 5) 직원 호출 버튼 설치. 피팅룸 수는 매장 면적 100평당 3~4개가 적정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["피팅룸","전환율","패션","스마트미러"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '고객 동선 히트맵 해석 방법',
'히트맵은 매장 내 고객 밀집도를 시각화하여 핫존(고밀집)과 콜드존(저밀집)을 파악합니다. 핫존에는 마진이 높은 상품이나 프로모션 상품을 배치하여 매출을 극대화하고, 콜드존에는 유인 요소(인기 상품, 체험 코너, 포토존)를 배치하여 트래픽을 분산시킵니다. WiFi 프로브 기반 히트맵은 MAC 주소의 해시값으로 개인 식별 없이 동선을 추적하며, 15분 간격 데이터를 1시간 단위로 집계하여 분석합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["히트맵","핫존","콜드존","WiFi프로브"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '요일별/시간대별 방문 패턴',
'한국 리테일 매장의 일반적인 방문 패턴은 주중 대비 주말 방문객이 2~3배 많으며, 금요일 저녁부터 증가세가 시작됩니다. 시간대별로는 오전(10~12시) 20%, 오후(12~18시) 55%, 저녁(18~21시) 25%의 분포를 보입니다. 날씨 영향도 크며, 비오는 날 방문객 30~40% 감소, 기온이 30도 이상이면 실내 매장 방문 20% 증가하는 패턴이 있습니다. 이 데이터를 기반으로 인력 배치와 프로모션 시간을 최적화합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["방문패턴","요일","시간대","날씨"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'beauty', '뷰티 고객 카운슬링 행동 분석',
'뷰티 매장에서 전문 상담(카운슬링)을 받은 고객의 객단가는 미상담 고객 대비 2.5~3배 높습니다. 효과적인 카운슬링 프로세스: 1) 피부 진단기(스킨스코프)로 객관적 데이터 제공(신뢰도 상승), 2) 3가지 이하 제품 추천(선택 과부하 방지), 3) 샘플 제공으로 재방문 유도, 4) 상담 내용 CRM 기록으로 다음 방문 시 연속성 제공. 카운슬링 시간은 10~15분이 최적이며, 20분 초과 시 구매 전환율이 오히려 감소합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","카운슬링","객단가","CRM"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'fnb', 'F&B 테이블 회전율과 고객 행동',
'F&B 매장의 테이블 회전율은 점심 2.5~3.5회, 저녁 1.5~2.5회가 일반적입니다. 회전율을 높이는 전략: 1) 메뉴판 단순화(선택 시간 단축), 2) 런치 세트 메뉴 제공(주문 속도 향상), 3) 디저트/음료 별도 메뉴판(빠른 퇴식 유도 방지), 4) 좌석 배치 최적화(2인석 비중 40% 이상). 단, 카페형 매장은 회전율보다 체류시간과 추가 주문이 중요하므로 편안한 좌석과 콘센트를 제공합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","테이블회전율","메뉴","좌석"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'department_store', '백화점 고객 층간 이동 패턴',
'백화점 고객의 층간 이동은 에스컬레이터 이용이 70%, 엘리베이터 20%, 계단 10%입니다. 고객의 60%는 입장 후 3개 층 이내만 방문하므로, 목적지 층 외에 추가 층 방문을 유도하는 전략이 필요합니다. 에스컬레이터 옆 매대(이스컬레이터 존)는 노출도가 매우 높아 신상품이나 프로모션에 적합합니다. 식품관(B1)과 문화센터(상층)를 양 끝에 배치하여 전 층을 통과하게 하는 샌드위치 전략이 효과적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","층간이동","에스컬레이터","샌드위치전략"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '충동구매 유발 요인 분석',
'충동구매는 전체 매장 매출의 40~65%를 차지합니다. 주요 유발 요인은: 1) 가격 프로모션(한정 할인, 1+1), 2) 진열 위치(계산대 주변, 동선 교차점), 3) 감각 자극(시각: 밝은 색상, 후각: 향기, 청각: 음악 BPM), 4) 사회적 증거("베스트셀러", "품절임박" 태그), 5) 소량 진열(희소성 효과). 충동구매 상품은 객단가 2만원 이하, 자주 사용하는 소모품이 가장 효과적이며, 계산대 대기 시간이 길수록 충동구매율이 높아집니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["충동구매","프로모션","진열","심리"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'lifestyle', '라이프스타일 매장 고객 체험 행동',
'라이프스타일 매장에서 체험 활동에 참여한 고객의 구매 전환율은 일반 고객의 2배이며, 평균 체류 시간도 35분 대비 55분으로 57% 길어집니다. 효과적인 체험 유형: 1) 제품 시연(쿠킹클래스, DIY 워크숍), 2) 감각 체험(향초 만들기, 커피 테이스팅), 3) 디지털 체험(AR 인테리어 시뮬레이션), 4) 커뮤니티 이벤트(독서모임, 요가클래스). 월 2~4회 정기 이벤트 운영 시 고객 재방문율이 45% 향상됩니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","체험","워크숍","재방문"],"difficulty":"intermediate"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 3: product_management (상품 관리)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '상품 회전율(Inventory Turnover) 관리',
'상품 회전율은 일정 기간 동안 재고가 몇 번 판매되었는지를 나타내는 지표로, 매출원가 ÷ 평균 재고금액으로 계산합니다. 업종별 적정 회전율은 패션 4~6회/년, 식품 12~24회/년, 가전 6~8회/년입니다. 회전율이 낮은 상품은 할인 판매, 번들링, 위치 이동 등으로 재고 소진을 촉진하고, 회전율이 지나치게 높은 상품은 품절 리스크가 있으므로 안전 재고를 상향 조정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["상품회전율","재고","KPI"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', 'MD(Merchandising) 전략 기본 프레임워크',
'MD 전략은 적정 상품(Right Product)을 적정 시기(Right Time)에 적정 장소(Right Place)에서 적정 가격(Right Price)으로 적정 수량(Right Quantity) 판매하는 5R 원칙에 기반합니다. 상품 구성은 기본상품(전체의 60%, 안정 매출), 트렌드상품(25%, 신규 고객 유입), 시즌한정상품(15%, 화제성/희소성)으로 포트폴리오를 구성합니다. 주 단위 판매 데이터를 분석하여 리오더, 마크다운, 단종 결정을 내립니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["MD","5R","상품구성","포트폴리오"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '시즌별 상품 구성 캘린더',
'한국 리테일의 연간 상품 캘린더: 1~2월(설 선물세트, 겨울 정리세일), 3~4월(S/S 신상품, 입학/졸업), 5월(가정의 달 선물), 6~7월(여름 상품, 바캉스), 8~9월(F/W 신상품, 추석), 10월(가을 신상, 핼러윈), 11월(블랙프라이데이, 빼빼로데이), 12월(크리스마스, 연말세일). 각 시즌 상품은 해당 시기 4~6주 전 기획을 시작하고, 2주 전 입고를 완료해야 합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["시즌","캘린더","상품기획","연간계획"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '상품 ABC-XYZ 교차 분석',
'ABC 분석(매출 기여도)과 XYZ 분석(수요 변동성)을 교차하면 9개 그룹이 만들어집니다. AX(고매출-안정수요): 자동 발주 시스템 적용, AY(고매출-변동수요): 주간 모니터링, AZ(고매출-불안정수요): 안전재고 상향. BX~CZ는 단계적으로 관리 수준을 낮춥니다. CZ(저매출-불안정수요) 상품은 단종을 검토합니다. 이 분석을 분기별로 실시하면 재고 비용을 15~25% 절감하면서 품절률을 50% 줄일 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["ABC-XYZ","재고관리","수요예측","분석"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'fashion', '패션 상품 사이즈 구성비 최적화',
'패션 매장의 사이즈 구성비는 판매 데이터 기반으로 설정합니다. 한국 여성복 일반적 구성비: S(15%), M(35%), L(30%), XL(20%). 남성복: M(25%), L(35%), XL(25%), XXL(15%). 지역별 차이가 크므로 점포별 판매 데이터를 6개월 이상 축적한 후 최적 구성비를 산출합니다. 시즌 초 발주 시 베스트 사이즈(M/L)는 10~15% 여유분을 확보하고, 양 끝 사이즈(S/XXL)는 최소 수량만 발주 후 리오더로 대응합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","사이즈","구성비","발주"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '마크다운(할인) 전략과 타이밍',
'효과적인 마크다운 전략은 단계적 할인이 핵심입니다. 1차 마크다운(출시 8주 후): 20~30% — 트래픽 유도, 2차 마크다운(12주 후): 40~50% — 재고 소진 촉진, 3차 마크다운(시즌말): 50~70% — 잔여 재고 정리. 마크다운 시 주의점: 1) 너무 이른 할인은 정가 판매 기회 손실, 2) 할인폭이 20% 미만이면 고객 반응 저조, 3) 마크다운 상품의 진열 위치를 변경하여 신상품과 구분, 4) 마크다운 예산은 전체 매출의 5~8%가 적정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["마크다운","할인","재고소진","타이밍"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'fnb', 'F&B 메뉴 엔지니어링',
'메뉴 엔지니어링은 인기도(판매량)와 수익성(공헌이익)을 기준으로 메뉴를 4가지로 분류합니다. Star(인기高-수익高): 현 위치 유지, 메뉴판 강조, Plow Horse(인기高-수익低): 원가 절감 또는 가격 인상, Puzzle(인기低-수익高): 위치/설명 개선으로 판매 촉진, Dog(인기低-수익低): 단종 검토. 메뉴판에서 Star와 Puzzle 메뉴는 우측 상단(시선이 가장 먼저 가는 곳)에 배치하고, 사진과 추천 마크를 추가합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","메뉴엔지니어링","수익성","인기도"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'beauty', '뷰티 상품 유통기한 관리(FEFO)',
'화장품은 개봉 후 사용기한이 있어 FEFO(First Expired, First Out) 원칙을 적용합니다. 유통기한 관리 기준: 잔여 1/3 시기에 프로모션 적용, 잔여 1/6 시기에 테스터 전환 또는 직원 판매. 선크림/마스크팩 등 시즌성 제품은 시즌 종료 2개월 전 할인 시작. 재고 관리 시스템에 유통기한 알림을 설정하여 30일/60일/90일 전 자동 알림을 받습니다. 반품률을 3% 이내로 관리하는 것이 목표입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","유통기한","FEFO","재고"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'department_store', '백화점 PB(Private Brand) 상품 전략',
'백화점 PB 상품은 높은 마진율(일반 40~50% vs PB 60~70%)과 차별화를 제공합니다. 성공적인 PB 전략: 1) 식품관 PB(프리미엄 간편식, 델리)부터 시작 — 진입장벽 낮음, 2) 품질은 NB(National Brand) 동등 이상, 가격은 20~30% 저렴하게, 3) 패키지 디자인에 투자하여 프리미엄 이미지 구축, 4) 온라인 전용 PB로 옴니채널 차별화. PB 매출 비중 목표는 전체의 15~25%가 적정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","PB","마진","브랜드"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '크로스셀링과 업셀링 상품 전략',
'크로스셀링(교차판매)은 연관 상품을 함께 제안하여 객단가를 높이는 전략입니다. 예: 셔츠 구매 고객에게 넥타이 제안(전환율 15~25%). 업셀링은 상위 제품을 제안하는 것으로, 가격 차이 20~30% 이내일 때 수락률이 가장 높습니다. POS 데이터에서 동시구매 패턴(장바구니 분석)을 추출하여 연관 상품 진열에 반영합니다. AI 기반 추천 시스템 도입 시 크로스셀 매출이 35% 증가한 사례가 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["크로스셀링","업셀링","객단가","AI추천"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'lifestyle', '라이프스타일 매장 상품 큐레이션 전략',
'라이프스타일 매장은 카테고리 중심이 아닌 테마/스토리 중심으로 상품을 구성합니다. 효과적인 큐레이션 원칙: 1) 메인 테마는 월별로 교체(예: 3월 "봄맞이 홈가드닝"), 2) 가격대를 3단계(엔트리 1~3만원, 미드 5~10만원, 프리미엄 15만원+)로 구성, 3) 대형 앵커 상품(가구, 가전)과 소형 임펄스 상품(소품, 캔들)을 혼합 배치, 4) 로컬 크리에이터 상품을 20~30% 포함하여 차별화. 큐레이션 변경 주기는 2~4주가 최적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","큐레이션","테마","로컬"],"difficulty":"intermediate"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 4: marketing (마케팅)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '프로모션 효과 측정 ROI 계산법',
'프로모션 ROI = (프로모션 기간 추가 매출이익 - 프로모션 비용) ÷ 프로모션 비용 × 100. 정확한 측정을 위해 기저 매출(Base Sales)을 제외해야 합니다. 기저 매출은 직전 4주 평균 또는 전년 동기 대비로 산출합니다. 업종별 프로모션 ROI 벤치마크: 패션 150~300%, F&B 100~200%, 화장품 200~400%. ROI가 100% 미만이면 프로모션 재설계가 필요하며, 장기적으로는 브랜드 가치 훼손 여부도 함께 평가합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["프로모션","ROI","효과측정","기저매출"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '멤버십 프로그램 설계 원칙',
'효과적인 멤버십 프로그램의 핵심 요소: 1) 가입 즉시 혜택(웰컴 쿠폰 10~15% — 가입 전환율 60% 이상), 2) 포인트 적립률 3~5%(고객 체감 최소선), 3) 등급제(3~4등급 — 실버/골드/VIP/VVIP), 4) 등급별 차별화된 혜택(전용 세일, 무료 수선, 발레파킹 등), 5) 포인트 유효기간 12~24개월. VIP 등급 기준은 상위 5~10% 고객이 되도록 설정하며, 등급 유지/강등 기준을 명확히 공지합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["멤버십","포인트","등급제","CRM"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '옴니채널 마케팅 전략',
'옴니채널은 온라인과 오프라인의 경계 없는 쇼핑 경험을 제공하는 전략입니다. 핵심 시나리오: 1) BOPIS(Buy Online Pick-up In Store) — 온라인 주문 후 매장 픽업(추가구매율 30%), 2) 매장 내 온라인 연동 — 품절 상품 온라인 주문 후 자택 배송, 3) 통합 포인트/멤버십 — 채널 무관 적립/사용, 4) 앱 기반 매장 내 경험 — 상품 스캔, 리뷰 확인, 재고 조회. 옴니채널 고객의 LTV(생애가치)는 단일채널 고객의 1.5~2배입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["옴니채널","BOPIS","온오프연동","LTV"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '로컬 마케팅 전략 — 상권 분석 기반',
'효과적인 로컬 마케팅은 상권 분석에서 시작됩니다. 1차 상권(도보 5분, 반경 300m)의 거주/근무 인구, 유동 인구를 파악하고 타겟 고객의 라이프스타일에 맞는 전략을 수립합니다. 지역 기반 마케팅 방법: 1) 네이버 플레이스/카카오맵 최적화(리뷰 관리), 2) 지역 인플루언서(팔로워 1~5만) 협업, 3) 주변 상점과 크로스 프로모션, 4) 아파트/오피스 전단지 + QR코드 쿠폰(반응률 2~5%), 5) 지역 축제/행사 참여 및 팝업.',
'{"source":"NeuralTwin Knowledge Base","tags":["로컬마케팅","상권분석","네이버플레이스","인플루언서"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', 'SNS 마케팅 채널별 전략',
'채널별 리테일 마케팅 전략: 인스타그램 — 비주얼 중심, 매장/상품 사진, 릴스(쇼트폼), 해시태그 전략(지역명+업종). 카카오톡 — 플러스친구 메시지(오픈율 40~60%), 쿠폰 발송, 예약 알림. 네이버 블로그 — SEO 최적화, 체험단 리뷰, 매장 스토리. 유튜브 — 매장 비하인드, 스타일링 팁, ASMR. TikTok — MZ세대 타겟, 챌린지, 트렌드 참여. 채널당 주 3~5회 포스팅이 적정하며, 일관된 브랜드 톤앤매너를 유지합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["SNS","인스타그램","카카오톡","마케팅채널"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'fashion', '패션 리테일 시즌 마케팅 전략',
'패션 리테일의 주요 마케팅 시점: 1) 시즌 런칭(S/S 2~3월, F/W 8~9월) — VIP 사전 공개 이벤트, 2) 중간 시즌(5월, 10월) — 신규 컬렉션 추가, 스타일링 이벤트, 3) 시즌오프(1월, 7월) — 할인 세일, 재고 소진, 4) 블프/연말(11~12월) — 연중 최대 세일. 각 시점마다 2주 전 SNS 티저 → 1주 전 VIP 사전 알림 → D-day 전 채널 동시 캠페인의 3단계로 진행합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","시즌마케팅","VIP","세일"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'beauty', '뷰티 체험 마케팅 전략',
'뷰티 업계에서 체험 마케팅은 가장 효과적인 고객 전환 수단입니다. 주요 전략: 1) 무료 메이크업 서비스(구매 전환율 70%), 2) 스킨케어 체험 부스(신제품 런칭 시), 3) 뷰티 클래스(월 1~2회, 참가비 제품 가격으로 전환), 4) 맞춤 진단 서비스(피부 타입, 퍼스널 컬러), 5) SNS 리뷰 이벤트(체험 후 리뷰 작성 시 미니어처 증정). 체험 마케팅 후 3일 이내 후속 연락(감사 메시지+추가 혜택)이 재구매율을 35% 높입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","체험마케팅","메이크업","스킨케어"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'fnb', 'F&B 배달 플랫폼 마케팅 최적화',
'배달 플랫폼(배민, 쿠팡이츠, 요기요) 매출은 F&B 매장 전체의 30~50%를 차지합니다. 플랫폼 최적화: 1) 메뉴 사진 전문 촬영(클릭률 2배), 2) 메뉴명에 인기 키워드 포함("매콤달콤", "수제"), 3) 리뷰 관리 — 부정 리뷰 24시간 내 응대, 4) 배달 전용 메뉴 개발(포장 적합, 원가 최적화), 5) 울트라콜/광고 ROI 주간 분석. 배달 수수료(12~15%)를 감안한 별도 가격 정책이 필요하며, 자체 앱/웹 주문은 5~10% 할인으로 유도합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","배달","배민","플랫폼"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'department_store', '백화점 VIP 마케팅 전략',
'백화점 VIP 고객(상위 3~5%)이 전체 매출의 30~40%를 기여합니다. VIP 마케팅 핵심: 1) 전담 퍼스널 쇼퍼 배정, 2) 시즌 프리뷰 초대(일반 고객 2주 전 공개), 3) 발레파킹, VIP 라운지, 무료 수선 등 프리미엄 서비스, 4) 문화/예술 행사 초대(전시, 콘서트), 5) 생일/기념일 특별 선물, 6) 해외 명품 직구 대행. VIP 이탈 방지를 위해 월 구매액이 전월 대비 30% 이상 감소 시 윈백 캠페인을 자동 실행합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","VIP","퍼스널쇼퍼","프리미엄"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '리테일 CRM 데이터 활용 마케팅',
'CRM 데이터 기반 마케팅의 핵심 지표: 1) 고객 생애 가치(CLV) = 평균 구매액 × 구매 빈도 × 유지 기간, 2) 고객 획득 비용(CAC), 3) CLV/CAC 비율(3:1 이상이 건강), 4) 이탈률(월 5% 이하 목표). 데이터 활용 시나리오: 구매 이력 기반 개인화 추천 메시지(일반 DM 대비 전환율 3배), 방문 주기 분석 기반 적시 알림, 장바구니 이탈 고객 리타겟팅(72시간 내 10% 쿠폰 발송 시 회수율 25%).',
'{"source":"NeuralTwin Knowledge Base","tags":["CRM","CLV","CAC","개인화"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'lifestyle', '라이프스타일 브랜드 팝업스토어 전략',
'팝업스토어는 라이프스타일 브랜드의 핵심 마케팅 전략으로, 2~4주 단기 운영이 일반적입니다. 성공 요소: 1) 인스타그래머블한 공간 디자인(포토존 3곳 이상), 2) 한정판/콜라보 상품(희소성), 3) 체험 프로그램(워크숍, 시식), 4) 위치 선정(성수동, 한남동, 연남동 등 트렌드 상권), 5) 사전 SNS 버즈 생성(2주 전부터). 팝업 투자 대비 효과는 직접 매출보다 브랜드 인지도와 SNS 콘텐츠 생성으로 측정하며, 노출 대비 효율(CPM)로 평가합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","팝업스토어","브랜드","SNS"],"difficulty":"intermediate"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 5: staff_management (인력 관리)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '매장 인력 배치 최적화 원칙',
'인력 배치는 시간대별 고객 트래픽 데이터에 기반해야 합니다. 기본 공식: 필요 직원 수 = 시간당 예상 고객 수 ÷ 직원 1인당 응대 가능 고객 수. 업종별 기준: 패션 — 직원 1인당 동시 응대 3~4명, 뷰티 — 1:1~1:2(상담 집중), F&B — 홀 직원 1인당 테이블 4~6개. 피크 타임(주말 14~18시)에는 평시 대비 1.5~2배 인력을 배치하고, 비수기 평일 오전에는 최소 인원으로 운영합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["인력배치","트래픽","피크타임","최적화"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '신입 직원 온보딩 프로그램',
'효과적인 온보딩은 첫 90일이 핵심이며, 3단계로 구성합니다. 1단계(1~2주): 브랜드 가치/역사, 상품 지식, POS 운영, 기본 접객 매뉴얼. 2단계(3~4주): 선배 직원 동행 OJT, 실전 접객 시작, 일일 피드백. 3단계(5~12주): 독립 운영, 주간 1:1 코칭, 성과 목표 설정. 체계적 온보딩을 받은 직원의 6개월 내 퇴직률은 25%로, 비체계적 온보딩(퇴직률 50%) 대비 절반 수준입니다. 디지털 교육 자료(영상, 퀴즈)를 활용하면 교육 시간을 30% 단축할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["온보딩","교육","OJT","퇴직률"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '직원 성과 측정 KPI 체계',
'매장 직원의 성과 KPI는 정량/정성 지표를 혼합합니다. 정량 지표: 1) 개인 매출액(전체의 40%), 2) 접객 건수(20%), 3) 객단가(15%), 4) 부가 판매율(크로스셀, 10%). 정성 지표: 5) 고객 만족도 — 미스터리 쇼퍼 점수(10%), 6) 팀워크 — 동료 평가(5%). KPI는 월 단위로 평가하되, 일일 대시보드로 실시간 현황을 공유합니다. 인센티브는 개인 성과 70% + 팀 성과 30%로 설계하여 경쟁과 협력의 균형을 잡습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["KPI","성과측정","인센티브","미스터리쇼퍼"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '시프트(근무 교대) 스케줄링',
'효율적인 시프트 스케줄링은 법정 근로시간(주 40시간, 연장 12시간)을 준수하면서 피크 타임을 커버해야 합니다. 일반적인 패턴: 오픈 시프트(09:30~18:30), 미들 시프트(11:00~20:00), 클로징 시프트(13:00~22:00). 주말/공휴일 근무자에게 평일 대체 휴무를 보장하고, 월 스케줄은 2주 전에 확정하여 공유합니다. AI 기반 자동 스케줄링 도구를 도입하면 직원 만족도 15% 향상, 인건비 5~8% 절감 효과가 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["시프트","스케줄링","근로시간","자동화"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '접객 서비스 매뉴얼 핵심 요소',
'접객 매뉴얼은 5단계 서비스 플로우로 구성합니다. 1) 인사(고객 입장 5초 내 아이컨택 + 미소 + 인사), 2) 니즈 파악(개방형 질문 — "어떤 것을 찾으시나요?"), 3) 상품 제안(3가지 이내 추천, 특징과 혜택 설명), 4) 클로징(구매 결정 지원, 추가 상품 제안), 5) 배웅(감사 인사, 재방문 유도). 접객 품질은 미스터리 쇼퍼 평가(분기 1회)로 점검하며, 80점 미만 직원은 재교육을 실시합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["접객","서비스","매뉴얼","미스터리쇼퍼"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'fashion', '패션 매장 스타일리스트 역할 정의',
'패션 매장의 스타일리스트(고급 접객 전문 직원)는 단순 판매를 넘어 토탈 코디네이션을 제안합니다. 핵심 역량: 1) 트렌드 분석 능력(매주 패션 미디어 리서치), 2) 체형별/TPO별 스타일링 지식, 3) 고객별 스타일 프로필 관리(CRM 기록), 4) VIP 고객 전담 관리(신상품 입고 시 개인 연락). 스타일리스트가 접객한 고객의 객단가는 일반 접객 대비 2~3배 높으며, 재방문율도 40% 이상 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","스타일리스트","접객","VIP"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'fnb', 'F&B 매장 주방-홀 커뮤니케이션',
'주방과 홀 간 원활한 커뮤니케이션은 서비스 품질의 핵심입니다. 핵심 시스템: 1) KDS(Kitchen Display System) — 주문 자동 전달, 조리 시간 표시, 2) 서빙 벨/호출 시스템, 3) 86 보드(품절 메뉴 실시간 공유), 4) 피크 타임 전 브리핑(10분, 예약 현황/특이사항/품절 메뉴). 주방-홀 미스커뮤니케이션으로 인한 오더 에러율은 3% 이하를 목표로 하며, 에러 발생 시 즉시 고객 사과 + 보상(디저트/음료 제공)을 원칙으로 합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","주방","홀","커뮤니케이션","KDS"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'beauty', '뷰티 어드바이저(BA) 교육 체계',
'뷰티 어드바이저는 제품 지식뿐 아니라 피부과학, 메이크업 기술을 갖추어야 합니다. 교육 체계: 1) 신입(1개월): 피부 기초 과학, 브랜드 제품 전 라인 숙지, 기본 메이크업 실습, 2) 중급(3~6개월): 고객 피부 진단, 맞춤 추천 기법, 트러블 대응, 3) 고급(6개월+): 퍼스널 컬러 진단, 스킨케어 루틴 설계, VIP 전담. 분기별 신제품 교육은 필수이며, 브랜드 본사 교육 참여율이 높은 매장의 매출이 평균 20% 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","BA","교육","피부과학"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '직원 동기부여와 리텐션 전략',
'리테일 업계 평균 퇴직률은 연 60~70%로 매우 높습니다. 리텐션 전략: 1) 경쟁력 있는 급여(업계 평균 대비 10%+ 필요), 2) 명확한 커리어 패스(스태프→시니어→부점장→점장, 평균 3~5년), 3) 즉시 보상 — 우수 접객 시 당일 칭찬 + 소액 보너스, 4) 자율성 부여 — VMD, 상품 추천 등 의사결정 권한, 5) 워크라이프 밸런스 — 희망 휴무일 반영률 80% 이상, 6) 팀 빌딩 — 분기 1회 회식/워크숍. 직속 상사와의 관계가 퇴직 사유 1위(42%)이므로 점장 리더십 교육이 핵심입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["리텐션","동기부여","퇴직률","커리어패스"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'department_store', '백화점 매장 직원 에티켓 기준',
'백화점 직원 에티켓은 브랜드 이미지의 직접적 표현입니다. 필수 기준: 1) 복장 — 정장 또는 브랜드 유니폼, 깔끔한 헤어/메이크업, 네임택 착용, 2) 인사 — 15도 목례(일반), 30도 허리 인사(VIP), 3) 언어 — 존댓말 사용, 쿠션어("혹시", "괜찮으시다면") 활용, 4) 핸드폰 — 매장 내 사용 금지, 5) 대기 자세 — 팔짱/주머니에 손 금지, 자연스러운 대기. 에티켓 위반 시 1차 구두 경고, 2차 서면 경고, 3차 인사 조치를 실시합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","에티켓","서비스","인사"],"difficulty":"basic"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 6: industry_trends (업계 트렌드)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '2025-2026 리테일 메가트렌드',
'2025~2026년 한국 리테일의 5대 메가트렌드: 1) AI 기반 초개인화 — 고객별 맞춤 추천, 동적 가격, AI 챗봇 상담, 2) 체험형 매장(Experience Store) — 판매보다 경험 중심, 팝업 확대, 3) 지속가능성(ESG) — 친환경 포장, 리필 스테이션, 업사이클링, 4) 하이퍼로컬 — 동네 기반 커뮤니티 커머스, 즉시 배달, 5) 디지털 트윈 — 매장의 디지털 복제본으로 최적화 시뮬레이션. 이 트렌드에 선제 대응하는 매장은 매출 성장률이 업계 평균 대비 2~3배 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["메가트렌드","2025","2026","AI","ESG"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', 'AI 매장(AI-Powered Store) 현황과 전망',
'AI 매장은 컴퓨터 비전, IoT 센서, 머신러닝을 결합하여 매장 운영을 자동화합니다. 핵심 기술: 1) 고객 트래픽 분석(WiFi/카메라), 2) AI 수요 예측(재고 자동 발주), 3) 동적 가격 조정(실시간 수요 반영), 4) 챗봇/키오스크 무인 응대, 5) 컴퓨터 비전 기반 매대 관리(빈 선반 감지). 한국 시장에서 AI 기술 도입 매장은 2024년 전체의 8%에서 2026년 25%로 급증 전망이며, 매출 대비 운영비를 평균 15~20% 절감합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["AI","스마트매장","컴퓨터비전","자동화"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '무인매장(Unmanned Store) 운영 모델',
'무인매장은 인건비 절감과 24시간 운영이 가능하지만, 업종에 따라 적합도가 다릅니다. 성공 사례: 편의점(CU, GS25 무인점), 빨래방, 스터디카페, 아이스크림 할인점. 핵심 기술: 1) 출입 인증(QR/앱/카드), 2) 셀프 결제(키오스크/앱), 3) CCTV + AI 모니터링, 4) IoT 센서(냉장고 온도, 재고). 순수 무인 매장보다 "저인원 매장"(주간 1명 + 야간 무인)이 현실적이며, 도난율은 유인 매장 대비 2~3배 높아 보안 투자가 필수입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["무인매장","자동화","셀프결제","보안"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '체험형 매장(Experience Store) 트렌드',
'체험형 매장은 제품 판매보다 브랜드 경험을 제공하여 고객 관계를 구축하는 전략입니다. 대표 사례: 나이키 하우스 오브 이노베이션(커스터마이징 체험), 다이슨 데모 스토어(전 제품 체험), 젠틀몬스터(아트 갤러리형 매장). 핵심 요소: 1) SNS 공유 유발 공간 디자인, 2) 인터랙티브 체험(터치/VR/AR), 3) 한정 체험 프로그램, 4) 데이터 수집(체험 행동 분석). 체험형 매장의 고객당 마케팅 효율은 전통 광고 대비 5~10배 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["체험형매장","브랜드경험","인터랙티브","SNS"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '지속가능성(ESG) 리테일 전략',
'ESG(환경/사회/지배구조)는 MZ세대의 소비 기준으로 자리잡았습니다. 리테일 ESG 실천 방안: 1) 친환경 포장(종이/바이오 소재 전환, 포장재 50% 감축), 2) 리필 스테이션(세제, 샴푸 — 원가 20% 절감, 고객 유인 효과), 3) 의류 수거/리사이클 프로그램(H&M, 파타고니아 사례), 4) 로컬 소싱(지역 농산물, 수공예품), 5) 탄소 발자국 표시. ESG 활동을 적극 홍보하는 브랜드의 MZ세대 선호도가 35% 높으며, 프리미엄 가격 수용도도 15% 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["ESG","지속가능성","친환경","MZ세대"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'fashion', '패션 리테일 D2C(Direct-to-Consumer) 전환',
'D2C 전략은 유통 중간 단계를 줄이고 고객과 직접 소통하는 모델입니다. 한국 패션 D2C 성장률은 연 25~30%로, 전통 유통 채널(5~10%)을 크게 앞섭니다. D2C 핵심 역량: 1) 자체 온라인몰 운영(수수료 절감 15~30%), 2) SNS 커뮤니티 구축, 3) 고객 데이터 직접 확보(개인화 마케팅), 4) 플래그십 스토어(브랜드 경험 공간), 5) 빠른 피드백 루프(기획~출시 4주). 무신사, 29CM 등 패션 플랫폼과 자체몰을 병행하는 하이브리드 모델이 현실적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","D2C","온라인몰","플랫폼"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'fnb', 'F&B 고스트키친과 클라우드키친 트렌드',
'고스트키친(배달 전문 주방)은 임대료와 인건비를 대폭 절감합니다. 일반 매장 대비 초기 투자 60% 감소, 월 고정비 40% 절감. 클라우드키친은 하나의 주방에서 여러 브랜드를 동시 운영하는 모델로, 공유주방 입점 시 월 200~500만원으로 시작할 수 있습니다. 핵심 성공 요소: 1) 배달 최적화 메뉴(30분 후에도 맛/온도 유지), 2) 포장 디자인(브랜드 각인), 3) 배달 플랫폼 리뷰 관리, 4) 데이터 기반 메뉴 개발(주문 패턴 분석).',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","고스트키친","클라우드키친","배달"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'beauty', '뷰티 테크(Beauty Tech) 혁신 트렌드',
'뷰티 테크는 기술로 개인화된 뷰티 경험을 제공합니다. 주요 혁신: 1) AI 피부 진단(스마트폰 카메라로 피부 분석 → 맞춤 제품 추천), 2) AR 가상 메이크업(립/아이 컬러 시뮬레이션 — 구매 전환율 2.5배), 3) 맞춤 화장품 제조(현장에서 고객 피부에 맞는 세럼 배합), 4) 스마트 미러(매장 내 가상 체험), 5) 구독 모델(월 정기 배송 + 피부 상태 변화 추적). 아모레퍼시픽, LG생활건강 등 국내 대기업이 뷰티테크 R&D에 연 수백억을 투자 중입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티테크","AI","AR","피부진단"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'department_store', '백화점의 탈(脫)백화점 전략',
'전통 백화점이 복합 문화 공간으로 변화하고 있습니다. 더현대 서울은 실내 정원(사운즈 포레스트)과 팝업 공간으로 MZ세대 연간 방문 1억명을 달성했습니다. 변화 전략: 1) 임대 면적의 30~40%를 F&B/엔터테인먼트/문화로 전환, 2) 백화점 내 서점, 갤러리, 영화관 유치, 3) 팝업 전문 공간 상설화(월 2~3개 브랜드 교체), 4) 프리미엄 식품관 강화(그로서란트), 5) 옥상/루프탑 활용(가든, 카페). 체류시간이 평균 120분으로 전통 백화점(60분)의 2배입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","복합문화공간","더현대","MZ세대"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'lifestyle', '라이프스타일 매장의 커뮤니티 커머스 전환',
'라이프스타일 매장이 판매 공간에서 커뮤니티 허브로 진화하고 있습니다. 핵심 전략: 1) 매장을 커뮤니티 모임 공간으로 개방(독서모임, 러닝크루, 요가), 2) 로컬 크리에이터와 협업(입점/팝업), 3) 회원제 커뮤니티(월 구독료 2~5만원, 워크숍 무제한 참여), 4) 온라인 커뮤니티(카카오톡 오픈채팅, 인스타 커뮤니티)와 오프라인 연결. 커뮤니티 회원의 연간 구매액은 비회원 대비 3~5배 높으며, 자발적 구전(WOM) 효과로 마케팅 비용을 40% 절감합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","커뮤니티","구독","로컬"],"difficulty":"advanced"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 7: technology (기술)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', 'IoT 센서 기반 매장 분석 시스템',
'매장용 IoT 센서의 주요 유형: 1) WiFi 프로브 센서 — 고객 스마트폰의 WiFi 신호를 감지하여 방문자 수, 체류 시간, 재방문율 측정(정확도 85~90%), 2) BLE 비콘 — 앱 설치 고객에게 근접 마케팅 메시지 전송(반경 1~50m), 3) 적외선 인원 카운터 — 출입구 통과 인원 정확 측정(정확도 95%+), 4) 환경 센서(온도/습도/CO2/소음) — 쾌적도 모니터링. 센서 데이터를 클라우드에 통합하면 실시간 대시보드로 매장 현황을 파악하고 AI 분석까지 연계할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["IoT","WiFi프로브","BLE","센서"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', 'RFID 기술 리테일 적용',
'RFID(Radio-Frequency Identification)는 상품에 부착된 태그를 무선으로 인식하는 기술입니다. 리테일 활용: 1) 재고 실사 시간 90% 단축(바코드 대비), 2) 실시간 재고 파악(정확도 99%), 3) 도난 방지(EAS 기능 통합), 4) 셀프 체크아웃(태그 일괄 인식), 5) 스마트 피팅룸(옷 태그 인식 → 코디 추천 화면). 태그 단가가 개당 50~100원으로 하락하면서 유니클로, 자라 등 SPA 브랜드가 전 상품에 적용 중이며, 재고 정확도가 65%에서 98%로 향상되었습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["RFID","재고관리","도난방지","스마트피팅룸"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', 'POS 시스템 연동과 데이터 활용',
'최신 클라우드 POS는 단순 결제를 넘어 매장 운영 허브 역할을 합니다. 핵심 연동: 1) 재고 관리 — 판매 시 자동 차감, 안전 재고 알림, 2) CRM — 고객별 구매 이력, 선호 상품, 방문 주기, 3) 직원 관리 — 개인별 판매 실적, 근태, 4) 회계/세무 — 전자 영수증, 매출 자동 집계, 5) 본사 연동 — 다점포 통합 데이터. POS 데이터에서 시간대별 매출, 상품별 판매량, 결제 수단별 비중 등을 추출하여 운영 의사결정에 활용합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["POS","클라우드","CRM","데이터"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', '디지털 사이니지(Digital Signage) 활용',
'디지털 사이니지는 LCD/LED 디스플레이로 동적 콘텐츠를 표시하는 기술입니다. 매장 활용: 1) 쇼윈도 디스플레이(영상으로 시선 끌기, 종이 POP 대비 주목도 4배), 2) 가격표 전자 교체(ESL, 원격 일괄 변경), 3) 인터랙티브 카탈로그(터치스크린으로 상품 탐색), 4) 대기 순번 표시, 5) 실시간 프로모션 표시(시간대/날씨/재고 연동). CMS(콘텐츠 관리 시스템)로 본사에서 전 매장 콘텐츠를 원격 관리하며, 콘텐츠 교체 시간을 수일에서 수분으로 단축합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["디지털사이니지","ESL","인터랙티브","콘텐츠"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'fashion', '스마트 미러(Smart Mirror) 기술',
'스마트 미러는 거울에 디스플레이를 통합하여 가상 피팅, 상품 정보 표시, 코디 추천 등을 제공합니다. 핵심 기능: 1) AR 가상 피팅 — 옷을 입지 않고 가상으로 체험(패션 매장 피팅룸), 2) 뷰티 시뮬레이션 — 메이크업 색상/스타일 미리보기, 3) 코디 추천 — 현재 착장에 맞는 아이템 제안, 4) 사이즈 추천 — 체형 스캔 기반. 도입 비용은 대당 300~500만원이지만, 피팅룸 체류 시간 30% 증가, 교차 판매 20% 증가 효과가 있어 6~12개월 내 ROI 달성이 가능합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["스마트미러","AR","가상피팅","패션"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', '셀프 체크아웃과 모바일 결제',
'셀프 체크아웃(SCO)은 계산 대기 시간을 50~70% 단축합니다. 유형: 1) 키오스크형 SCO(대형마트, 편의점), 2) 스캔앤고(고객이 앱으로 상품 스캔 후 결제, 아마존고 방식), 3) 모바일 결제 전용 계산대(카카오페이, 네이버페이, 삼성페이). SCO 도입 시 인건비 20~30% 절감 가능하지만, 도난율 증가(1~3%)와 고령 고객 불편이 단점입니다. SCO와 유인 계산대를 6:4 비율로 혼합 운영하는 것이 최적이며, 도난 방지를 위해 랜덤 검수 시스템을 병행합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["셀프체크아웃","모바일결제","키오스크","SCO"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', '매장 WiFi 분석 시스템 구축',
'WiFi 분석 시스템은 고객의 스마트폰 WiFi 프로브 요청을 수집하여 방문 데이터를 추출합니다. 측정 가능 지표: 1) 일별/시간대별 방문자 수(Footfall), 2) 평균 체류 시간(Dwell Time), 3) 재방문율(Return Rate), 4) 바운스율(Bounce Rate — 5분 미만 체류), 5) 구역별 트래픽(다중 센서). 개인정보보호를 위해 MAC 주소는 비가역적 해시 처리하며, Wi-Fi 6E/7의 MAC 랜덤화에 대응하여 프로브 패턴 기반 식별 알고리즘을 적용합니다. 센서 1대당 커버리지는 반경 15~30m입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["WiFi","프로브","방문분석","개인정보"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'fnb', 'F&B 키오스크와 테이블 오더 시스템',
'키오스크/테이블 오더는 F&B 매장의 필수 인프라가 되었습니다. 효과: 1) 주문 정확도 향상(에러율 5%→0.5%), 2) 업셀링 자동화(추천 메뉴 팝업 — 추가 주문율 20%), 3) 인건비 절감(주문 인력 50% 감소), 4) 주문 데이터 자동 수집(메뉴별 인기도, 시간대, 옵션). 키오스크 도입 시 평균 객단가가 15~20% 상승하는 현상이 관찰되며, 이는 대면 주문 시 눈치 때문에 추가 주문을 꺼리는 심리적 장벽이 사라지기 때문입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","키오스크","테이블오더","자동화"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'beauty', '뷰티 AI 피부 진단 기술',
'AI 피부 진단은 스마트폰 카메라 또는 전용 스캔 장비로 피부 상태를 분석합니다. 분석 항목: 1) 수분도/유분도, 2) 모공 크기, 3) 주름 깊이, 4) 색소 침착, 5) 피부 톤 균일도, 6) 민감도. AI 모델은 수만 장의 피부 이미지로 학습되어 피부과 전문의 수준의 정확도(85~92%)를 달성합니다. 진단 결과에 기반한 맞춤 제품 추천은 구매 전환율을 45% 높이며, 고객 신뢰도를 크게 향상시킵니다. 진단 기기 가격은 100~500만원 수준입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","AI","피부진단","맞춤추천"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'department_store', '백화점 실내 측위(Indoor Positioning) 기술',
'실내 측위 기술은 GPS가 작동하지 않는 백화점 내부에서 고객/상품 위치를 추적합니다. 기술별 정확도: 1) BLE 비콘(1~3m), 2) UWB(10~30cm, 고정밀), 3) WiFi 삼각측량(3~5m), 4) 지자기 센서(2~3m). 활용 시나리오: 매장 내 네비게이션(고객 앱), 직원 위치 최적화, 상품 위치 추적, 구역별 체류 분석. 대형 백화점(영업면적 5만평+)에서 BLE 비콘 500~1000개 설치 시 전 층 커버가 가능하며, 설치 비용은 1~2억원 수준입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","실내측위","BLE","UWB"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', '클라우드 기반 매장 관리 플랫폼',
'SaaS형 매장 관리 플랫폼은 POS, 재고, CRM, 인사, 분석을 통합 제공합니다. 주요 장점: 1) 초기 투자 비용 최소화(월 구독 모델), 2) 다점포 실시간 통합 관리, 3) 자동 업데이트(신기능, 보안 패치), 4) API 연동(배달 플랫폼, 회계, SNS), 5) 모바일 접근(점주 앱으로 어디서든 모니터링). 도입 시 수기 업무가 70% 감소하고, 데이터 기반 의사결정 속도가 3배 빨라집니다. 한국 시장 주요 솔루션: 토스페이먼츠, 페이히어, 포스뱅크 등.',
'{"source":"NeuralTwin Knowledge Base","tags":["SaaS","클라우드","통합관리","플랫폼"],"difficulty":"basic"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 8: analytics (분석)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '리테일 핵심 KPI 해석법',
'리테일 매장의 5대 핵심 KPI: 1) 매출액(Sales) — 전년 동기 대비 성장률로 평가, 2) 객단가(ATV, Average Transaction Value) — 교차판매/업셀링 효과 측정, 3) 전환율(Conversion Rate) = 구매 고객수 ÷ 방문 고객수 — 매장 경쟁력 핵심 지표, 4) 평당 매출(Sales per sq.ft) — 공간 효율성 측정, 5) 재고 회전율(Inventory Turnover) — 자금 효율성. 각 KPI는 단독이 아닌 조합으로 해석해야 합니다. 예: 매출 증가 + 전환율 감소 = 고객은 늘었지만 경험 품질이 떨어진 것.',
'{"source":"NeuralTwin Knowledge Base","tags":["KPI","매출","전환율","객단가"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '전환율(Conversion Rate) 개선 전략',
'리테일 매장 평균 전환율은 20~30%이며, 업종별로 편의점 80%+, 패션 15~25%, 가구/가전 5~10%로 차이가 큽니다. 전환율 개선 7가지 전략: 1) 접객 품질 향상(+5~10%), 2) 매장 레이아웃 최적화(+3~5%), 3) 가격 전략 개선(명확한 가격 표시, +2~4%), 4) 피팅룸/체험 공간 확충(+5~8%), 5) 재고 충실도(품절 방지, +3~5%), 6) 결제 편의성(대기 시간 단축, +2~3%), 7) 시즌/이벤트 프로모션(+10~15%). 전환율 1%p 개선이 매출 3~5% 증가로 이어집니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["전환율","개선","접객","레이아웃"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '히트맵 데이터 분석 실전 가이드',
'매장 히트맵 분석의 5단계 프로세스: 1) 데이터 수집(WiFi/카메라/BLE, 최소 2주분), 2) 시각화(평면도 위에 밀집도 오버레이, 빨강=고밀집, 파랑=저밀집), 3) 패턴 발견(피크/비피크, 요일별, 이벤트 전후 비교), 4) 문제 구역 식별(데드존, 병목 구간, 이탈 포인트), 5) 개선 액션(상품 재배치, 사이니지 추가, 동선 변경). 히트맵 기반 매장 리뉴얼 후 평균 매출 향상률은 8~15%이며, 3~6개월 후 재측정하여 효과를 검증합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["히트맵","분석","데이터","리뉴얼"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', 'A/B 테스트 매장 적용 방법',
'A/B 테스트는 두 가지 변수 중 더 효과적인 것을 데이터로 검증하는 방법입니다. 매장 적용 예: 1) VMD A vs B(2주씩 교차 적용, 매출 비교), 2) POP 디자인(좌측 vs 우측 배치), 3) BGM 장르(재즈 vs 팝, 체류 시간 비교), 4) 조명 색온도(3000K vs 4000K), 5) 가격 표시 방식(할인 전 가격 함께 표시 vs 할인가만). 유효한 결과를 위해 최소 2주간, 동일 조건(요일, 시간대)에서 테스트하며, 통계적 유의성(p < 0.05)을 확인해야 합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["AB테스트","실험","통계","VMD"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '매출 분석 — 시계열 분해법',
'매출 시계열 데이터는 추세(Trend), 계절성(Seasonality), 순환(Cycle), 불규칙(Irregular) 4가지 성분으로 분해됩니다. 추세는 3~6개월 이동평균으로 파악하고, 계절성은 전년 동기 대비로 분석합니다. 주간 패턴(주말 피크), 월간 패턴(월초 급여일 효과), 연간 패턴(명절, 시즌)을 분리하면 순수한 성장/하락 추세를 정확히 파악할 수 있습니다. AI 예측 모델(Prophet, ARIMA)을 적용하면 2~4주 후 매출을 85~90% 정확도로 예측하여 인력/재고 계획에 활용합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["매출분석","시계열","계절성","예측"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '객단가(ATV) 향상 분석과 전략',
'객단가 = 총매출 ÷ 구매건수. 객단가를 분해하면 "상품 단가 × 구매 점수(UPT, Units Per Transaction)"입니다. 객단가 향상 전략: 1) 세트 판매(번들링) — 개별 구매 대비 10~15% 할인하되 총액 증가, 2) 업셀링 — 상위 제품 추천("이 가격에 이 기능까지!"), 3) 크로스셀 — 연관 상품 진열/추천, 4) 최소 구매 조건 혜택("5만원 이상 무료배송"), 5) POP/사이니지 — "함께 구매하면 좋은 상품" 표시. UPT가 1.2에서 1.5로 증가하면 객단가가 25% 상승합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["객단가","ATV","UPT","업셀링"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'fashion', '패션 리테일 판매율(Sell-Through Rate) 분석',
'판매율 = 판매 수량 ÷ 입고 수량 × 100. 패션 업계 벤치마크: 시즌 중 60~70% (양호), 80%+ (우수), 50% 미만 (재고 과다). 주간 판매율 추적이 중요하며, 입고 4주차에 판매율 30% 미만이면 마크다운 또는 위치 이동을 즉시 실행합니다. 스타일/색상/사이즈별 판매율을 분석하면 다음 시즌 발주 최적화에 활용할 수 있습니다. 예: 블랙 색상 판매율 80% → 다음 시즌 블랙 비중 확대, 파스텔 30% → 비중 축소.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","판매율","마크다운","발주"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'fnb', 'F&B 식재료 원가율 분석',
'F&B 업계의 식재료 원가율(Food Cost) 적정 범위는 25~35%이며, 업태별로 다릅니다. 한식 30~35%, 양식 25~30%, 카페 15~25%, 베이커리 20~30%. 원가율 관리: 1) 레시피 표준화(정량 계량), 2) 식재료 로스율 5% 이하 관리, 3) 메뉴 엔지니어링(저원가+고인기 메뉴 강화), 4) 발주 최적화(수요 예측 기반), 5) 재고 실사(주 1회). 원가율 1%p 감소가 순이익 5~10% 증가로 이어지므로, 일별 원가율 모니터링 시스템 구축을 권장합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","원가율","식재료","레시피"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '고객 만족도(NPS) 측정과 활용',
'NPS(Net Promoter Score) = 추천자(9~10점) 비율 - 비추천자(0~6점) 비율. NPS 벤치마크: 50+ (우수), 30~50 (양호), 0~30 (개선 필요), 0 미만 (위기). 측정 방법: 구매 후 SMS/앱 설문(응답률 10~20%), 매장 내 태블릿(응답률 5~10%), QR코드 설문(응답률 3~5%). NPS 결과를 매장별/직원별/시간대별로 분석하면 구체적인 개선 포인트를 발견할 수 있습니다. NPS 10점 상승은 매출 7~12% 증가와 상관관계가 있으며, 비추천자의 피드백이 가장 가치 있는 개선 자료입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["NPS","고객만족도","설문","피드백"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '대시보드 설계 원칙 — 매장 운영용',
'효과적인 매장 운영 대시보드 설계 원칙: 1) 한 화면에 핵심 KPI 5~7개만 표시(정보 과부하 방지), 2) 실시간 데이터와 비교 기준(전일/전주/전년) 병행 표시, 3) 색상 코딩 — 초록(목표 달성), 노랑(주의), 빨강(미달), 4) 드릴다운 기능(전체→매장→카테고리→상품 단계), 5) 모바일 반응형(점장이 현장에서 확인), 6) 알림 시스템(KPI 임계값 초과 시 즉시 알림). 점장은 오전 오픈 시 일일 리포트, 주 1회 주간 분석을 확인하는 루틴을 권장합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["대시보드","KPI","데이터시각화","모바일"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'beauty', '뷰티 매장 상담 전환율 분석',
'뷰티 매장의 핵심 퍼널: 입장 → 테스터 체험 → 상담 요청 → 상담 완료 → 구매. 각 단계별 벤치마크: 입장→체험 40~60%, 체험→상담 20~30%, 상담→구매 50~70%. 전체 전환율(입장→구매) 15~25%가 양호합니다. 분석 시 평일/주말, 시간대별, BA(Beauty Advisor)별로 세분화하면 성과 차이의 원인을 파악할 수 있습니다. 상담 전환율이 높은 BA의 행동 패턴(대화 시작 방식, 제품 추천 개수, 샘플 제공 여부)을 분석하여 교육에 반영합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","전환율","퍼널","BA"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'department_store', '백화점 매장별 평당 효율 비교 분석',
'평당 매출(Sales per Pyeong)은 백화점 매장 효율의 핵심 지표입니다. 계산: 월 매출 ÷ 영업 면적(평). 벤치마크: 명품 브랜드 800~1500만원/평, 화장품 400~800만원/평, 여성복 200~400만원/평, 남성복 150~300만원/평. 평당 효율이 하위 20%인 매장은 브랜드 교체 또는 면적 조정을 검토합니다. 분석 시 위치(에스컬레이터 앞, 코너 등), 층, 브랜드 인지도를 함께 고려해야 공정한 비교가 가능합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","평당매출","효율","벤치마크"],"difficulty":"advanced"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 9: compliance (규정 준수)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '개인정보보호법과 리테일 — 고객 데이터 수집 기준',
'개인정보보호법(PIPA)에 따라 매장에서 고객 데이터를 수집할 때 반드시 준수해야 할 사항: 1) 수집 목적 명시 및 동의 획득(멤버십 가입 시), 2) 최소 수집 원칙(필수: 이름/연락처, 선택: 생년월일/성별), 3) 보유 기간 명시(일반 3년, 탈퇴 시 즉시 파기), 4) 제3자 제공 시 별도 동의, 5) 개인정보 처리방침 게시. WiFi 프로브 데이터는 MAC 주소를 비가역적 해시 처리하면 개인정보에 해당하지 않으나, CCTV 영상은 개인정보로 별도 고지가 필요합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["개인정보보호","PIPA","데이터수집","동의"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', 'CCTV 설치 및 운영 규정',
'매장 내 CCTV 설치는 개인정보보호법과 관련 규정을 준수해야 합니다. 필수 사항: 1) 설치 목적(방범/안전) 명시, 2) 출입구에 안내판 부착(촬영 중 표시, 관리자 연락처), 3) 녹화 영상 보존기간 30일 이내(목적 달성 후 즉시 파기), 4) 영상 열람 요청 시 10일 내 응대, 5) 탈의실/화장실 등 사적 공간 설치 금지, 6) 영상 데이터 암호화 저장. AI 영상 분석 시 개인 식별이 불가능하도록 익명화 처리(블러, 실루엣)를 적용하면 개인정보 이슈를 최소화할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["CCTV","개인정보","영상","안내판"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '매장 소방 안전 규정',
'매장 소방 안전 필수 사항: 1) 소화기 — 바닥면적 33㎡당 1개, 보행 거리 20m 이내 배치, 2) 스프링클러 — 영업면적 1000㎡ 이상 의무(지하 500㎡), 3) 비상구 — 2개 이상, 폭 75cm 이상, 항시 개방 가능, 4) 비상 조명 — 정전 시 20분 이상 점등, 5) 피난 안내도 — 각 층 출입구에 게시, 6) 소방 훈련 — 연 2회 이상(정기/불시). 소방 점검은 월 1회 자체 점검, 연 1회 전문 업체 종합 점검을 실시하며, 점검 기록을 2년간 보관합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["소방","안전","비상구","소화기"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '매장 접근성(Accessibility) 기준',
'장애인 편의시설 설치 의무 기준: 1) 출입구 — 유효 폭 80cm 이상, 자동문 또는 레버형 손잡이, 턱 2cm 이하, 2) 경사로 — 기울기 1/12 이하, 미끄럼 방지, 3) 통로 — 폭 120cm 이상, 4) 화장실 — 장애인용 1개 이상(1층 또는 엘리베이터 접근 가능 층), 5) 점자 안내 — 주요 안내판에 점자 병기, 6) 주차 — 장애인 전용 주차장(전체의 2~4%). 영업면적 300㎡ 이상 매장은 의무 적용이며, 위반 시 과태료 300만원 이하입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["접근성","장애인","편의시설","법규"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'fnb', 'F&B 위생 관리 법적 기준',
'식품위생법 준수 사항: 1) 건강진단 — 전 직원 연 1회 건강진단서 구비, 2) 위생교육 — 신규 8시간, 연 4시간 이상, 3) HACCP 인증 — 연매출 1억 이상 의무(단계적 확대), 4) 냉장 보관 온도 5°C 이하, 냉동 -18°C 이하, 5) 교차 오염 방지 — 생식/조리 도마 분리, 6) 유통기한 표시 — 소분 식재료에도 날짜 기재, 7) 식품 이력 추적 — 식재료 입고 기록 1년 보관. 위반 시 영업정지(1차 15일, 2차 1개월, 3차 폐쇄) 처분을 받을 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","위생","HACCP","식품위생법"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '근로기준법 — 매장 운영 관련 핵심',
'매장 운영 시 준수해야 할 근로기준법 핵심: 1) 근로시간 — 주 40시간, 연장근로 주 12시간 한도, 2) 휴게시간 — 4시간당 30분, 8시간당 1시간, 3) 주휴수당 — 주 15시간 이상 근무 시 유급 휴일, 4) 야간수당 — 22시~06시 통상임금의 50% 가산, 5) 공휴일 — 5인 이상 사업장 유급 적용, 6) 연차 — 1년 이상 근무 시 15일(월 1일씩 발생), 7) 최저임금 준수(2026년 10,030원). 아르바이트도 4대 보험 가입 의무(주 15시간 이상)입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["근로기준법","근로시간","주휴수당","최저임금"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '전자상거래법 — 옴니채널 매장 준수사항',
'온라인과 오프라인을 연결하는 옴니채널 매장의 전자상거래법 준수사항: 1) 청약 철회 — 배송 상품 수령 후 7일 내 환불(매장 픽업 포함), 2) 가격 표시 — 온·오프라인 가격 차이 시 명확히 고지, 3) 개인정보 — 온라인 회원과 오프라인 멤버십 통합 시 별도 동의, 4) 전자결제 — PG사 인증/보안 기준 충족, 5) 분쟁해결 — 온라인 고객 상담 채널 의무 운영(평일 근무시간 내). 소비자원 피해 구제 접수 시 14일 내 회신이 필요합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["전자상거래법","옴니채널","환불","소비자보호"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'beauty', '화장품법 — 뷰티 매장 필수 규정',
'화장품법 준수사항: 1) 화장품 표시 — 전성분 표시 의무, 제조번호, 사용기한, 2) 기능성 화장품(미백, 주름, 자외선차단) — 식약처 심사 필수, 3) 테스터 관리 — 1회용 도구 비치, 위생 관리 기록, 4) 반품/교환 — 미개봉 제품 14일 내 환불, 개봉 후 내용물 이상 시 환불, 5) 맞춤형 화장품 — 맞춤형화장품판매업 신고 필수, 조제관리사 배치, 6) 수입화장품 — 수입실적보고, 한글 라벨 부착. 2026년부터 동물실험 화장품 판매 금지가 전면 시행됩니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","화장품법","규정","전성분표시"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'department_store', '대규모점포 등록 및 영업 규제',
'대규모점포(매장면적 3000㎡ 이상) 규제사항: 1) 등록 — 시장/군수/구청장에게 대규모점포 등록 의무, 2) 영업시간 — 자정~오전 10시 영업 제한(지자체 조례), 3) 의무 휴업일 — 월 2회(매월 둘째/넷째 일요일 또는 조례로 지정), 4) 전통시장 상생 — SSM(기업형 슈퍼마켓) 1km 이내 출점 제한, 5) 지역 상생 기금 출연(자발적), 6) 주차 시설 — 매장면적 150㎡당 1대. 의무휴업일 위반 시 3000만원 이하 과태료가 부과됩니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","대규모점포","영업규제","의무휴업"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '매장 내 안전사고 예방 및 대응',
'매장 내 안전사고 예방 체크리스트: 1) 바닥 — 미끄럼 방지 처리, 젖은 바닥 경고 표지판, 2) 진열대 — 넘어짐 방지 고정, 무거운 상품은 하단 배치, 3) 에스컬레이터 — 비상정지 버튼 위치 직원 숙지, 4) 화학물질(세제 등) — MSDS 비치, 보호 장구. 사고 발생 시 대응: 1) 응급조치(AED, 구급상자 위치 숙지), 2) 119 신고, 3) 현장 보존 및 CCTV 확보, 4) 사고 보고서 작성(24시간 내), 5) 보험사 연락. 산업재해보험과 영업배상책임보험 가입은 필수입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["안전","사고예방","보험","응급조치"],"difficulty":"basic"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORY 10: best_practices (모범 사례)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'fashion', '패션 매장 성공 사례 — 무신사 스탠다드 오프라인',
'무신사 스탠다드의 오프라인 매장(홍대, 강남)은 온라인 네이티브 브랜드의 성공적인 오프라인 전환 사례입니다. 핵심 전략: 1) 피팅 중심 매장 — 전 상품 시착 가능, 온라인 구매 유도, 2) 무인 결제 시스템 — 키오스크 + 앱 연동, 3) 데이터 연동 — 오프라인 시착 데이터를 온라인 추천에 활용, 4) SNS 연동 공간 — 매장 내 포토존, 5) 낮은 진입장벽 — 부담 없이 체험하는 컨셉. 오프라인 방문 고객의 70%가 이후 온라인에서 구매하는 O2O 효과를 달성했습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","무신사","O2O","오프라인"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'beauty', '뷰티 성공 사례 — 올리브영 매장 혁신',
'올리브영은 한국 H&B(Health & Beauty) 시장 점유율 90%를 달성한 성공 사례입니다. 핵심 전략: 1) 빠른 트렌드 반영 — 중소 브랜드 적극 입점, 2주 내 신상품 배치, 2) 체험 중심 매장 — 전 제품 테스트 가능, 3) 옴니채널 — 오늘배송/매장픽업 서비스, 4) 데이터 기반 MD — 실시간 판매 데이터로 진열 변경, 5) 1020세대 마케팅 — SNS 바이럴, 뷰티 페스타. 매장당 평균 매출이 연 20억원을 넘으며, 평당 효율이 업계 최고 수준입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","올리브영","H&B","트렌드"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'department_store', '백화점 성공 사례 — 더현대 서울의 공간 혁신',
'더현대 서울은 2021년 개점 이후 연매출 1조원을 달성하며 백화점 업계의 새 기준을 제시했습니다. 핵심 차별화: 1) 영업면적의 49%를 실내 정원, 아트 갤러리, 워터폴 등 비매장 공간으로 할애, 2) 5층 전체를 팝업/F&B 전용 공간으로 운영, 3) MZ세대 타겟 — 1층 전면에 팝업 스토어 배치, 4) SNS 바이럴 — 인스타그래머블한 공간 디자인, 5) 문화 프로그래밍 — 전시, 공연, 팝업 연간 300건+. 방문자의 40%가 20~30대로, 전통 백화점의 고객 고령화 문제를 해결했습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","더현대","공간혁신","MZ세대"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'fnb', 'F&B 성공 사례 — 컴포즈 커피의 가성비 전략',
'컴포즈 커피는 가맹점 4000개를 돌파하며 한국 커피 프랜차이즈 성장의 대표 사례가 되었습니다. 핵심 전략: 1) 가격 파괴 — 아메리카노 1500원(경쟁사 대비 50% 저렴), 2) 소형 매장 모델 — 10~15평, 초기 투자 5000만원 이하, 3) 배달/테이크아웃 비중 70%+ — 좌석 최소화로 임대료 절감, 4) 원두 자체 공급 — 원가 경쟁력 확보, 5) 데이터 기반 입지 선정 — 배달 수요 높은 오피스/주거 밀집지역. 소자본 창업 모델로 젊은 창업자 유치에 성공했습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","커피","가성비","프랜차이즈"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'lifestyle', '라이프스타일 성공 사례 — 아크앤북 서점형 매장',
'아크앤북(Arc.N.Book)은 서점+카페+라이프스타일을 결합한 복합 문화 공간 모델입니다. 핵심 전략: 1) 큐레이션 — 테마별 서적+연관 상품(인테리어 서적 옆에 소품, 요리책 옆에 식기), 2) 체류 유도 — 넓은 독서 공간, 카페 연계, 3) 문화 프로그래밍 — 저자 사인회, 독서모임, 전시, 4) 프리미엄 가격 전략 — 큐레이션 가치로 정가 판매 유지, 5) SNS 공간 — 책장 벽, 조명 등 포토제닉 인테리어. 일반 서점 대비 체류시간 3배(평균 90분), 객단가 2배를 기록합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","서점","큐레이션","문화공간"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '소규모 매장 디지털 전환 성공 사례',
'서울 성수동의 독립 패션 매장 A는 디지털 전환으로 매출을 2배로 성장시켰습니다. 적용 기술: 1) 클라우드 POS(페이히어) — 재고/매출 실시간 관리, 2) 인스타그램 쇼핑 연동 — 팔로워 2만 → 온라인 매출 40%, 3) 카카오톡 채널 — 신상품 알림, 1:1 스타일링 상담, 4) WiFi 센서(NeuralTwin) — 방문자 트래픽 분석, 피크타임 파악, 5) 예약제 운영(주말) — 프리미엄 경험 제공. 총 투자액 300만원으로 6개월 만에 ROI를 달성했습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["디지털전환","소규모매장","클라우드","NeuralTwin"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '시즌 운영 팁 — 여름/겨울 매장 관리',
'여름(6~8월) 매장 운영 팁: 1) 에어컨 온도 설정 24~26°C(외부 대비 5~7°C 낮게), 2) 냉음료/아이스크림 판매 코너 임시 설치, 3) 썬케어 상품 입구 배치, 4) 이른 오픈/늦은 마감(야외 활동 감소 시간대 공략). 겨울(12~2월): 1) 에어커튼 + 히터로 입구 온도 관리, 2) 따뜻한 음료 제공 서비스, 3) 기프트 래핑 코너 상설화, 4) 두꺼운 아우터 보관 서비스(코트 체크). 계절별 쾌적함이 체류 시간과 구매를 좌우합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["시즌","여름","겨울","운영팁"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '리테일 벤치마크 — 업종별 핵심 지표 기준',
'업종별 핵심 지표 벤치마크(한국 기준): [패션] 전환율 15~25%, 객단가 8~15만원, 재방문율 30~40%. [뷰티] 전환율 25~35%, 객단가 3~5만원, 재방문율 40~50%. [F&B] 테이블 회전율 2~3회/식사, 객단가 1~2만원, 재방문율 50~60%. [백화점] 평당 매출 200~500만원/월, 체류시간 60~120분. [라이프스타일] 체류시간 30~60분, 객단가 3~8만원, UPT 1.5~2.5. 자사 지표를 벤치마크와 비교하여 강점/약점을 파악하고 개선 우선순위를 결정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["벤치마크","KPI","업종별","기준"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '매장 리뉴얼 프로세스 모범 사례',
'매장 리뉴얼의 5단계 프로세스: 1) 진단(2주) — 현재 데이터 분석(히트맵, 매출, 고객 피드백), 문제 영역 식별, 2) 기획(2~4주) — 리뉴얼 목표 설정, 예산 수립, 디자인 컨셉, 3) 설계(2~4주) — 레이아웃, VMD, 조명, 가구 도면 작성, 4) 시공(1~4주) — 비수기에 진행, 임시 영업 계획 수립, 5) 검증(4~8주) — 리뉴얼 전후 KPI 비교(매출, 전환율, 체류시간). 성공적인 리뉴얼은 매출 15~30% 향상 효과가 있으며, 투자 회수 기간은 6~18개월입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["리뉴얼","프로세스","VMD","ROI"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'fashion', '패션 매장 고객 리뷰 활용 전략',
'오프라인 패션 매장에서 고객 리뷰를 확보하고 활용하는 전략: 1) 구매 후 카카오톡 자동 리뷰 요청(구매 3일 후, 응답률 15~25%), 2) 리뷰 작성 시 적립금 2000~3000원 제공, 3) 인스타그램 태그 리뷰 — 매장 태그 시 할인 쿠폰 증정, 4) 매장 내 포토존에서 착장샷 촬영 지원, 5) 긍정 리뷰 네이버/카카오 프로필에 노출. 리뷰가 10개 이상 축적된 상품의 전환율이 리뷰 없는 상품 대비 2.7배 높으며, 사진 리뷰가 텍스트 리뷰보다 3배 효과적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","리뷰","카카오톡","인스타그램"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '다점포 운영 표준화 모범 사례',
'다점포 운영의 핵심은 표준화와 현지화의 균형입니다. 표준화 항목: 1) 브랜드 아이덴티티(로고, 컬러, 인테리어 가이드라인), 2) 서비스 매뉴얼(접객 5단계, 클레임 대응), 3) 운영 SOP(오픈/클로징, 재고 관리, 청결), 4) KPI 체계(전 매장 동일 기준). 현지화 항목: 1) 상품 구성(지역 수요 반영), 2) 마케팅(로컬 이벤트, 지역 인플루언서), 3) 인력 관리(지역 인건비 차이). 주간 점장 회의와 월간 미스터리 쇼퍼를 통해 표준 준수율을 90% 이상으로 유지합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["다점포","표준화","SOP","현지화"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'fnb', 'F&B 원가 절감과 품질 유지 모범 사례',
'F&B 매장에서 원가를 절감하면서 품질을 유지하는 전략: 1) 레시피 표준화 — 정량 계량으로 식재료 편차 최소화, 2) 센트럴 키친 — 전처리를 중앙에서 처리하여 매장 인건비 30% 절감, 3) 식재료 로스율 관리 — 일일 폐기 기록, 월 3% 이하 목표, 4) 계절 메뉴 — 제철 식재료 활용으로 원가 20% 절감, 5) 발주 최적화 — 요일별 수요 예측 기반 자동 발주, 6) 다용도 식재료 — 하나의 재료를 여러 메뉴에 활용(닭고기→샐러드/샌드위치/파스타).',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","원가절감","레시피","센트럴키친"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '매장 데이터 기반 의사결정 문화 구축',
'데이터 기반 의사결정(Data-Driven Decision Making) 문화를 매장에 정착시키는 방법: 1) 핵심 KPI 3~5개를 선정하여 매일 공유(일일 브리핑), 2) 주간 데이터 리뷰 회의(30분, 지표 변화 원인 분석), 3) 직원 교육 — 기본 데이터 리터러시(그래프 읽기, 전환율 이해), 4) 실험 문화 — A/B 테스트를 권장하고 실패를 허용, 5) 데이터 대시보드를 직원 휴게실/백오피스에 상시 표시, 6) 데이터 기반 성과 보상 — 감이 아닌 지표로 평가. 데이터 문화가 정착된 매장의 매출 성장률은 비데이터 매장 대비 1.5~2배 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["데이터","의사결정","문화","대시보드"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'beauty', '뷰티 매장 — 옴니채널 재고 통합 사례',
'뷰티 브랜드 B는 온오프라인 재고를 통합하여 품절률을 50% 줄이고 재고 회전율을 40% 개선했습니다. 구현 방식: 1) 전 매장 + 물류센터 + 온라인 재고를 단일 시스템으로 통합, 2) 매장 재고 부족 시 인근 매장/물류센터에서 당일 배송(Ship-from-Store), 3) 온라인 주문 시 고객 위치 기반 최적 출고지 자동 선택, 4) 매장 디스플레이 축소 → 판매 재고 확대(진열 수량 30% 감소), 5) 실시간 재고 연동 앱으로 직원이 즉시 재고 확인. 연간 기회 손실 매출 30억원 회수 효과를 달성했습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","옴니채널","재고통합","Ship-from-Store"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'department_store', '백화점 팝업 운영 성공 공식',
'백화점 팝업 스토어의 성공 공식: 1) 기간 — 2~4주가 최적(1주 미만은 인지 부족, 5주 이상은 신선도 저하), 2) 위치 — 에스컬레이터 앞, 1층 중앙 등 유동인구 최다 지점, 3) 디자인 — 브랜드 컨셉을 극대화한 몰입형 공간, 4) 한정 상품 — 팝업 전용 50% + 베스트셀러 50%, 5) SNS 전략 — 사전 티저 2주 + 실시간 콘텐츠, 6) 데이터 수집 — 방문자 수, 체류시간, 전환율 측정. 잘 운영된 팝업의 평당 매출은 상설 매장의 2~3배이며, 신규 고객 획득 비용은 온라인 광고의 1/3 수준입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","팝업","한정판","SNS"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '매장 에너지 비용 절감 모범 사례',
'매장 운영비 중 에너지 비용은 10~15%를 차지합니다. 절감 전략: 1) LED 조명 전환 — 전기료 40~60% 절감, 회수 기간 1~2년, 2) 스마트 공조 — IoT 센서로 재실 인원 기반 자동 조절(20% 절감), 3) 에어커튼 — 냉난방 손실 30% 방지, 4) 냉동/냉장 설비 — 에너지 효율 1등급 교체, 야간 자동 절전, 5) 영업시간 외 자동 소등, 6) 태양광 패널(옥상/파사드 활용). 에너지 모니터링 시스템을 도입한 매장은 연간 에너지 비용을 평균 25~35% 절감합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["에너지","비용절감","LED","IoT"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'lifestyle', '라이프스타일 매장 — 로컬 크리에이터 협업 모델',
'로컬 크리에이터(소규모 제작자)와의 협업은 라이프스타일 매장의 차별화 핵심입니다. 운영 모델: 1) 위탁 판매(수수료 25~35%) — 크리에이터 재고 부담 없음, 2) 팝업 인 팝업(2~4주 미니 팝업 공간 제공) — 월 임대료 50~100만원, 3) 콜라보 상품 공동 개발 — 양측 브랜드 시너지, 4) 워크숍 호스팅 — 크리에이터가 강사, 매장이 공간 제공. 로컬 상품 비중 20~30%인 매장의 고객 재방문율이 40% 높으며, "여기서만 살 수 있는" 희소성이 최대 매력입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","로컬크리에이터","협업","팝업"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '고객 클레임 대응 모범 사례',
'고객 클레임은 서비스 회복의 기회입니다. LAST 원칙: Listen(경청) — 끝까지 듣기, Apologize(사과) — 진심 어린 사과, Solve(해결) — 즉시 해결책 제시, Thank(감사) — 피드백에 감사 표현. 대응 기준: 1) 상품 불량 — 즉시 교환/환불 + 사과 쿠폰(10%), 2) 서비스 불만 — 진심 사과 + 차회 방문 혜택, 3) 가격 오류 — 고객 유리 가격 적용, 4) 심각한 사안 — 점장 직접 대응. 클레임 후 만족스럽게 해결된 고객의 재방문율(95%)은 문제 미경험 고객(90%)보다 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["클레임","서비스회복","LAST","고객대응"],"difficulty":"basic"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — store_operations (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 향기 마케팅(Scent Marketing)',
'향기는 고객의 감정과 구매 행동에 강력한 영향을 미칩니다. 연구에 따르면 적절한 향기가 있는 매장에서 체류 시간이 15~20% 증가하고, 구매 의향이 80% 높아집니다. 업종별 추천 향: 패션 — 시트러스/플로럴(상쾌함), 뷰티 — 파우더리/그린(청결감), F&B — 바닐라/시나몬(식욕 자극), 가구/인테리어 — 우디/허브(안정감). 향기 디퓨저는 매장 면적 30평당 1대, 에어컨 덕트에 연결하면 균일한 확산이 가능합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["향기마케팅","감각","체류시간","디퓨저"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 BGM(배경음악) 전략',
'배경음악은 고객 행동에 실질적 영향을 미칩니다. 느린 템포(BPM 60~72)는 체류 시간을 17% 늘리고 매출을 38% 증가시키며, 빠른 템포(BPM 94~108)는 F&B에서 테이블 회전율을 높입니다. 볼륨은 대화가 가능한 수준(55~65dB)이 적정합니다. 시간대별 조절: 오전(재즈/클래식, 차분), 오후(팝/인디, 활기), 저녁(라운지/보사노바, 세련됨). 저작권 문제를 위해 한국음악저작권협회(KOMCA)에 배경음악 사용료를 납부해야 합니다(월 2~5만원).',
'{"source":"NeuralTwin Knowledge Base","tags":["BGM","배경음악","BPM","감각마케팅"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'fashion', '패션 매장 피팅룸 설계 기준',
'피팅룸은 패션 매장의 핵심 전환 공간입니다. 설계 기준: 1) 크기 — 최소 1.2m×1.2m(권장 1.5m×1.5m), 2) 조명 — CRI 90+ 측면 조명(상부 조명은 얼굴에 그림자), 색온도 3000~3500K, 3) 거울 — 전신 거울(높이 170cm+) + 3면 거울, 4) 벽 — 중성 색상(아이보리/베이지), 5) 편의시설 — 의자, 옷걸이 3개+, 가방 선반, 전신 거울 조절 조명, 6) 프라이버시 — 문 또는 커튼(바닥~천장), 7) 번호표 시스템으로 대기 시간 관리.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","피팅룸","설계","조명"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'fnb', 'F&B 매장 위생 동선 설계',
'F&B 매장의 위생 동선은 식재료→조리→서빙의 순방향 흐름과 퇴식→세척→보관의 역방향 흐름이 교차하지 않아야 합니다. 필수 구역: 1) 식재료 보관실(냉장/냉동/건조), 2) 전처리실(세척/손질), 3) 조리실(화기/비화기 구분), 4) 서빙 카운터, 5) 퇴식/세척실, 6) 쓰레기 보관실(외부 접근). 손 세정대는 주방 내 2개소 이상, 매장 내 1개소 이상 설치합니다. HACCP 인증 기준에 따라 구역 간 에어커튼 또는 자동문을 설치하면 교차 오염을 효과적으로 방지합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","위생동선","HACCP","교차오염"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'department_store', '백화점 식품관 운영 전략',
'백화점 식품관(Depachika)은 전체 방문객의 40~50%가 이용하는 핵심 집객 매장입니다. 운영 전략: 1) 시식 코너 — 전체 식품관 매출의 20~30%가 시식 후 구매, 2) 그로서란트(Grocerant) — 식재료 구매+현장 식사 결합, 3) 프리미엄 PB — 한정 상품(계절 케이크, 디저트), 4) 점포별 차별화 — 지역 맛집 입점, 5) 배달/포장 서비스 — 식품관 매출의 15% 차지. 식품관은 낮은 마진(15~20%)에도 고객 흡인력이 커 상층 매장 매출을 견인하는 앵커 역할을 합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","식품관","그로서란트","시식"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'lifestyle', '라이프스타일 매장 감각 디자인 원칙',
'라이프스타일 매장은 5감 디자인으로 브랜드 정체성을 전달합니다. 1) 시각 — 통일된 컬러 팔레트, 자연 소재(원목, 돌, 식물), 2) 청각 — 브랜드 아이덴티티에 맞는 BGM 큐레이션, 3) 후각 — 시그니처 향(입구에서 감지, 기억 형성), 4) 촉각 — 자유로운 터치(포장 제거, 소재 체험), 5) 미각 — 음료/시식 제공(카페 인숍). 5감이 일관된 메시지를 전달할 때 브랜드 기억률이 70% 향상되며, "이 매장만의 분위기"라는 차별화가 만들어집니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","5감","감각디자인","브랜드"],"difficulty":"intermediate"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — customer_behavior (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '세대별 쇼핑 행동 차이(MZ vs X vs 베이비붐)',
'세대별 쇼핑 특성: MZ세대(1980~2005) — 모바일 퍼스트, SNS 리뷰 중시, 경험>소유, 가치 소비(ESG), 비대면 선호. X세대(1965~1979) — 가성비+가심비 균형, 브랜드 충성도 높음, 오프라인 선호하나 온라인 병행. 베이비붐(1955~1964) — 프리미엄 소비 여력, 대면 상담 선호, 백화점/홈쇼핑 충성. 매장은 타겟 세대에 맞춘 접객 방식과 커뮤니케이션 채널을 차별화해야 합니다. MZ는 앱 푸시, X는 카카오톡, 베이비붐은 전화/SMS가 효과적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["세대별","MZ세대","쇼핑행동","타겟"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '가격 심리학 — 매장 가격 전략',
'가격 심리를 활용한 전략: 1) 끝자리 효과 — 10,000원보다 9,900원이 20% 더 매력적으로 인식, 2) 앵커링 — 고가 상품을 먼저 보여주면 중가 상품이 합리적으로 느껴짐, 3) 3가지 선택지 — 소/중/대 중 가운데 옵션 선택률 60%, 4) 번들 가격 — 개별 합산보다 세트 가격이 15% 저렴해 보이면 구매율 급증, 5) 기준가 표시 — "정가 50,000원 → 35,000원" 할인 전 가격 병기 시 구매 의향 40% 증가.',
'{"source":"NeuralTwin Knowledge Base","tags":["가격심리","앵커링","번들","할인"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '고객 이탈 시그널과 윈백 전략',
'고객 이탈의 5대 시그널: 1) 방문 주기 2배 이상 증가, 2) 구매 금액 50% 이상 감소, 3) 포인트 적립 중단, 4) 클레임 후 재방문 없음, 5) 멤버십 등급 하락. 윈백(Win-Back) 전략: 이탈 30일차 — "보고 싶어요" 메시지 + 10% 쿠폰, 60일차 — "특별 혜택" 20% 쿠폰 + 신상품 알림, 90일차 — "마지막 기회" 30% 쿠폰 + 포인트 소멸 예고. 윈백 캠페인의 평균 회수율은 15~25%이며, 회수 고객의 LTV는 신규 고객보다 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["이탈","윈백","CRM","쿠폰"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '대기 시간 심리학과 관리 전략',
'고객이 인지하는 대기 시간은 실제보다 36% 길게 느낍니다. 대기 심리 관리 전략: 1) 진행 표시 — 번호표, 예상 시간 안내(체감 20% 감소), 2) 주의 분산 — 디지털 사이니지, 상품 진열, 거울 배치, 3) 공정성 — 선착순 시스템 명확화(새치기 방지), 4) 편안함 — 의자, 음료 제공, Wi-Fi, 5) 사전 서비스 — 대기 중 메뉴판/카탈로그 제공. 대기 시간이 5분을 넘으면 만족도가 급락하며, 10분 이상은 25% 고객이 이탈합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["대기시간","심리학","만족도","이탈"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'fashion', '패션 고객 오프라인-온라인 연계 행동(웹루밍/쇼루밍)',
'웹루밍(Webrooming)은 온라인 검색 후 오프라인 구매(전체의 55%), 쇼루밍(Showrooming)은 매장 체험 후 온라인 구매(25%)입니다. 패션 매장 대응: 웹루밍 고객 — 매장 내 Wi-Fi로 온라인 리뷰 확인 지원, 재고 실시간 표시. 쇼루밍 고객 — 매장 전용 할인, 즉시 수선 서비스, 기프트 래핑 등 오프라인 부가가치 제공. 쇼루밍 방어율(매장 구매 전환)은 가격 매칭 시 40%, 추가 서비스 시 55%까지 향상됩니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","웹루밍","쇼루밍","O2O"],"difficulty":"intermediate"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — product_management (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '안전 재고(Safety Stock) 계산법',
'안전 재고는 수요 변동과 리드타임 변동에 대비한 여유 재고입니다. 계산 공식: 안전재고 = Z × σ_d × √LT (Z=서비스수준 계수, σ_d=일일 수요 표준편차, LT=리드타임). 서비스 수준 95%일 때 Z=1.65, 99%일 때 Z=2.33입니다. A등급 상품은 99%, B등급 95%, C등급 90% 서비스 수준을 적용합니다. 과잉 안전재고는 보관비와 기회비용을 증가시키므로, 분기별로 수요 변동성을 재계산하여 안전재고를 조정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["안전재고","계산","서비스수준","리드타임"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '상품 진열의 골든존 활용법',
'골든존(Golden Zone)은 고객의 시선이 가장 자연스럽게 머무는 높이로, 바닥에서 80~130cm(여성 기준)입니다. 골든존 활용 원칙: 1) 마진율 상위 20% 상품 배치, 2) 신상품/추천 상품 배치, 3) 어린이 타겟 상품은 60~100cm, 4) 상단(130cm+)은 패키지가 눈에 띄는 대형 상품, 5) 하단(80cm 이하)은 대용량/무거운 상품. 골든존 배치만으로 해당 상품의 매출이 30~50% 증가하며, 2주 주기로 로테이션하면 다양한 상품의 노출을 극대화할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["골든존","진열","높이","노출"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'fnb', 'F&B 메뉴 가격 설정 전략',
'메뉴 가격 설정의 3가지 접근법: 1) 원가 기반 — 식재료 원가 × 3~3.5배(원가율 28~33%), 2) 경쟁 기반 — 인근 동종 매장 대비 ±10~15% 범위 설정, 3) 가치 기반 — 프리미엄 식재료/분위기에 대한 프리미엄 가격. 메뉴판 가격 배치 전략: 가장 비싼 메뉴를 먼저 배치(앵커링), 추천 메뉴에 가격 끝자리 0(깔끔한 인상), 세트 메뉴는 개별 합산 대비 15~20% 할인 표시. 음료 마진(70~80%)이 가장 높으므로 음료 판매 촉진이 수익성에 직결됩니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","가격설정","메뉴","원가율"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'beauty', '뷰티 신제품 런칭 매장 전략',
'뷰티 신제품 런칭 시 매장 전략: 1) 런칭 2주 전 — BA 제품 교육, 테스터 준비, 고객 사전 알림(카카오톡/앱), 2) 런칭 주간 — 입구 디스플레이 변경, 전용 카운터 설치, 무료 체험 서비스, 3) 런칭 후 2주 — 구매 고객 리뷰 수집, SNS 리뷰 이벤트, 4) 런칭 후 4주 — 판매 데이터 분석, 진열 위치 조정, 재발주 결정. GWP(Gift With Purchase, 사은품 증정)는 런칭 초기 2~3주에 집중하며, 기존 인기 상품과 번들 판매도 효과적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","신제품","런칭","GWP"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'department_store', '백화점 명품 브랜드 입점 관리',
'명품 브랜드 입점 관리 핵심: 1) 브랜드 믹스 — 앵커 브랜드(에르메스, 루이비통, 샤넬)로 집객, 신진 브랜드로 차별화, 2) 수수료 구조 — 고급 브랜드 15~20%, 일반 25~30%(브랜드 파워에 따라 역전), 3) 면적 배분 — 매출 효율과 브랜드 시너지 고려, 4) VMD 가이드라인 — 브랜드 본사 기준 존중하되 백화점 통일성 유지, 5) 재계약 — 연 1회 실적 평가, 하위 10% 브랜드 교체 검토. 명품 매출 비중은 백화점 전체의 35~45%이며 핵심 수익원입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","명품","입점","수수료"],"difficulty":"advanced"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — marketing (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '리테일 미디어 네트워크(RMN) 활용',
'리테일 미디어 네트워크는 매장의 고객 접점을 광고 매체로 활용하는 전략입니다. 채널: 1) 매장 내 디지털 사이니지 광고, 2) 앱/웹 배너 광고, 3) 이메일/SMS 스폰서드 콘텐츠, 4) 영수증 뒷면 광고, 5) 쇼핑카트/바구니 광고. 수익 모델: CPM(노출당 과금) 또는 CPC(클릭당 과금). 아마존 리테일 미디어 매출은 연 400억 달러를 넘어섰으며, 한국에서도 쿠팡, 네이버가 적극 도입 중입니다. 오프라인 매장도 디지털 사이니지를 통해 월 100~500만원의 추가 광고 수익을 창출할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["리테일미디어","RMN","사이니지","광고"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '이벤트/프로모션 달력 운영법',
'연간 프로모션 달력 관리 원칙: 1) 연초에 12개월 프로모션 프레임 수립(빅 세일 2~3회, 미니 이벤트 월 1~2회), 2) 프로모션 간 최소 2주 간격(할인 피로도 방지), 3) 유형 다양화 — 가격 할인(40%), 사은품(25%), 체험 이벤트(20%), 콘텐츠(15%), 4) 프로모션 전후 데이터 비교 필수(매출, 객수, 객단가, 마진), 5) 전년 프로모션 결과를 다음 해 계획에 반영. 프로모션 비율이 전체 매출의 25% 이하면 건강하고, 40% 이상이면 정가 판매력이 약하다는 신호입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["프로모션","달력","연간계획","세일"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '구전 마케팅(Word-of-Mouth) 촉진 전략',
'구전은 광고보다 신뢰도가 92% 높으며, 구전으로 유입된 고객의 LTV가 16% 높습니다. 구전 촉진 전략: 1) 기대 초과 경험 — "와우 모먼트" 설계(예상 이상의 서비스, 깜짝 선물), 2) 공유하고 싶은 공간 — 포토존, 독특한 인테리어, 3) 레퍼럴 프로그램 — 추천인/피추천인 양쪽 혜택(전환율 3~5배), 4) 리뷰 인센티브 — 네이버/구글 리뷰 작성 시 포인트, 5) 커뮤니티 구축 — 단골 고객 모임, SNS 그룹. 입소문은 마이너스 경험이 3배 더 빠르게 퍼지므로 불만 관리가 우선입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["구전마케팅","WOM","리뷰","레퍼럴"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'fashion', '패션 매장 인플루언서 마케팅',
'패션 매장의 인플루언서 마케팅 전략: 1) 마이크로 인플루언서(1~5만 팔로워) — 지역 기반, 높은 인게이지먼트(5~8%), 비용 효율적, 2) 매장 방문 콘텐츠 — 스타일링 영상, OOTD(Outfit of the Day), 3) 보상 구조 — 제품 제공 + 매출 연동 커미션(5~15%), 4) 장기 파트너십(3개월+) — 일회성보다 반복 노출이 3배 효과적, 5) 팔로워 구매 전환 추적 — 전용 할인코드 또는 UTM 링크. ROI 벤치마크: 마이크로 인플루언서 평균 ROI 5~8배, 메가 인플루언서 2~4배.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","인플루언서","마이크로","콘텐츠"],"difficulty":"intermediate"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — staff_management (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '매장 점장 리더십 핵심 역량',
'우수한 점장의 5대 역량: 1) 데이터 리더십 — KPI를 이해하고 데이터 기반 의사결정, 2) 피플 매니지먼트 — 직원 동기부여, 갈등 해결, 코칭, 3) 고객 중심 사고 — 고객 경험 품질 관리, 클레임 대응, 4) 운영 우수성 — 재고/비용/SOP 관리, 5) 커뮤니케이션 — 본사↔매장↔고객 간 소통 허브. 매장 성과의 70%가 점장 역량에 의해 결정된다는 연구 결과가 있으며, 점장 교체 후 6개월 내 매출 변동이 ±20% 발생합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["점장","리더십","역량","매니지먼트"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '직원 교육 — 상품 지식 습득법',
'효과적인 상품 지식 교육법: 1) 신상품 브리핑 — 입고 당일 15분 팀 미팅, 핵심 3가지 포인트 전달, 2) 제품 체험 — 직원이 직접 사용/착용(직원 할인 50% 제공), 3) 퀴즈 테스트 — 주 1회 5문항 모바일 퀴즈(게이미피케이션), 4) 롤플레이 — 고객 시나리오 연습(월 2회), 5) 경쟁사 방문 — 분기 1회 경쟁 매장 답사. 상품 지식이 풍부한 직원의 개인 매출이 평균 대비 35% 높으며, 고객 NPS도 20점 이상 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["교육","상품지식","퀴즈","롤플레이"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '피크 타임 인력 배치 공식',
'피크 타임 인력 배치를 데이터로 최적화하는 방법: 1) 과거 12주 트래픽 데이터에서 시간대별 평균 방문자 수 산출, 2) 직원 1인당 적정 응대 고객 수 설정(업종별 상이), 3) 공식: 필요 인원 = 예상 방문자 × 접객 필요율(50~70%) ÷ 1인 응대 가능 수, 4) 고정 인원(오픈~클로징) + 유동 인원(피크 시간만) 조합, 5) 유동 인원은 파트타임 활용(인건비 최적화). 데이터 기반 배치 후 인건비 대비 매출(Labor Cost Ratio) 15~20% 개선 사례가 다수입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["피크타임","인력배치","공식","최적화"],"difficulty":"intermediate"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — industry_trends (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '라이브 커머스와 오프라인 매장 연계',
'라이브 커머스(라이브 방송 판매)와 오프라인 매장을 연계하는 전략: 1) 매장을 스튜디오로 활용 — 현장감 있는 라이브(매장 분위기, 실제 착용), 2) 라이브 시청자 매장 방문 유도 — 라이브 전용 쿠폰(오프라인 사용), 3) 실시간 Q&A — 매장 직원이 직접 응대(신뢰도 상승), 4) 라이브 중 실시간 재고 연동(품절 자동 표시). 네이버 쇼핑라이브, 카카오 쇼핑라이브의 매장 연계 라이브는 일반 라이브 대비 전환율이 2배 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이브커머스","방송","오프라인연계","네이버"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '리커머스(Recommerce/중고거래) 트렌드',
'중고 거래/리커머스 시장은 연 20%+ 성장하며, 특히 패션/명품 분야에서 두드러집니다. 리테일 매장 대응 전략: 1) 바이백 프로그램 — 자사 제품 중고 매입 후 크레딧 제공(재방문 유도), 2) 리퍼비시 코너 — 매장 내 중고/리퍼 상품 전용 공간, 3) 업사이클링 서비스 — 의류 수선/리폼, 4) 리셀 플랫폼 파트너십(번개장터, 크림 연계). 리커머스 프로그램 운영 매장의 신규 고객 유입이 25% 증가하며, ESG 브랜드 이미지에도 긍정적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["리커머스","중고거래","ESG","바이백"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '구독 경제와 리테일 매장',
'구독(Subscription) 모델의 리테일 적용: 1) 정기 배송 — 소모품(화장품, 식품, 반려동물 용품), 월 구독료 2~5만원, 2) 렌탈 구독 — 패션(월 의류 3벌 대여), 가전, 아기용품, 3) 멤버십 구독 — 프리미엄 서비스 묶음(무료배송+할인+라운지), 4) 큐레이션 박스 — 월별 테마 상품 큐레이션(서프라이즈 요소). 구독 고객의 월 ARPU(인당 평균 수익)는 비구독 고객의 3~5배이며, 이탈률은 월 5% 이하로 안정적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["구독","렌탈","멤버십","ARPU"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '디지털 트윈(Digital Twin)과 매장 최적화',
'디지털 트윈은 물리적 매장을 3D로 복제하여 가상 환경에서 시뮬레이션하는 기술입니다. 활용: 1) 레이아웃 시뮬레이션 — 동선 변경 효과를 실제 적용 전에 예측, 2) 트래픽 시뮬레이션 — 피크타임 병목 구간 사전 파악, 3) VMD 테스트 — 진열 변경 효과를 가상으로 확인, 4) 에너지 최적화 — 조명/공조 배치 시뮬레이션, 5) 직원 배치 최적화 — 고객 동선 기반 최적 위치. NeuralTwin 플랫폼은 IoT 센서 데이터와 3D 시각화를 결합하여 실시간 디지털 트윈을 제공합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["디지털트윈","3D","시뮬레이션","NeuralTwin"],"difficulty":"advanced"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — technology (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', '컴퓨터 비전(Computer Vision) 매장 분석',
'컴퓨터 비전 기술로 매장을 분석하는 방법: 1) 인원 카운팅 — CCTV 영상에서 실시간 방문자 수 측정(정확도 97%+), 2) 연령/성별 추정 — 얼굴 분석으로 고객 프로파일(정확도 85%), 3) 감정 분석 — 표정에서 만족도 추정, 4) 동선 추적 — 개인별 이동 경로 분석, 5) 상품 인식 — 선반 위 상품 부족 감지(빈 선반 알림). 개인정보 이슈를 위해 얼굴을 익명화(블러/실루엣)하고, 통계 데이터만 저장하는 방식을 적용합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["컴퓨터비전","AI","CCTV","인원카운팅"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', 'ESL(전자가격표시기) 도입 효과',
'ESL(Electronic Shelf Label)은 전자잉크 디스플레이로 가격을 표시하며, 중앙 서버에서 무선으로 일괄 변경합니다. 도입 효과: 1) 가격 변경 시간 — 수작업 수일 → 5분(전 매장 동시), 2) 가격 오류 0% — 시스템 연동으로 POS와 항상 일치, 3) 종이 POP 인쇄비 90% 절감, 4) 동적 가격 — 시간대/재고량에 따른 자동 가격 조정 가능, 5) 프로모션 표시 — 할인가, 비교가, QR코드 표시. 도입 비용은 태그당 5000~15000원이며, 3~5년 내 ROI 달성이 일반적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["ESL","전자가격표","무선","동적가격"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', '매장 데이터 통합 아키텍처',
'매장 데이터 통합의 3단계 아키텍처: 1) 수집(Collect) — POS, IoT 센서, CCTV, CRM, 앱에서 데이터 수집, MQTT/API로 클라우드 전송, 2) 저장/처리(Store/Process) — 클라우드 데이터베이스(Supabase/PostgreSQL)에 통합 저장, ETL 파이프라인으로 정제, 3) 분석/시각화(Analyze/Visualize) — 대시보드(실시간 모니터링), AI 분석(이상 탐지, 예측), 리포트(일일/주간/월간). 데이터 사일로를 해소하면 개별 분석 대비 인사이트 품질이 3~5배 향상되며, 의사결정 속도가 크게 빨라집니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["데이터통합","아키텍처","클라우드","ETL"],"difficulty":"advanced"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — analytics (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '코호트 분석(Cohort Analysis) 리테일 적용',
'코호트 분석은 같은 시기에 첫 구매한 고객 그룹의 이후 행동을 추적하는 방법입니다. 예: 1월 첫 구매 코호트 100명 → 2월 재구매 30명(30%) → 3월 20명(20%) → ... 이를 통해 리텐션 커브를 파악합니다. 건강한 리텐션: M1 30~40%, M3 15~25%, M6 10~15%, M12 5~10%. 특정 코호트의 리텐션이 낮으면 해당 기간 서비스/상품에 문제가 있었음을 시사합니다. 프로모션으로 유입된 코호트 vs 오가닉 유입 코호트를 비교하면 마케팅 효율도 평가할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["코호트분석","리텐션","재구매","추적"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '매장 손익분기점(BEP) 분석',
'매장 손익분기점 계산: BEP 매출 = 고정비 ÷ (1 - 변동비율). 매장 고정비: 임대료, 인건비(고정), 감가상각, 보험. 변동비: 상품원가, 수수료, 포장비, 배달비. 예시: 월 고정비 2000만원, 변동비율 65% → BEP 매출 = 2000 ÷ 0.35 = 약 5714만원. BEP 달성 시점이 오픈 후 6개월 이내면 양호, 12개월 초과면 사업 모델 재검토가 필요합니다. 일일 BEP를 계산하여(월 BEP ÷ 영업일수) 매일 목표 매출 달성 여부를 모니터링합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["손익분기점","BEP","고정비","변동비"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '매장 트래픽 대비 매출 분석(Traffic-to-Sales)',
'트래픽 대비 매출 분석은 방문자 수(Traffic)와 매출의 상관관계를 분석합니다. 핵심 지표: 1) 트래픽 전환율 = 구매 건수 ÷ 방문자 수, 2) 방문자당 매출 = 총매출 ÷ 방문자 수, 3) 트래픽 트렌드(증가/감소). 시나리오 분석: 트래픽↑매출↑ = 정상 성장, 트래픽↑매출→ = 전환율 하락(접객/상품 문제), 트래픽↓매출↑ = 객단가 상승(VIP 집중), 트래픽↓매출↓ = 위기 상황(외부 요인/경쟁 분석 필요). IoT 센서 데이터와 POS 데이터를 연동하면 이 분석을 자동화할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["트래픽","매출","전환율","IoT"],"difficulty":"intermediate"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — compliance (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '매장 내 IoT 데이터 수집 법적 고려사항',
'매장에 IoT 센서를 설치하여 데이터를 수집할 때의 법적 고려사항: 1) WiFi 프로브 — MAC 주소 해시 처리 시 개인정보 비해당(해석 불일치 가능, 안내문 게시 권장), 2) BLE 비콘 — 앱 설치+위치 동의 필요, 3) 카메라/비전 — CCTV 안내판 필수, 얼굴 인식은 별도 동의 필수, 4) 환경 센서(온도/습도) — 개인정보 비해당, 5) 음성 인식 — 녹음 시 동의 필수. 데이터 수집 목적과 보유기간을 매장 입구에 고지하고, 수집 데이터는 최소 보유 원칙을 적용합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["IoT","법적","개인정보","WiFi"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '공정거래법 — 리테일 매장 준수사항',
'공정거래법 관련 매장 준수사항: 1) 가격 표시 — 정찰제 의무(할인 전/후 가격 명확 표시), 2) 허위/과대 광고 금지 — "최저가 보장" 등 입증 불가능한 표현 주의, 3) 부당 끼워팔기 금지 — 소비자 선택권 보장, 4) 할인 행사 — 할인 전 가격 최소 1개월 실제 판매 이력 필요("가격 부풀리기 후 할인" 방지), 5) 경품 규제 — 거래 부수 경품 최대 한도 존재(거래액의 일정 비율). 공정위 신고 접수 시 30일 내 소명이 필요하며, 위반 시 매출의 2% 이하 과징금이 부과됩니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["공정거래법","가격표시","할인","과대광고"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'fnb', 'F&B 음식물 알레르기 표시 의무',
'식품 알레르기 표시 관련 법적 의무: 1) 22대 알레르기 유발물질 표시 의무(계란, 우유, 밀, 대두, 땅콩, 메밀, 새우, 게, 돼지고기, 복숭아, 토마토 등), 2) 표시 방법 — 메뉴판/메뉴보드에 아이콘 또는 텍스트로 표시, 3) 직원 교육 — 알레르기 문의 시 정확한 정보 제공, "잘 모르겠다"는 절대 금지, 4) 교차 오염 방지 — 알레르기 식재료 전용 도구 사용, 5) 사고 대응 — 알레르기 반응 발생 시 응급 연락처 비치. 미표시 또는 오표시 시 영업정지 처분을 받을 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","알레르기","표시의무","식품안전"],"difficulty":"basic"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — best_practices (추가)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', 'NeuralTwin IoT 센서 설치 모범 사례',
'NeuralTwin WiFi 프로브 센서 설치 모범 사례: 1) 설치 위치 — 천장 2.5~3m 높이, 매장 중앙(단일 센서) 또는 대각선 배치(다중 센서), 2) 커버리지 — 센서 1대당 반경 15~25m, 100평 매장은 2~3대 권장, 3) 간섭 회피 — 전자레인지, 대형 모니터 등 전자파 발생 기기에서 1m 이상 이격, 4) 전원 — PoE(이더넷 전원) 또는 USB-C 5V 어댑터, 5) 네트워크 — 매장 Wi-Fi 또는 LTE 핫스팟 연결. 설치 후 1주간 보정 기간을 두고 실제 방문자 수와 센서 데이터를 대조하여 정확도를 검증합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["NeuralTwin","IoT","센서","설치"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', 'NeuralTwin 대시보드 활용 — 일일 루틴',
'NeuralTwin 대시보드를 활용한 점장의 일일 루틴: 1) 오전 오픈 시(09:30) — 전일 실적 확인(방문자, 매출, 전환율), AI 인사이트 확인, 2) 오전 브리핑(10:00) — 직원에게 주요 지표 공유, 오늘 목표 설정, 3) 오후(14:00) — 실시간 트래픽 모니터링, 히트맵 확인, 인력 재배치, 4) 저녁(18:00) — 오후 피크 분석, 프로모션 효과 체크, 5) 클로징(21:00) — 일일 리포트 확인, 특이사항 기록. 주 1회 주간 리포트를 분석하여 VMD 변경, 프로모션 조정 등 액션을 결정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["NeuralTwin","대시보드","루틴","점장"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '매장 위기 관리(Crisis Management) 매뉴얼',
'매장 위기 상황별 대응 매뉴얼: 1) 자연재해(태풍/지진) — 고객 대피 유도, 비상구 확보, 귀중품 보관, 2) 정전 — 비상 조명 확인, 계산 중 거래 수기 처리, 냉장/냉동 상품 관리, 3) 화재 — 119 신고, 소화기 사용, 대피 유도, CCTV 확보, 4) 도난/강도 — 직원 안전 최우선, 경찰 신고, CCTV 보존, 5) 고객 부상 — 응급 처치, 119, 사고 보고서 작성. 분기 1회 비상 훈련을 실시하고, 위기 대응 매뉴얼을 매장 백오피스에 항시 비치합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["위기관리","비상","대응","매뉴얼"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'fashion', '패션 매장 — 반품/교환 처리 모범 사례',
'반품/교환은 고객 신뢰의 핵심입니다. 모범 사례: 1) 정책 — 구매 후 14일 내 영수증 지참 시 무조건 교환/환불(법정 7일보다 관대), 2) 프로세스 — 이유 불문 접수 → 상품 확인(하자/세탁 여부) → 즉시 처리(3분 이내), 3) 클레임 방지 — 구매 시 교환/환불 정책 안내 카드 동봉, 4) 데이터 활용 — 반품 사유 기록(사이즈 53%, 색상 차이 20%, 마음 변화 15%, 하자 12%) → 사이즈 가이드 개선, 5) 긍정적 마무리 — 환불 후에도 신상품 추천, 다음 방문 유도.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","반품","교환","고객신뢰"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '매장 개점(오픈) 체크리스트 모범 사례',
'신규 매장 오픈 전 D-30 체크리스트: 1) 인테리어 완료 및 최종 점검, 2) 상품 입고 및 진열 완료, 3) POS/결제 시스템 테스트, 4) 직원 채용 및 교육 완료(최소 2주 OJT), 5) 인허가 완료(영업신고, 소방검사), 6) 보험 가입(영배, 화재, 도난). D-7: 7) 시뮬레이션 영업(직원만 참여), 8) 오픈 프로모션 확정(개점 기념 할인/사은품), 9) SNS/네이버 플레이스 사전 등록. D-day: 10) VIP/지인 프리오픈(전일), 11) 그랜드 오픈 이벤트. 오픈 후 30일간 집중 모니터링하여 문제점을 빠르게 수정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["오픈","체크리스트","신규매장","프리오픈"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'beauty', '뷰티 매장 — 퍼스널 컬러 진단 서비스 도입 사례',
'퍼스널 컬러 진단 서비스를 도입한 뷰티 매장 C의 사례: 1) 서비스 — 30분 무료 퍼스널 컬러 진단(전문 진단사 배치), 2) 진단 결과에 맞는 제품 3~5개 추천(파운데이션, 립, 블러셔), 3) 결과: 진단 후 평균 구매 금액 8.5만원(미진단 3.2만원의 2.7배), 4) 재방문 — 진단 고객의 60%가 3개월 내 재방문(일반 35%), 5) 구전 효과 — 진단 후 SNS 공유율 45%(포토 프레임 제공). 투자: 진단 장비 200만원 + 진단사 인건비, 3개월 만에 ROI 달성.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","퍼스널컬러","진단","서비스"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'fnb', 'F&B 고객 리뷰 관리 — 네이버/구글 플레이스',
'F&B 매장의 온라인 리뷰 관리 전략: 1) 리뷰 모니터링 — 매일 1회 네이버/구글/배민 리뷰 확인, 2) 긍정 리뷰 — 24시간 내 감사 댓글(재방문 유도 문구 포함), 3) 부정 리뷰 — 12시간 내 진심 어린 사과 + 개선 약속 + DM으로 보상 제안, 4) 평점 관리 — 4.0 이상 유지 목표(4.0 미만 시 검색 노출 급감), 5) 리뷰 유도 — 결제 후 QR코드 리뷰 요청(리뷰 작성 시 음료 업그레이드). 평점 0.1점 상승이 월 매출 3~5% 증가와 상관관계가 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","리뷰","네이버플레이스","평점"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'department_store', '백화점 — 옴니채널 고객 경험 통합 사례',
'백화점 D의 옴니채널 통합 사례: 1) 앱 — 매장 내 상품 바코드 스캔 시 온라인 리뷰/코디 확인, 실시간 재고 조회, 2) BOPIS — 온라인 주문 후 1시간 내 매장 픽업(전용 카운터), 3) 무한 선반(Endless Aisle) — 매장 품절 시 태블릿으로 온라인 재고 즉시 주문, 자택 배송, 4) 통합 CRM — 온오프라인 구매 이력 통합, 개인화 추천, 5) 라이브 쇼핑 — 매장 직원이 라이브 방송으로 상품 소개. 옴니채널 고객의 연간 구매액은 단일채널 고객의 2.3배입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","옴니채널","BOPIS","앱"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '매장 디지털 전환 3단계 로드맵',
'매장 디지털 전환 로드맵: [1단계 — 기초 디지털화(1~3개월)] 클라우드 POS 도입, SNS 채널 개설, 기본 CRM(카카오톡 채널), 네이버 플레이스 최적화. [2단계 — 데이터 수집(3~6개월)] IoT 센서(WiFi 프로브) 설치, 방문자 트래픽 측정, 기본 대시보드 구축, 온오프라인 데이터 연동. [3단계 — AI 분석/자동화(6~12개월)] AI 기반 수요 예측, 자동 재고 발주, 개인화 마케팅, 동적 가격 설정. 각 단계 완료 후 ROI를 측정하여 다음 단계 투자를 결정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["디지털전환","로드맵","IoT","AI"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'lifestyle', '라이프스타일 매장 — 시즌별 테마 운영 사례',
'라이프스타일 매장 E의 연간 테마 운영: 1~2월 "뉴이어 리프레시"(정리/수납 용품, 다이어리), 3~4월 "봄맞이 가드닝"(화분, 원예 도구, 아웃도어), 5~6월 "여름 라이프"(쿨링 아이템, 피크닉), 7~8월 "바캉스 에디션"(여행 용품, 방수 아이템), 9~10월 "가을 힐링"(캔들, 차, 독서 용품), 11~12월 "홀리데이 기프트"(선물 세트, 한정판). 각 테마에 맞춰 VMD, BGM, 향기, 이벤트를 통일성 있게 변경합니다. 테마 전환 후 첫 2주 매출이 평균 30% 상승합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","시즌","테마","VMD"],"difficulty":"basic"}'::jsonb);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADDITIONAL CHUNKS — 200+ 목표 보충 (각 카테고리 균형 맞춤)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 POP(Point of Purchase) 효과 극대화',
'POP 광고물은 매장 내 구매 결정에 직접 영향을 미칩니다. 효과적인 POP 원칙: 1) 하나의 메시지만 전달(복잡한 정보 금지), 2) 시인성 — 3m 거리에서 읽을 수 있는 글씨 크기(최소 5cm), 3) 색상 대비 — 배경과 글씨 보색 대비, 4) 위치 — 상품 바로 옆(시선 이동 최소화), 5) 수량 — 매장 전체 POP 15개 이내(과다하면 무시됨), 6) 교체 주기 — 2주(같은 POP 3주 이상 시 인지도 50% 하락). 디지털 POP(태블릿/사이니지)는 콘텐츠 변경이 즉시 가능하여 시간대별 다른 메시지를 표시할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["POP","광고","매장","시인성"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 도난 방지(Loss Prevention) 전략',
'리테일 도난(shrinkage)은 매출의 1~3%를 차지하며, 크게 외부 도난(45%), 내부 도난(30%), 관리 오류(20%), 공급업체 사기(5%)로 구분됩니다. 외부 도난 방지: 1) EAS 태그(전자 상품 감시), 2) 고가 상품 잠금 진열장, 3) CCTV + AI 이상 행동 감지, 4) 직원 인사(존재감 어필). 내부 도난 방지: 1) 이중 확인 시스템(재고 입출고), 2) POS 로그 분석(취소/환불 패턴 모니터링), 3) 배경 조사. 연간 재고 실사를 2회 이상 실시하고, 차이율 0.5% 이하를 목표로 합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["도난방지","EAS","CCTV","재고실사"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '고객 감정 상태와 구매 결정',
'고객의 감정 상태는 구매 결정에 강한 영향을 미칩니다. 긍정적 기분(happy mood)의 고객은 충동구매 확률이 2배 높고, 탐색 시간이 길며, 가격 민감도가 낮아집니다. 부정적 기분의 고객은 필요 상품만 빠르게 구매합니다. 매장에서 긍정 감정을 유발하는 요소: 1) 밝은 조명과 따뜻한 색온도, 2) 느린 BGM, 3) 좋은 향기, 4) 친절한 첫 인사, 5) 넓은 통로(답답함 해소), 6) 깨끗한 환경. 감정 디자인(Emotional Design)을 적용한 매장의 객단가가 평균 12% 높습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["감정","구매결정","감각마케팅","심리"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'general', '동반 쇼핑(Companion Shopping) 행동 분석',
'동반 쇼핑(2인 이상 함께 방문)은 전체 방문의 40~55%를 차지합니다. 동반자 유형별 특성: 1) 친구 동반 — 체류 시간 40% 증가, 충동구매율 높음, 2) 커플 동반 — 객단가 30% 증가, 합의 구매, 3) 가족 동반 — 폭넓은 카테고리 탐색, 아동 제품 구매 유도, 4) 혼자 쇼핑 — 빠른 결정, 효율적 동선. 동반 쇼핑 대응: 편안한 대기 공간(소파, 충전기), 남성/어린이 대기 공간, 그룹 쇼핑 할인 등. 동반자가 편안하면 메인 쇼퍼의 체류 시간과 구매액이 증가합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["동반쇼핑","그룹","체류시간","대기공간"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '발주 최적화 — EOQ(경제적 주문량) 모델',
'EOQ(Economic Order Quantity)는 주문 비용과 보관 비용의 합을 최소화하는 최적 발주량입니다. 공식: EOQ = √(2DS/H), D=연간 수요량, S=1회 주문비용, H=단위당 연간 보관비용. 예: 연간 수요 1000개, 주문비용 5만원, 보관비용 1000원/개 → EOQ = √(2×1000×50000/1000) = 316개. 재주문 시점(ROP) = 일일 평균 수요 × 리드타임 + 안전재고. 자동 발주 시스템에 EOQ와 ROP를 설정하면 재고 비용을 20~30% 절감하면서 품절률을 최소화할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["EOQ","발주","재고관리","ROP"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'general', '상품 라이프사이클(PLC) 관리 전략',
'상품 라이프사이클의 4단계별 전략: 1) 도입기 — 소량 테스트 입고, 눈에 띄는 위치 진열, 체험 이벤트(인지도 확보), 2) 성장기 — 발주량 확대, 다양한 SKU 추가, 크로스셀 연계, 3) 성숙기 — 최적 재고 유지, 번들/프로모션으로 매출 유지, 4) 쇠퇴기 — 마크다운 시작, 진열 축소, 대체 상품 준비. PLC 단계를 주간 판매 추이로 판단합니다: 3주 연속 매출 성장 = 성장기, 매출 정체 3주 = 성숙기, 매출 감소 2주 = 쇠퇴기 진입 신호.',
'{"source":"NeuralTwin Knowledge Base","tags":["PLC","상품라이프사이클","마크다운","SKU"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '리테일 앱 마케팅 — 푸시 알림 최적화',
'앱 푸시 알림의 효과적인 운영 전략: 1) 빈도 — 주 2~3회가 최적(주 5회+ 시 수신 거부율 급증), 2) 시간 — 점심(12~13시) 또는 저녁(19~21시) 발송이 오픈율 최고, 3) 개인화 — 이름+관심 카테고리 포함 시 오픈율 2배(평균 5%→10%), 4) 긴급성 — "오늘만", "마감 임박" 등 시간 제한 메시지, 5) 가치 제공 — 쿠폰, 신상품 정보, 이벤트 초대(광고 냄새 배제), 6) A/B 테스트 — 제목/시간/이미지 변형 테스트. 앱 설치 고객의 연간 구매액은 비설치 고객의 2~3배입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["앱마케팅","푸시알림","개인화","오픈율"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'general', '시즌 이벤트 마케팅 — 명절/기념일 공략',
'한국 리테일의 주요 시즌 이벤트: 1) 설날(1~2월) — 선물세트, 한복, 가족 외식, 2) 발렌타인/화이트데이(2~3월) — 초콜릿, 액세서리, 꽃, 3) 어버이날/스승의날(5월) — 건강식품, 감사 선물, 4) 추석(9~10월) — 프리미엄 선물세트, 한과, 5) 블랙프라이데이(11월) — 전 카테고리 대규모 할인, 6) 크리스마스(12월) — 선물, 파티용품. 각 이벤트 4주 전 기획, 2주 전 프로모션 개시, 이벤트 후 1주 재고 정리가 기본 타임라인입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["시즌이벤트","명절","기념일","선물"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '매장 미스터리 쇼퍼(Mystery Shopper) 운영법',
'미스터리 쇼퍼는 일반 고객으로 위장하여 매장 서비스 품질을 평가하는 방법입니다. 평가 항목: 1) 첫 인사 — 입장 후 몇 초 내 인사했는가, 2) 접객 태도 — 친절함, 전문성, 적극성, 3) 상품 지식 — 정확한 정보 제공 여부, 4) 매장 환경 — 청결, 진열 상태, BGM, 5) 결제 프로세스 — 속도, 정확성, 추가 제안. 분기 1회, 매장당 2~3회 실시하며, 결과를 100점 만점으로 점수화합니다. 결과는 직원 교육 자료로 활용하되, 처벌보다 개선 중심으로 피드백합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["미스터리쇼퍼","서비스평가","접객","피드백"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'general', '다문화 고객 응대 가이드',
'외국인 관광객 및 다문화 고객 응대 전략: 1) 다국어 — 기본 인사/안내를 영어/중국어/일본어로 준비(음성+표지판), 2) 다국어 메뉴/카탈로그 — QR코드로 스마트폰 번역 연동, 3) 택스 프리(Tax Free) — 외국인 면세 한도 및 절차 숙지, 환급 카운터 안내, 4) 결제 — 해외 카드(Visa/Master/UnionPay/JCB) 수용, 위챗페이/알리페이 도입, 5) 문화 감수성 — 종교적/문화적 금기 이해(할랄, 채식 등). 면세 매출 비중이 높은 매장은 외국어 가능 직원을 피크 시간대에 우선 배치합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["다문화","외국인","면세","다국어"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('staff_management', 'fnb', 'F&B 알바생 효율적 관리법',
'F&B 아르바이트 관리 핵심: 1) 명확한 역할 분담 — 주문, 서빙, 음료 제조, 세척을 포지션별 배정, 2) 매뉴얼 동영상 — 3분 이내 태스크별 교육 영상(반복 학습 가능), 3) 즉시 피드백 — 실수 발생 시 영업 후 5분 내 코칭(다음 날은 효과 50% 감소), 4) 보상 체계 — 우수 알바 시급 500원 인상, 사이드 메뉴 무료 제공, 5) 소통 — 주간 그룹 채팅방으로 스케줄/공지 공유, 월 1회 피드백 면담. 체계적 관리 시 알바 퇴직률이 월 15%에서 5%로 감소합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","아르바이트","관리","피드백"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '생성형 AI(Generative AI)와 리테일 혁신',
'생성형 AI가 리테일에 가져오는 변화: 1) 개인화 추천 — 고객 프로필 기반 AI 스타일링/메뉴 추천, 2) 콘텐츠 생성 — 상품 설명, SNS 포스트, 이메일 자동 생성, 3) 챗봇 고도화 — 자연스러운 대화형 고객 상담(24시간), 4) 수요 예측 — 날씨/이벤트/트렌드를 종합한 AI 예측, 5) 가격 최적화 — 실시간 수요/경쟁 분석 기반 동적 가격. NeuralTwin AI 어시스턴트는 매장 데이터와 도메인 지식을 결합하여 점장에게 맞춤형 인사이트를 제공합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["생성형AI","GPT","챗봇","NeuralTwin"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'general', '초개인화(Hyper-Personalization) 리테일 전략',
'초개인화는 빅데이터와 AI를 활용하여 개인별 맞춤 경험을 제공하는 전략입니다. 적용 사례: 1) 개인화 이메일/SMS — 이전 구매 기반 상품 추천(전환율 3배), 2) 맞춤 쿠폰 — 구매 패턴에 맞는 할인(일괄 쿠폰 대비 사용률 4배), 3) 동적 앱 화면 — 고객별 다른 홈 화면/추천, 4) 매장 내 개인화 — 앱 로그인 고객에게 입장 시 맞춤 알림, 5) 맞춤형 상품 — 커스터마이징/각인 서비스. 초개인화 적용 기업의 매출 성장률이 비적용 대비 40% 높다는 맥킨지 보고서가 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["초개인화","빅데이터","AI","맞춤"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'beauty', '클린 뷰티(Clean Beauty) 트렌드',
'클린 뷰티는 유해 성분을 배제하고 친환경/윤리적 가치를 추구하는 뷰티 트렌드입니다. 핵심 요소: 1) 성분 투명성 — 전성분 공개, 유해 의심 성분(파라벤, 실리콘, 인공향료) 배제, 2) 비건 — 동물성 원료 미사용, 동물실험 미실시, 3) 친환경 패키지 — 리필 용기, 재활용 가능 소재, 4) 로컬 소싱 — 국내산 자연 원료. 한국 클린 뷰티 시장은 연 30%+ 성장 중이며, 전체 화장품 시장의 15%를 차지합니다. 매장에 "클린 뷰티 존"을 별도 운영하면 MZ세대 유입이 25% 증가합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["클린뷰티","비건","친환경","성분"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', 'MQTT 프로토콜과 IoT 매장 데이터 수집',
'MQTT(Message Queuing Telemetry Transport)는 경량 IoT 통신 프로토콜로, 매장 센서 데이터 수집에 최적입니다. 장점: 1) 초경량 — 2바이트 헤더, 저전력 장치에 적합, 2) 발행-구독(Pub/Sub) 모델 — 센서(Publisher)가 브로커에 데이터 전송, 서버(Subscriber)가 실시간 수신, 3) QoS 레벨 — 0(최대 1회), 1(최소 1회), 2(정확히 1회), 4) 재연결 — 네트워크 불안정 시 자동 재접속. NeuralTwin은 Raspberry Pi + WiFi 프로브 → MQTT 브로커 → Supabase 클라우드 파이프라인으로 센서 데이터를 실시간 수집합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["MQTT","IoT","프로토콜","NeuralTwin"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'general', 'AI 수요 예측(Demand Forecasting) 기술',
'AI 수요 예측은 과거 판매 데이터, 외부 변수(날씨, 이벤트, 경제지표)를 학습하여 미래 수요를 예측합니다. 주요 모델: 1) Prophet(Meta) — 계절성/휴일 자동 반영, 비전문가도 사용 가능, 2) LSTM(딥러닝) — 복잡한 시계열 패턴 학습, 높은 정확도, 3) XGBoost — 외부 변수 통합 용이, 해석 가능성 높음. 정확도: 전통 방법(이동평균) 60~70% vs AI 모델 85~92%. AI 수요 예측 도입 시 재고 비용 20~30% 절감, 품절률 50% 감소, 폐기 손실 40% 감소 효과가 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["AI","수요예측","Prophet","딥러닝"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '장바구니 분석(Market Basket Analysis)',
'장바구니 분석은 고객이 함께 구매하는 상품 조합을 발견하는 기법입니다. 핵심 지표: 1) 지지도(Support) — 두 상품이 함께 구매되는 빈도, 2) 신뢰도(Confidence) — A 구매 시 B도 구매할 확률, 3) 향상도(Lift) — 독립 구매 대비 함께 구매되는 정도(1 초과면 연관성 있음). POS 데이터에서 Apriori 알고리즘으로 연관 규칙을 추출합니다. 발견된 규칙을 크로스 진열, 번들 상품, 추천 시스템에 적용하면 객단가가 10~15% 향상됩니다. 예: 맥주+기저귀 전설은 실제로는 틈새 패턴이 더 가치 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["장바구니분석","연관규칙","Apriori","크로스셀"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '이상 탐지(Anomaly Detection) 매장 적용',
'이상 탐지는 정상 패턴에서 벗어난 데이터를 자동으로 감지하는 AI 기술입니다. 매장 적용 사례: 1) 매출 이상 — 갑작스러운 매출 급감/급증 감지(시스템 오류, 도난, 바이럴 효과), 2) 트래픽 이상 — 평소 대비 비정상적 방문 패턴(주변 이벤트, 경쟁점 오픈), 3) 재고 이상 — POS 매출과 재고 불일치(도난/오류), 4) 환경 이상 — 냉장고 온도 급상승, 전력 과소비. NeuralTwin의 이상 탐지 시스템은 L1(단순 임계치) ~ L4(AI 예측 기반) 4단계로 정교하게 감지합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["이상탐지","AI","매출","NeuralTwin"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'fnb', 'F&B 좌석 효율(RevPASH) 분석',
'RevPASH(Revenue Per Available Seat Hour)는 좌석 시간당 수익으로, F&B 매장의 공간 효율을 측정합니다. 계산: RevPASH = 총매출 ÷ (좌석 수 × 영업시간). 예: 일 매출 200만원, 40석, 12시간 영업 → RevPASH = 200만 ÷ 480 = 4,167원/석/시간. 개선 전략: 1) 피크 타임 회전율 향상(주문→제공 시간 단축), 2) 비피크 타임 프로모션(해피아워), 3) 좌석 유형 최적화(2인석 비중 조절), 4) 테이크아웃/배달 비중 확대(좌석 불필요 매출). 목표 RevPASH는 업태/임대료에 따라 다르며, 월 추이로 효율 개선 여부를 판단합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","RevPASH","좌석효율","회전율"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '매장 환경 규제 — 소음/폐기물/에너지',
'매장 운영 시 환경 관련 규제: 1) 소음 — 주거지 인접 매장은 야간(22~07시) 65dB 이하 유지, BGM/실외기 소음 관리, 2) 폐기물 — 종량제 봉투 사용, 재활용 분리배출 의무, 대규모 사업장은 폐기물 처리 실적 보고, 3) 에너지 — 대형 매장(3000㎡+) 에너지 사용량 신고, 효율 등급 표시, 4) 1회용품 — 매장 내 플라스틱 빨대/컵 사용 제한(과태료 200만원), 5) 간판 — 옥외광고물법에 따른 크기/밝기 제한, 허가 필요. 환경 규제 위반 시 과태료뿐 아니라 브랜드 이미지 손상이 더 큰 리스크입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["환경규제","소음","폐기물","에너지"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'general', '소비자분쟁해결기준 — 환불/교환 규정',
'소비자분쟁해결기준(공정위 고시)에 따른 환불/교환 규정: 1) 의류/신발 — 구매 후 7일 이내, 미착용/택 부착 상태, 세탁/수선 시 교환 불가, 2) 화장품 — 미개봉 7일 이내, 개봉 후 품질 이상 시 환불, 3) 식품 — 유통기한 내 품질 이상 시 환불/교환 + 동일 제품 제공, 4) 가전 — 14일 이내 교환/환불, 1년 내 하자 시 무상 수리. 매장은 자체 환불 정책을 법정 기준보다 관대하게 설정하여 고객 신뢰를 확보하는 것이 일반적입니다(14~30일 교환/환불).',
'{"source":"NeuralTwin Knowledge Base","tags":["소비자분쟁","환불","교환","공정위"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('compliance', 'beauty', '맞춤형 화장품 판매 규정',
'맞춤형 화장품(고객 피부에 맞춰 현장에서 배합하는 화장품) 판매 규정: 1) 신고 — 맞춤형화장품판매업 신고 필수(식약처/지자체), 2) 조제관리사 — 국가자격증 보유자 1인 이상 상시 배치, 3) 사용 원료 — 식약처 고시 원료만 사용, 사용 금지 원료 엄격 준수, 4) 기록 — 고객별 배합 내역 3년 보관, 5) 표시 — 전성분, 사용기한, 보관방법 기재, 6) 위생 — 배합 공간 청결, 도구 소독, 직원 위생. 맞춤형 화장품 시장은 연 40% 성장 중이며, 올리브영/아모레 등이 적극 진출하고 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["맞춤형화장품","조제관리사","규정","식약처"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'fashion', '패션 색상 트렌드 반영 전략',
'패션 매장의 색상 트렌드 반영: 1) 트렌드 파악 — 팬톤 올해의 색, 패션위크 런웨이, SNS 해시태그 분석, 2) 발주 비율 — 트렌드 색상 20~30%, 베이직 색상(블랙/화이트/네이비/베이지) 50~60%, 시즌 색상 10~20%, 3) VMD — 트렌드 색상을 입구/쇼윈도에 집중 배치(시선 유인), 4) 리오더 — 트렌드 색상 초기 소량 발주 후 반응 확인 → 빠른 리오더, 5) 색상 조합 — 상보색/유사색 코디 디스플레이. 트렌드 색상 상품의 SNS 공유율은 베이직 색상의 3배이며 신규 고객 유입에 효과적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","색상","트렌드","팬톤"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('product_management', 'lifestyle', '라이프스타일 매장 가격대 피라미드 설계',
'라이프스타일 매장의 가격대 피라미드: 1) 엔트리(1~3만원, 전체 SKU의 40%) — 캔들, 문구, 소품 등 부담 없는 가격대, 충동구매 유도, 2) 미드(5~15만원, 35%) — 식기, 조명, 패브릭 등 핵심 상품군, 3) 프리미엄(20만원+, 25%) — 가구, 가전, 아트 등 앵커 상품. 엔트리 상품이 트래픽을 모으고, 프리미엄 상품이 브랜드 이미지를 높이며, 미드 상품이 실질 매출을 견인합니다. 고객의 50%는 엔트리로 첫 구매 후 미드 구매로 이동하는 업그레이드 패턴을 보입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["라이프스타일","가격대","피라미드","SKU"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'beauty', '뷰티 멤버십 데이 운영 전략',
'뷰티 매장 멤버십 데이(회원 전용 할인 행사) 운영: 1) 빈도 — 월 1회, 3일간(금~일), 2) 혜택 — 전 상품 20~30% 할인 + 포인트 2배 적립, 3) VIP 추가 혜택 — 사전 구매(1일 얼리 액세스) + 추가 5% 할인, 4) 비회원 유도 — "오늘 가입하면 즉시 혜택" 프로모션(가입 전환율 50%+), 5) 프로모션 — 사전 카카오톡 알림(D-7, D-1), 매장 내 카운트다운 POP. 멤버십 데이 매출은 평시의 3~5배이며, 비회원의 30%가 이 계기로 신규 가입합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["뷰티","멤버십","할인","VIP"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('marketing', 'department_store', '백화점 문화 마케팅 전략',
'백화점의 문화 마케팅은 프리미엄 브랜드 이미지와 집객을 동시에 달성합니다. 주요 프로그램: 1) 아트 전시 — 로비/복도에 미술 작품 전시(무료, 문화 공간 이미지), 2) 문화센터 — 요리/운동/어학 강좌(수강생의 70%가 매장 구매), 3) 공연/콘서트 — 시즌별 테마 공연(크리스마스 캐럴, 재즈 나이트), 4) 키즈 프로그램 — 체험 교실(가족 고객 유입), 5) VIP 전용 문화행사 — 와인 디너, 작가와의 만남. 문화 프로그램 참여 고객의 매장 체류시간은 비참여 고객의 2.5배입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","문화마케팅","전시","문화센터"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('technology', 'lifestyle', '라이프스타일 매장 AR(증강현실) 활용',
'AR 기술의 라이프스타일 매장 활용: 1) 가구 배치 시뮬레이션 — 고객 집에 가구를 가상 배치(IKEA Place 앱 사례), 2) 벽지/페인트 시뮬레이션 — 벽면 색상 미리보기, 3) 식물 배치 — 공간에 맞는 식물 크기/종류 확인, 4) 제품 정보 — 상품에 스마트폰 비추면 성분/리뷰/코디 표시, 5) 인터랙티브 체험 — AR 스탬프 투어, 보물찾기 이벤트. AR 기능을 사용한 고객의 구매 전환율이 40% 높으며, 반품율은 25% 낮습니다(사전 확인 효과).',
'{"source":"NeuralTwin Knowledge Base","tags":["AR","증강현실","라이프스타일","가구"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'department_store', '백화점 쇼핑 동기 분석',
'백화점 방문 동기는 크게 4가지로 분류됩니다: 1) 목적형(35%) — 특정 상품 구매 목적, 짧은 체류, 높은 전환율, 2) 탐색형(30%) — 트렌드 체크, 윈도 쇼핑, 긴 체류, 중간 전환율, 3) 여가형(20%) — 식사/카페/문화 목적, 가장 긴 체류, 부수 구매, 4) 선물형(15%) — 기념일/명절, 높은 객단가, VIP 고객 다수. 각 동기별로 다른 접객 전략을 적용합니다. 목적형에게는 빠른 안내, 탐색형에게는 자유 탐색 후 적시 제안, 여가형에게는 체류 편의, 선물형에게는 래핑/추천 서비스가 효과적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["백화점","쇼핑동기","접객","세그먼트"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('customer_behavior', 'fnb', 'F&B 메뉴 선택 행동 심리학',
'고객의 메뉴 선택 행동에 영향을 미치는 심리 요인: 1) 시선 패턴 — 메뉴판 우측 상단에 시선이 가장 먼저 감(수익성 높은 메뉴 배치), 2) 선택 과부하 — 카테고리당 7개 이하가 최적(너무 많으면 기본 메뉴 선택), 3) 사진 효과 — 사진 있는 메뉴 주문율 30% 증가, 4) 설명 효과 — "제주산 흑돼지" vs "돼지고기"(프리미엄 언어 사용 시 주문율 27% 증가), 5) 디코이 효과 — 3가지 사이즈 중 가운데 선택 유도. 디지털 메뉴보드는 시간대별 추천 메뉴를 자동 변경할 수 있어 효과적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","메뉴심리","선택행동","디코이"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'fashion', '패션 온디맨드 생산(On-Demand Manufacturing)',
'온디맨드 생산은 주문이 들어온 후에 제작하는 모델로, 재고 리스크를 원천적으로 줄입니다. 적용 사례: 1) 커스터마이징 — 고객이 원하는 색상/사이즈/디테일로 제작(3~7일 소요), 2) 소량 다품종 — AI 트렌드 분석 → 50~100장 소량 생산 → 반응 확인 → 추가 생산, 3) 디지털 프린팅 — 무재고 티셔츠/에코백 제작(원하는 디자인 즉시 생산). 쉬인(SHEIN)은 이 모델로 재고율을 업계 평균 30% 대비 5% 미만으로 관리합니다. 한국에서도 무신사, 에이블리가 소량 다품종 모델을 도입 중입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["패션","온디맨드","커스터마이징","소량생산"],"difficulty":"advanced"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('industry_trends', 'fnb', 'F&B 로봇 서비스 매장 트렌드',
'F&B 매장의 로봇 도입이 빠르게 확산되고 있습니다. 유형: 1) 서빙 로봇 — 주방에서 테이블까지 음식 운반(배달의민족 딜리 등), 2) 바리스타 로봇 — 커피 자동 추출(비트로봇), 3) 조리 로봇 — 치킨/튀김 자동 조리, 4) 안내/접수 로봇 — 대기 접수, 메뉴 안내. 효과: 인건비 30% 절감, 서빙 시간 40% 단축, 화제성(SNS 바이럴). 한계: 초기 투자 2000~5000만원, 좁은 매장 운용 어려움, 고령 고객 불편. 로봇+인간 하이브리드 모델이 가장 효율적입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["F&B","로봇","서빙","자동화"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('store_operations', 'general', '매장 방역/위생 관리 강화 기준',
'포스트 코로나 시대의 매장 위생 관리 강화 기준: 1) 소독 — 문손잡이, 계산대, 장바구니 2시간마다 소독, 2) 환기 — 시간당 최소 2회 환기 또는 공기청정기(HEPA 필터) 운영, 3) 손 세정 — 입구에 손 세정제 비치, 정기 보충, 4) 직원 건강 — 출근 시 체온 체크, 증상 시 즉시 귀가, 5) 밀집 관리 — 매장 면적당 인원 제한(10㎡당 1인 기준), 대기줄 간격 1m. 위생 관리 수준이 높은 매장의 고객 신뢰도는 30% 이상 높으며, 이는 재방문율 향상으로 직결됩니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["방역","위생","소독","환기"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('analytics', 'general', '매장 ROI 분석 — 투자 대비 수익 측정',
'매장 투자별 ROI(Return on Investment) 측정법: 1) VMD 변경 ROI = (변경 후 매출 증가분 - 변경 비용) ÷ 변경 비용, 2) 센서/IoT 투자 ROI = (운영비 절감 + 매출 증가) ÷ 설치 비용, 3) 직원 교육 ROI = (교육 후 개인매출 증가분 × 12개월) ÷ 교육 비용, 4) 마케팅 ROI = (캠페인 기간 증가 매출이익) ÷ 캠페인 비용. 모든 투자에 대해 사전 목표 ROI를 설정하고(최소 200%), 6~12개월 후 실제 ROI를 측정합니다. ROI가 100% 미만인 투자는 중단하거나 전략을 수정합니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["ROI","투자","분석","효과측정"],"difficulty":"intermediate"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '소상공인 매장 — 네이버 플레이스 최적화 가이드',
'네이버 플레이스(스마트플레이스)는 소상공인의 가장 강력한 무료 마케팅 도구입니다. 최적화 포인트: 1) 기본정보 100% 기입(영업시간, 주소, 전화, 메뉴/가격, 편의시설), 2) 사진 — 대표사진 1장 + 내부/외부/상품 사진 10장+(전문 촬영 권장), 3) 리뷰 관리 — 5.0 리뷰 목표 아닌 4.5+ 리뷰 목표(자연스러운 신뢰), 4) 소식/알림 — 주 1~2회 신메뉴/이벤트 포스팅, 5) 키워드 — 업종+지역명 조합("강남 파스타", "홍대 네일샵"). 최적화 후 네이버 지도 노출이 3~5배 증가하며, 신규 방문 고객의 40%가 네이버 검색 유입입니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["네이버플레이스","소상공인","SEO","리뷰"],"difficulty":"basic"}'::jsonb);

INSERT INTO retail_knowledge_chunks (category, industry, title, content, metadata)
VALUES ('best_practices', 'general', '매장 운영 자동화 — 반복 업무 제거',
'매장 운영에서 자동화 가능한 반복 업무: 1) 재고 발주 — 안전재고 도달 시 자동 발주 알림/실행, 2) 직원 스케줄 — AI 기반 자동 배정(선호도/기술/법적 제한 반영), 3) 가격 관리 — ESL로 원격 일괄 변경, 4) 매출 리포트 — 일일/주간 자동 생성 및 발송, 5) 고객 메시지 — 구매 감사/리뷰 요청/생일 쿠폰 자동 발송, 6) 환경 관리 — IoT로 온도/조명/음악 자동 조절. 자동화로 점장의 관리 업무 시간을 하루 2~3시간 절감하면, 그 시간을 고객 경험 개선과 전략적 의사결정에 투자할 수 있습니다.',
'{"source":"NeuralTwin Knowledge Base","tags":["자동화","운영효율","IoT","AI"],"difficulty":"intermediate"}'::jsonb);

COMMIT;
