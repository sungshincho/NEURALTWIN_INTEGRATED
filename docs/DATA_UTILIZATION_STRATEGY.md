# WiFi 트래킹 데이터 활용 전략 가이드

## 📊 데이터셋 개요

### 1. Raw Data (원시 데이터)
**내용**: 라즈베리파이 센서에서 직접 수집한 RSSI 신호 강도

```csv
timestamp,mac_address,sensor_id,rssi
2024-03-15T10:30:00Z,AA:BB:CC:DD:EE:01,sensor_01,-45
2024-03-15T10:30:01Z,AA:BB:CC:DD:EE:01,sensor_02,-55
2024-03-15T10:30:01Z,AA:BB:CC:DD:EE:01,sensor_03,-65
```

**특징:**
- ✅ 원본 데이터 (재처리 가능)
- ✅ 센서별 개별 신호 추적
- ✅ 신호 강도 패턴 분석 가능
- ✅ 디바이스 핑거프린팅 가능
- ⚠️ 저장 공간 많이 필요
- ⚠️ 실시간 처리 부하 높음

### 2. Post-Processed Data (후처리 데이터)
**내용**: Trilateration으로 추정된 방문객 위치 좌표

```csv
timestamp,session_id,x,z,accuracy,status
2024-03-15T10:30:00Z,session_001,2.5,3.0,1.5,browsing
2024-03-15T10:30:05Z,session_001,3.2,3.8,1.2,browsing
2024-03-15T10:30:10Z,session_001,4.0,4.5,1.8,browsing
```

**특징:**
- ✅ 바로 시각화 가능
- ✅ 처리 부하 적음
- ✅ 동선/히트맵 즉시 생성
- ✅ 저장 공간 효율적
- ❌ 재처리 불가능
- ❌ 원본 신호 정보 손실

## 🎯 효과적인 활용 전략

### 전략 A: 하이브리드 저장 (권장)

```
┌─────────────────┐
│ 라즈베리파이     │
│ WiFi Sensors    │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
    [Raw RSSI]         [Trilateration]   [검증/필터링]
         │                  │                  │
         v                  v                  v
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
│ Supabase        │  │ Supabase     │  │ 세션 그룹핑   │
│ wifi_raw_data   │  │ wifi_         │  │ 통계 계산    │
│ (7일 보관)      │  │ tracking     │  │              │
└─────────────────┘  └──────┬───────┘  └──────┬───────┘
                            │                  │
                            v                  v
                     ┌──────────────────────────────┐
                     │ 3D Digital Twin              │
                     │ - 실시간 아바타 렌더링        │
                     │ - 히트맵 시각화              │
                     │ - 경로 추적                  │
                     └──────────────────────────────┘
```

**저장 전략:**
1. **Raw Data**: 7일 보관 → 검증/디버깅/재처리용
2. **Processed Data**: 30일 보관 → 실시간 시각화/분석용
3. **Aggregated Data**: 무기한 → 히트맵, 통계 리포트용

### 전략 B: 실시간 우선 (리소스 제약 시)

```
라즈베리파이 → [실시간 Trilateration] → Processed만 저장
                                        → 3D 시각화
```

**특징:**
- ✅ 저장 공간 최소화
- ✅ 실시간 성능 최적
- ❌ 재처리 불가
- ❌ 디버깅 어려움

## 📁 Supabase 테이블 설계

### 테이블 1: wifi_raw_signals (Raw Data)
```sql
CREATE TABLE public.wifi_raw_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  mac_address TEXT NOT NULL,
  sensor_id TEXT NOT NULL,
  rssi INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7일 후 자동 삭제 (스토리지 절약)
CREATE INDEX idx_wifi_raw_timestamp ON wifi_raw_signals(timestamp);
```

### 테이블 2: wifi_tracking (Processed Data)
```sql
CREATE TABLE public.wifi_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  x DECIMAL(10,2),
  z DECIMAL(10,2),
  accuracy DECIMAL(10,2),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 실시간 구독용
ALTER PUBLICATION supabase_realtime ADD TABLE wifi_tracking;
```

### 테이블 3: wifi_heatmap_cache (Aggregated)
```sql
CREATE TABLE public.wifi_heatmap_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  date DATE NOT NULL,
  hour INTEGER NOT NULL,
  grid_x INTEGER NOT NULL,
  grid_z INTEGER NOT NULL,
  visit_count INTEGER NOT NULL,
  avg_dwell_time DECIMAL(10,2),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, date, hour, grid_x, grid_z)
);
```

## 🚀 단계별 구현 가이드

### Step 1: 데이터 업로드

#### Option 1: CSV 일괄 업로드 (테스트/초기 로드)
```typescript
import { supabase } from '@/integrations/supabase/client';
import { loadCSVFromPublic } from '@/utils/wifiDataLoader';

// 1. Raw data 업로드
const rawData = await loadCSVFromPublic('wifi_raw_signals.csv');
await supabase.from('wifi_raw_signals').insert(rawData);

// 2. Processed data 업로드
const processedData = await loadCSVFromPublic('wifi_tracking.csv');
await supabase.from('wifi_tracking').insert(processedData);
```

#### Option 2: 실시간 스트리밍 (운영)
```python
# 라즈베리파이에서 실행
import requests
from datetime import datetime

def send_to_supabase(sensor_id, mac, rssi, position):
    # Raw data 전송
    requests.post(
        'https://fbffryjvvykhgoviektl.supabase.co/rest/v1/wifi_raw_signals',
        json={
            'store_id': STORE_ID,
            'timestamp': datetime.now().isoformat(),
            'mac_address': mac,
            'sensor_id': sensor_id,
            'rssi': rssi
        },
        headers={'apikey': SUPABASE_KEY}
    )
    
    # Processed data 전송 (이미 좌표 계산된 경우)
    if position:
        requests.post(
            'https://fbffryjvvykhgoviektl.supabase.co/rest/v1/wifi_tracking',
            json={
                'store_id': STORE_ID,
                'timestamp': datetime.now().isoformat(),
                'session_id': calculate_session_id(mac),
                'x': position['x'],
                'z': position['z'],
                'accuracy': position['accuracy']
            },
            headers={'apikey': SUPABASE_KEY}
        )
```

### Step 2: 실시간 시각화

```typescript
// 3D Digital Twin에서 실시간 구독
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function useRealtimeWiFiTracking(storeId: string) {
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    // Processed data 실시간 구독
    const channel = supabase
      .channel('wifi-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wifi_tracking',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          setPositions(prev => [...prev.slice(-100), payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return positions;
}
```

### Step 3: 백그라운드 집계 처리

```typescript
// Supabase Edge Function: aggregate-wifi-data
export async function aggregateHeatmap(storeId: string, date: Date) {
  const startOfHour = new Date(date);
  startOfHour.setMinutes(0, 0, 0);
  
  const endOfHour = new Date(startOfHour);
  endOfHour.setHours(endOfHour.getHours() + 1);

  // Processed data에서 집계
  const { data } = await supabase
    .from('wifi_tracking')
    .select('x, z, timestamp')
    .eq('store_id', storeId)
    .gte('timestamp', startOfHour.toISOString())
    .lt('timestamp', endOfHour.toISOString());

  // 그리드별 방문 횟수 계산
  const gridSize = 1.0;
  const heatmap = new Map();
  
  data?.forEach(point => {
    const gridX = Math.floor(point.x / gridSize);
    const gridZ = Math.floor(point.z / gridSize);
    const key = `${gridX},${gridZ}`;
    heatmap.set(key, (heatmap.get(key) || 0) + 1);
  });

  // 캐시 저장
  const records = Array.from(heatmap.entries()).map(([key, count]) => {
    const [gridX, gridZ] = key.split(',').map(Number);
    return {
      store_id: storeId,
      date: date.toISOString().split('T')[0],
      hour: startOfHour.getHours(),
      grid_x: gridX,
      grid_z: gridZ,
      visit_count: count
    };
  });

  await supabase.from('wifi_heatmap_cache').upsert(records);
}
```

## 🎨 활용 시나리오별 가이드

### 시나리오 1: 실시간 모니터링 (운영 중)
**목적**: 현재 매장 내 방문객 실시간 추적

**사용 데이터**: Post-processed (wifi_tracking)
```typescript
// 최근 5분간 데이터
const recentPositions = await supabase
  .from('wifi_tracking')
  .select('*')
  .eq('store_id', storeId)
  .gte('timestamp', fiveMinutesAgo)
  .order('timestamp', { ascending: false });

// 3D 아바타 렌더링
<WiFiTrackingOverlay 
  trackingData={recentPositions} 
  mode="realtime"
/>
```

### 시나리오 2: 히트맵 분석 (주간/월간)
**목적**: 인기 구역 파악, 레이아웃 최적화

**사용 데이터**: Aggregated (wifi_heatmap_cache)
```typescript
// 지난 주 집계 데이터
const weeklyHeatmap = await supabase
  .from('wifi_heatmap_cache')
  .select('grid_x, grid_z, visit_count')
  .eq('store_id', storeId)
  .gte('date', lastWeekStart)
  .lt('date', lastWeekEnd);

// 히트맵 시각화
<WiFiTrackingOverlay 
  trackingData={convertToHeatmap(weeklyHeatmap)} 
  mode="heatmap"
/>
```

### 시나리오 3: 디버깅/검증
**목적**: 센서 정확도 검증, 알고리즘 튜닝

**사용 데이터**: Raw (wifi_raw_signals)
```typescript
// 특정 시간대 원시 신호 분석
const rawSignals = await supabase
  .from('wifi_raw_signals')
  .select('*')
  .eq('store_id', storeId)
  .eq('mac_address', targetMac)
  .gte('timestamp', startTime)
  .lte('timestamp', endTime)
  .order('timestamp');

// 센서별 RSSI 그래프
<RSSIChart signals={rawSignals} />

// 재처리 및 비교
const reprocessed = trilaterate(rawSignals, sensors);
const original = getProcessedData(targetMac, startTime);
compareAccuracy(reprocessed, original);
```

### 시나리오 4: 경로 분석
**목적**: 고객 동선 파악, 체류 시간 분석

**사용 데이터**: Post-processed (wifi_tracking)
```typescript
// 세션별 경로 추출
const sessions = groupBySession(trackingData);

sessions.forEach(session => {
  const dwellTime = calculateDwellTime(session);
  const path = extractPath(session);
  const zones = identifyZones(path);
  
  console.log({
    sessionId: session.id,
    duration: dwellTime,
    visitedZones: zones,
    pathLength: path.length
  });
});

// 3D 경로 시각화
<WiFiTrackingOverlay 
  trackingData={trackingData} 
  mode="paths"
/>
```

## 📈 성능 최적화 전략

### 1. 데이터 계층화
```
[실시간 레이어] (메모리)
  ↓ 5분마다
[단기 레이어] (Supabase, 7일)
  ↓ 매시간
[장기 레이어] (집계, 무기한)
```

### 2. 인덱싱 전략
```sql
-- 실시간 쿼리 최적화
CREATE INDEX idx_tracking_store_time 
ON wifi_tracking(store_id, timestamp DESC);

-- 세션 쿼리 최적화
CREATE INDEX idx_tracking_session 
ON wifi_tracking(session_id, timestamp);

-- 히트맵 캐시 조회 최적화
CREATE INDEX idx_heatmap_lookup 
ON wifi_heatmap_cache(store_id, date, hour);
```

### 3. 자동 정리 (Supabase Edge Function)
```typescript
// 매일 실행: cleanup-old-data
export async function cleanupOldData() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Raw data 삭제 (7일 이상)
  await supabase
    .from('wifi_raw_signals')
    .delete()
    .lt('timestamp', sevenDaysAgo.toISOString());

  // Processed data 삭제 (30일 이상)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await supabase
    .from('wifi_tracking')
    .delete()
    .lt('timestamp', thirtyDaysAgo.toISOString());
}
```

## 🎯 핵심 권장사항

### ✅ DO
1. **Raw data**: 7일간 보관 → 디버깅/검증용
2. **Processed data**: 실시간 시각화 + 30일 보관
3. **Aggregated data**: 무기한 보관 → 트렌드 분석
4. **실시간 구독**: Processed data만 구독
5. **히트맵/리포트**: Aggregated cache 사용

### ❌ DON'T
1. Raw data를 실시간 시각화에 직접 사용 (너무 무거움)
2. Processed data 없이 매번 Trilateration (CPU 낭비)
3. 집계 없이 장기 데이터 직접 조회 (느림)
4. MAC 주소 원본 장기 저장 (프라이버시 위반)
5. 무한정 데이터 축적 (스토리지 비용↑)

## 📊 데이터 흐름 요약

```
실시간 (< 5분)    → Processed 직접 조회 → 3D 시각화
단기 분석 (1-7일)  → Processed 집계     → 일간 리포트
장기 분석 (1개월+) → Aggregated Cache  → 월간 트렌드
디버깅/검증        → Raw 재처리         → 알고리즘 개선
```

## 🚀 다음 단계

1. ✅ Supabase 테이블 생성 (마이그레이션)
2. ✅ CSV → Supabase 업로드 스크립트
3. ✅ 실시간 구독 구현
4. ✅ 히트맵 캐시 생성 Edge Function
5. 🔄 라즈베리파이 실시간 연동
