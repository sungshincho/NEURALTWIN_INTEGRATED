# IoT 트래킹 데이터 연동 가이드

## 📅 작성일: 2025-11-13

---

## 🎯 개요

NEURALTWIN의 3D Digital Twin 시스템을 실제 IoT 센서 데이터와 연동하여 실시간 고객 트래킹 및 위치 시각화를 구현하는 방법을 설명합니다.

---

## 🏗️ 시스템 아키텍처

```
IoT 센서 (WiFi/BLE/Camera)
    ↓
[트래킹 데이터 수집]
    ↓
Supabase Realtime (Broadcast)
    ↓
[삼각측량 + 칼만 필터]
    ↓
Supabase Realtime (Presence)
    ↓
3D 고객 아바타 렌더링
```

---

## 📊 필요한 데이터베이스 테이블

### 1. stores 테이블 (기존)
매장 공간 메타데이터 추가:

```sql
ALTER TABLE stores 
ADD COLUMN metadata JSONB;

-- 메타데이터 예시
UPDATE stores SET metadata = '{
  "real_width": 20,
  "real_depth": 15,
  "real_height": 3,
  "model_scale": 1.0,
  "origin_offset": {"x": 0, "y": 0, "z": 0},
  "zones": [
    {
      "zone_id": "entrance",
      "zone_name": "입구",
      "zone_type": "entrance",
      "bounds": {"min_x": -10, "max_x": -5, "min_z": -7.5, "max_z": 7.5}
    },
    {
      "zone_id": "checkout",
      "zone_name": "계산대",
      "zone_type": "checkout",
      "bounds": {"min_x": 5, "max_x": 10, "min_z": -7.5, "max_z": 7.5}
    }
  ]
}'::jsonb
WHERE id = 'your-store-id';
```

### 2. iot_sensors 테이블 (신규)
IoT 센서 위치 정보:

```sql
CREATE TABLE iot_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sensor_id TEXT NOT NULL UNIQUE,
  sensor_type TEXT NOT NULL CHECK (sensor_type IN ('wifi', 'bluetooth', 'camera', 'beacon', 'rfid')),
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  coverage_radius REAL DEFAULT 10.0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE iot_sensors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sensors for their stores"
  ON iot_sensors FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );
```

### 3. 샘플 센서 데이터 삽입

```sql
INSERT INTO iot_sensors (store_id, sensor_id, sensor_type, position_x, position_y, position_z, coverage_radius)
VALUES 
  ('your-store-id', 'wifi-ap-01', 'wifi', 0, 2.5, -7, 8),
  ('your-store-id', 'wifi-ap-02', 'wifi', -8, 2.5, 0, 8),
  ('your-store-id', 'wifi-ap-03', 'wifi', 8, 2.5, 0, 8),
  ('your-store-id', 'ble-beacon-01', 'bluetooth', 0, 1.5, 7, 5),
  ('your-store-id', 'camera-01', 'camera', 0, 2.8, 0, 12);
```

---

## 🔌 IoT 디바이스에서 데이터 전송

### WiFi/Bluetooth 센서 예시 (Python)

```python
from supabase import create_client
import time
import random

# Supabase 클라이언트 초기화
supabase = create_client(
    "https://your-project.supabase.co",
    "your-service-role-key"
)

store_id = "your-store-id"
sensor_id = "wifi-ap-01"

while True:
    # 센서가 감지한 디바이스 정보
    detected_devices = scan_nearby_devices()  # 구현 필요
    
    for device in detected_devices:
        tracking_data = {
            "customer_id": device["mac_address"],
            "timestamp": int(time.time() * 1000),
            "sensor_id": sensor_id,
            "signal_strength": device["rssi"],  # -100 ~ 0 dBm
            "status": "browsing"
        }
        
        # Supabase Realtime Broadcast로 전송
        channel = supabase.channel(f"store-tracking-{store_id}")
        channel.subscribe()
        channel.send_broadcast(
            event="tracking-update",
            payload=tracking_data
        )
    
    time.sleep(1)  # 1초마다 업데이트
```

### Edge Function으로 데이터 수집 (대안)

```typescript
// supabase/functions/iot-collector/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const { sensor_id, devices } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // 센서 정보 조회
  const { data: sensor } = await supabase
    .from('iot_sensors')
    .select('store_id')
    .eq('sensor_id', sensor_id)
    .single();
  
  if (!sensor) {
    return new Response('Sensor not found', { status: 404 });
  }
  
  // Broadcast로 전송
  const channel = supabase.channel(`store-tracking-${sensor.store_id}`);
  
  for (const device of devices) {
    await channel.send({
      type: 'broadcast',
      event: 'tracking-update',
      payload: {
        customer_id: device.id,
        timestamp: Date.now(),
        sensor_id: sensor_id,
        signal_strength: device.rssi,
        status: 'browsing'
      }
    });
  }
  
  return new Response('OK', { status: 200 });
});
```

---

## 🎨 프론트엔드 통합

### 1. 실시간 트래킹 사용

```typescript
import { RealtimeCustomerOverlay } from '@/features/digital-twin/components/overlays';
import { Store3DViewer } from '@/features/digital-twin/components';

function MyStorePage() {
  const { selectedStore } = useSelectedStore();
  
  return (
    <Store3DViewer
      height="600px"
      overlay={
        <RealtimeCustomerOverlay
          storeId={selectedStore.id}
          maxInstances={200}
          showDebugInfo
        />
      }
    />
  );
}
```

### 2. useRealtimeTracking 훅 직접 사용

```typescript
import { useRealtimeTracking } from '@/features/digital-twin/hooks/useRealtimeTracking';

function CustomTrackingView() {
  const { avatars, isConnected, sensorCount, lastUpdate } = useRealtimeTracking({
    storeId: 'your-store-id',
    enabled: true
  });
  
  return (
    <div>
      <p>연결 상태: {isConnected ? '연결됨' : '연결 끊김'}</p>
      <p>활성 센서: {sensorCount}개</p>
      <p>현재 고객: {avatars.length}명</p>
      <p>마지막 업데이트: {new Date(lastUpdate).toLocaleTimeString()}</p>
    </div>
  );
}
```

---

## 🧮 좌표 변환 시스템

### 실제 매장 좌표계
- 원점: 매장 좌측 하단 모서리
- X축: 매장 너비 방향 (미터)
- Z축: 매장 깊이 방향 (미터)
- Y축: 높이 (미터)

### 3D 모델 좌표계
- 원점: 3D 씬 중앙 (0, 0, 0)
- 매장 메타데이터의 `model_scale`로 스케일 조정

### 좌표 변환 예시

```typescript
import { realToModel, modelToReal } from '@/features/digital-twin/utils/coordinateMapper';

// 실제 좌표 (10m, 5m) → 3D 모델 좌표
const metadata = {
  real_width: 20,
  real_depth: 15,
  model_scale: 1.0,
  origin_offset: { x: 0, y: 0, z: 0 }
};

const modelPos = realToModel(10, 5, metadata);
// 결과: { x: 0, z: -2.5 } (매장 중앙 기준)

// 3D 모델 좌표 → 실제 좌표
const realPos = modelToReal(0, -2.5, metadata);
// 결과: { x: 10, z: 5 }
```

---

## 🎯 삼각측량 알고리즘

### RSSI 기반 거리 추정

```
d = 10 ^ ((TxPower - RSSI) / (10 * n))

여기서:
- d: 거리 (미터)
- TxPower: 송신 전력 (보통 -59 dBm)
- RSSI: 수신 신호 강도 (-100 ~ 0 dBm)
- n: 경로 손실 지수 (실내: 2.0~4.0)
```

### 3개 센서로 위치 추정

```typescript
import { trilaterate } from '@/features/digital-twin/utils/coordinateMapper';

const trackingData = [
  { customer_id: 'customer-1', sensor_id: 'wifi-01', signal_strength: -65 },
  { customer_id: 'customer-1', sensor_id: 'wifi-02', signal_strength: -72 },
  { customer_id: 'customer-1', sensor_id: 'wifi-03', signal_strength: -68 }
];

const sensors = [
  { sensor_id: 'wifi-01', x: 0, y: 2.5, z: -7, coverage_radius: 8 },
  { sensor_id: 'wifi-02', x: -8, y: 2.5, z: 0, coverage_radius: 8 },
  { sensor_id: 'wifi-03', x: 8, y: 2.5, z: 0, coverage_radius: 8 }
];

const position = trilaterate(trackingData, sensors);
// 결과: { x: 1.2, z: -3.5, accuracy: 0.8 }
```

---

## 🔧 칼만 필터

노이즈가 많은 센서 데이터를 부드럽게 필터링:

```typescript
import { KalmanFilter } from '@/features/digital-twin/utils/coordinateMapper';

const kalman = new KalmanFilter(0, 0);  // 초기 위치 (0, 0)

// 매 프레임마다 측정값으로 업데이트
const smoothed = kalman.update(measuredX, measuredZ, deltaTime);
// 결과: { x: 스무딩된X, z: 스무딩된Z, vx: 속도X, vz: 속도Z }
```

---

## 📡 Supabase Realtime 채널 구조

### Broadcast (센서 → 서버)
센서가 트래킹 데이터를 전송:

```typescript
channel.send({
  type: 'broadcast',
  event: 'tracking-update',
  payload: {
    customer_id: 'customer-123',
    sensor_id: 'wifi-01',
    signal_strength: -68,
    timestamp: Date.now()
  }
});
```

### Presence (서버 → 모든 클라이언트)
계산된 고객 위치를 공유:

```typescript
channel.track({
  customer_id: 'customer-123',
  position: { x: 1.2, y: 0, z: -3.5 },
  velocity: { x: 0.5, z: -0.3 },
  status: 'browsing',
  last_updated: Date.now()
});
```

---

## 🚀 성능 최적화

### 1. 센서 데이터 버퍼링
- 5초 분량 데이터만 유지
- 오래된 데이터 자동 제거

### 2. 칼만 필터 캐싱
- 고객별 칼만 필터 인스턴스 재사용
- 메모리 효율적 관리

### 3. Throttling
- 위치 업데이트: 100ms 간격
- Presence 전송: 500ms 간격

---

## 🧪 테스트 방법

### 1. 시뮬레이션 데이터 전송

```typescript
// 테스트용 Edge Function 호출
const sendTestData = async () => {
  for (let i = 0; i < 10; i++) {
    await fetch('https://your-project.supabase.co/functions/v1/iot-collector', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sensor_id: 'wifi-ap-01',
        devices: [
          { id: `test-customer-${i}`, rssi: -60 - Math.random() * 20 }
        ]
      })
    });
    await new Promise(r => setTimeout(r, 1000));
  }
};
```

### 2. 브라우저 콘솔에서 확인

```javascript
// Realtime 연결 상태 확인
const channel = supabase.channel('store-tracking-your-store-id');
channel.on('presence', { event: 'sync' }, (payload) => {
  console.log('현재 고객:', Object.keys(channel.presenceState()).length);
});
channel.subscribe();
```

---

## 📚 참고 자료

- [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [RSSI 기반 실내 위치 추적](https://en.wikipedia.org/wiki/Received_signal_strength_indication)
- [칼만 필터 알고리즘](https://en.wikipedia.org/wiki/Kalman_filter)
- [삼각측량(Trilateration)](https://en.wikipedia.org/wiki/Trilateration)

---

**작성일**: 2025-11-13  
**작성자**: NEURALTWIN Development Team  
**문서 버전**: 1.0.0
