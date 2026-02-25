# WiFi Probe Request CSV 데이터 시각화 가이드

라즈베리파이로 수집한 WiFi probe request 데이터를 NEURALTWIN 3D 디지털 트윈에서 시각화하는 방법입니다.

## 📋 1단계: CSV 데이터 형식 준비

### WiFi Tracking CSV 형식 (wifi_tracking.csv)

```csv
timestamp,mac_address,sensor_id,rssi,x,z
2024-03-15T10:30:00Z,AA:BB:CC:DD:EE:01,sensor_01,-45,2.5,3.0
2024-03-15T10:30:01Z,AA:BB:CC:DD:EE:01,sensor_02,-55,2.5,3.0
2024-03-15T10:30:01Z,AA:BB:CC:DD:EE:01,sensor_03,-65,2.5,3.0
2024-03-15T10:30:02Z,AA:BB:CC:DD:EE:02,sensor_01,-50,5.0,7.0
```

**필수 컬럼:**
- `timestamp`: 측정 시간 (ISO 8601 형식)
- `mac_address`: 디바이스 식별자 (⚠️ 주의: 실시간으로 랜덤화됨)
- `sensor_id`: 감지한 센서 ID
- `rssi`: 신호 강도 (-100 ~ 0 dBm)
- `x`, `z`: (선택) 이미 계산된 위치 좌표 (미터 단위)

**⚠️ MAC 주소 랜덤화 주의사항:**
- 현대 모바일 기기는 프라이버시 보호를 위해 MAC 주소를 자동으로 랜덤화
- 같은 사람이어도 접속할 때마다 다른 MAC 주소 사용 가능
- 개별 고객 추적보다는 **집계 분석**(히트맵, 체류시간)에 집중 권장

### 센서 위치 CSV 형식 (wifi_sensors.csv)

```csv
sensor_id,x,y,z,coverage_radius
sensor_01,0,2.5,0,10
sensor_02,10,2.5,0,10
sensor_03,10,2.5,10,10
sensor_04,0,2.5,10,10
```

**필수 컬럼:**
- `sensor_id`: 센서 고유 ID
- `x`, `y`, `z`: 센서의 실제 위치 (미터)
- `coverage_radius`: 센서 감지 반경 (미터)

## 📤 2단계: CSV 파일 업로드

### 방법 1: Supabase Storage에 업로드

```bash
# 경로: {user_id}/{store_id}/wifi_tracking.csv
# 경로: {user_id}/{store_id}/wifi_sensors.csv
```

1. **NeuralSense 설정 페이지** (`/neuralsense-settings`)로 이동
2. CSV 파일 업로드 인터페이스 사용
3. 또는 직접 Storage에 업로드

### 방법 2: public/samples/ 폴더 사용 (테스트용)

```bash
public/samples/wifi_tracking.csv
public/samples/wifi_sensors.csv
```

## 🔧 3단계: 데이터 로드 및 처리

### 사용 예시

```typescript
import { loadWiFiTrackingData } from '@/utils/wifiDataLoader';
import { trilaterate } from '@/features/digital-twin/utils/coordinateMapper';

// 1. 센서 및 트래킹 데이터 로드
const { sensors, trackingData } = await loadWiFiTrackingData(userId, storeId);

// 2. RSSI 기반 위치 추정 (좌표가 없는 경우)
const estimatedPositions = trackingData.map(dataPoint => {
  const position = trilaterate([dataPoint], sensors);
  return {
    ...dataPoint,
    x: position?.x || 0,
    z: position?.z || 0,
    accuracy: position?.accuracy || 10
  };
});

// 3. 시간대별 그룹핑
const timeGroups = groupByTimeWindow(estimatedPositions, 5000); // 5초 단위
```

## 🎨 4단계: 3D 시각화

### Store3DViewer에서 사용

```typescript
import { Store3DViewer } from '@/features/digital-twin/components/Store3DViewer';
import { WiFiTrackingOverlay } from '@/features/digital-twin/components/overlays/WiFiTrackingOverlay';

function DigitalTwinPage() {
  const [trackingData, setTrackingData] = useState([]);
  
  useEffect(() => {
    loadWiFiTrackingData(userId, storeId).then(data => {
      setTrackingData(data.trackingData);
    });
  }, []);

  return (
    <Store3DViewer
      overlay={<WiFiTrackingOverlay trackingData={trackingData} />}
    />
  );
}
```

## 📊 5단계: 시각화 옵션

### 옵션 1: 실시간 재생 모드
- 타임라인 슬라이더로 시간대별 이동 경로 재생
- 재생 속도 조절 (1x, 2x, 5x)

### 옵션 2: 히트맵 모드
- 시간 범위 내 모든 데이터를 집계하여 히트맵 생성
- 체류 시간 기반 색상 강도

### 옵션 3: 경로 추적 모드
- 개별 MAC 주소별 이동 경로 시각화
- 시작점/종료점 마커 표시

## 🔍 데이터 품질 체크리스트

✅ **필수 확인사항:**
- [ ] 센서 위치가 매장 실제 좌표와 일치하는가?
- [ ] RSSI 값이 -100 ~ 0 dBm 범위인가?
- [ ] 타임스탬프가 시간 순서대로 정렬되어 있는가?
- [ ] MAC 주소가 익명화 처리되었는가? (개인정보 보호)
- [ ] 센서가 최소 3개 이상 있는가? (Trilateration 필요)

## 📈 성능 최적화

### 대용량 데이터 처리
- 시간 범위 필터링 (1시간 단위)
- 간격 샘플링 (5초마다 1개 데이터)
- Web Worker로 백그라운드 처리

### 메모리 관리
```typescript
// 오래된 데이터 자동 제거
const MAX_POINTS = 1000;
if (trackingData.length > MAX_POINTS) {
  trackingData = trackingData.slice(-MAX_POINTS);
}
```

## 🎯 활용 사례

1. **매장 동선 분석**: 고객이 가장 많이 방문하는 구역 파악
2. **체류 시간 분석**: 구역별 평균 체류 시간 계산
3. **피크 타임 분석**: 시간대별 방문객 수 변화
4. **입구-출구 흐름**: 매장 진입/이탈 패턴 분석
5. **A/B 테스트**: 레이아웃 변경 전후 동선 비교

## 🚀 다음 단계

1. ✅ CSV 데이터로 시각화 (현재)
2. 🔄 실시간 라즈베리파이 연동
3. 📡 Supabase Realtime 채널 설정
4. 🤖 AI 기반 동선 예측 및 추천

## 📞 문제 해결

### Q: Trilateration이 정확하지 않아요
- 센서를 최소 3개 이상 배치했는지 확인
- 센서 위치를 정확하게 측정했는지 확인
- RSSI 캘리브레이션 필요 (환경별 신호 감쇠 다름)

### Q: 노이즈가 많아요
- Kalman Filter 적용
- 이동 평균 필터 적용
- 최소 신호 강도 임계값 설정 (예: -80dBm 이상만 사용)

### Q: MAC 주소 랜덤화는 어떻게 처리하나요?
- **중요**: 현대 모바일 기기는 WiFi probe request 시 MAC 주소를 랜덤화합니다
- iOS(iOS 14+), Android(Android 10+) 모두 기본적으로 활성화
- 같은 사람이어도 시간마다 다른 MAC 주소로 보일 수 있음

**해결 방안:**
1. **세션 그룹핑**: 짧은 시간 윈도우(1-5분) 내 유사한 신호 패턴을 하나의 세션으로 묶기
2. **RSSI 패턴 분석**: 신호 강도 변화 패턴으로 동일 디바이스 추정
3. **통계적 접근**: 개별 추적보다 집계 데이터(히트맵, 체류시간) 중심 분석
4. **짧은 추적 윈도우**: 5-10분 내 단기 동선만 추적

### Q: 프라이버시는 안전한가요?
- MAC 주소 랜덤화로 개인 식별이 더욱 어려워짐
- 세션 ID로 변환하여 원본 MAC 주소 저장하지 않음
- 집계 데이터만 장기 보관, 원시 데이터는 24시간 이내 삭제 권장
