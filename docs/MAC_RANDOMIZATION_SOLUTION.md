# MAC 주소 랜덤화 문제와 해결 방안

## 📱 문제 정의

### MAC 주소 랜덤화란?
현대 모바일 기기(iOS 14+, Android 10+)는 프라이버시 보호를 위해 WiFi probe request를 보낼 때 **실제 MAC 주소 대신 랜덤 MAC 주소**를 사용합니다.

### 영향
- ❌ 같은 사람이 매번 다른 MAC 주소로 감지됨
- ❌ 개별 고객 추적이 사실상 불가능
- ❌ 재방문 고객 식별 불가
- ❌ 경로 추적 정확도 감소
- ❌ 고유 방문자 수 계산 부정확

## ✅ 해결 방안

### 1. 세션 기반 그룹핑 (Session-Based Grouping)

**개념**: 짧은 시간 내 유사한 패턴을 보이는 신호를 하나의 세션으로 묶음

```typescript
// 구현 예시
const sessions = groupBySession(trackingData, {
  timeThreshold: 300000,  // 5분
  rssiThreshold: 10,      // RSSI 차이 10dBm
  locationThreshold: 15   // 위치 15m
});
```

**판단 기준:**
- ⏱️ **시간 근접성**: 5분 이내 신호
- 📶 **RSSI 패턴**: 신호 강도 변화 유사성
- 📍 **위치 일관성**: 이동 거리 15m 이내
- 🔍 **센서 패턴**: 동일한 센서 조합에서 감지

**장점:**
- ✅ 단기 동선 추적 가능 (5-10분)
- ✅ 실시간 모니터링 가능
- ✅ 체류 시간 측정 가능

**단점:**
- ❌ 장기 추적 불가능 (10분 이상)
- ❌ 재방문 고객 식별 불가

### 2. 집계 기반 분석 (Aggregate Analysis)

**개념**: 개별 추적 대신 통계 데이터에 집중

```typescript
// 히트맵 생성
const heatmap = convertToHeatmapData(trackingData, gridSize);

// 구역별 체류 시간
const zoneStats = calculateZoneStats(trackingData);

// 시간대별 방문자 수
const hourlyTraffic = groupByHour(trackingData);
```

**분석 가능 항목:**
- 📊 **히트맵**: 어느 구역이 인기있는가?
- ⏰ **피크 타임**: 언제 가장 붐비는가?
- 🚶 **체류 시간**: 평균 체류 시간은?
- 🔄 **동선 패턴**: 입구→출구 흐름은?

**장점:**
- ✅ MAC 랜덤화 영향 최소화
- ✅ 통계적으로 유의미한 인사이트
- ✅ 프라이버시 보호
- ✅ GDPR/개인정보보호법 준수

**단점:**
- ❌ 개별 고객 행동 분석 불가

### 3. 통계적 방문자 수 추정

**개념**: 세션 패턴 분석으로 실제 방문자 수 추정

```typescript
const estimatedVisitors = estimateUniqueVisitors(
  trackingData,
  timeWindow: 3600000 // 1시간 단위
);
```

**추정 방법:**
1. 세션 그룹핑 수행
2. 시간 윈도우별 세션 수 계산
3. 중복 제거 알고리즘 적용
4. 평균 체류 시간 고려

**정확도:**
- 📈 오차 범위: ±20-30%
- 📈 샘플 크기가 클수록 정확도 향상
- 📈 장기 트렌드 분석에 적합

### 4. 디바이스 핑거프린팅 (고급)

**개념**: RSSI 패턴, 신호 특성으로 디바이스 구별

```typescript
interface DeviceFingerprint {
  rssiPattern: number[];      // RSSI 변화 패턴
  sensorSignature: string[];  // 감지 센서 조합
  signalVariance: number;     // 신호 분산
  movementPattern: string;    // 이동 패턴
}
```

**특징:**
- 🎯 정확도: 60-70%
- 🎯 짧은 시간(10-20분) 동안만 유효
- 🎯 복잡한 알고리즘 필요

## 🎯 권장 전략

### 단기 분석 (실시간 ~ 1시간)
✅ **세션 기반 그룹핑** 사용
- 현재 매장 내 방문객 수
- 실시간 동선 추적
- 구역별 체류 시간

### 장기 분석 (일별, 주별, 월별)
✅ **집계 기반 분석** 사용
- 히트맵 (일주일 평균)
- 피크 타임 분석
- 구역별 인기도 비교

### 방문자 수 리포트
✅ **통계적 추정** 사용
- 시간당 평균 방문자
- 일일 방문자 추세
- 주간 비교

## 📊 실무 적용 예시

### 매장 운영 최적화
```typescript
// 1. 현재 혼잡도 (실시간)
const currentCrowd = getCurrentSessions().length;

// 2. 인기 구역 파악 (일주일)
const hotZones = getWeeklyHeatmap();

// 3. 스태프 배치 최적화 (시간대별)
const peakHours = getPeakHours();
```

### 레이아웃 변경 효과 측정
```typescript
// 변경 전
const beforeStats = analyzeTraffic('2024-01-01', '2024-01-31');

// 변경 후
const afterStats = analyzeTraffic('2024-02-01', '2024-02-28');

// 비교
const improvement = calculateImprovement(beforeStats, afterStats);
```

## 🔒 프라이버시 보호

### 데이터 보존 정책
- ✅ 원시 데이터: **24시간** 보관 후 삭제
- ✅ 세션 데이터: **7일** 보관
- ✅ 집계 데이터: **무기한** (개인정보 없음)

### 익명화 처리
```typescript
// MAC 주소를 세션 ID로 변환 (원본 삭제)
const sessionId = hashToSession(macAddress, timestamp);

// 원시 MAC 주소는 저장하지 않음
saveTrackingData({
  session_id: sessionId,  // 해시된 세션 ID만
  timestamp,
  rssi,
  location
});
```

## 🚀 향후 개선 방향

### 1. WiFi + 블루투스 비콘 조합
- 비콘: 앱 설치 고객 정확 추적
- WiFi: 전체 방문객 트렌드 파악

### 2. AI 기반 패턴 학습
- 머신러닝으로 세션 그룹핑 정확도 향상
- 이동 패턴 예측

### 3. 옵트인 정밀 추적
- 동의한 고객만 앱을 통해 정밀 추적
- WiFi는 전체 통계용으로만 사용

## 📚 참고 자료

- [Apple: Wi-Fi privacy](https://support.apple.com/en-us/HT211227)
- [Android: MAC randomization behavior](https://source.android.com/docs/core/connect/wifi-mac-randomization)
- [IEEE: Location tracking with randomized MAC addresses](https://ieeexplore.ieee.org/)
