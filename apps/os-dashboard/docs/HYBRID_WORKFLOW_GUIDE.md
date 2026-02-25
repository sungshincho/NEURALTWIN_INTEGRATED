# NEURALTWIN 하이브리드 3D 워크플로우 상세 가이드

## 📖 개요

이 문서는 **언리얼 엔진 팀**이 있는 NEURALTWIN 프로젝트를 위한 실전 워크플로우 가이드입니다.

### 핵심 원칙
1. **언리얼**: 정적 에셋 (매장 구조, 선반, 집기)
2. **Three.js**: 동적 데이터 (히트맵, 아바타, 레이블)
3. **Supabase**: 에셋 저장 + 실시간 데이터

---

## 🎨 Part 1: 언리얼 에셋 제작 (Week 1-8)

### Week 1-2: 매장 레이아웃 모델링

#### 1.1 프로젝트 초기 설정

```
Unreal Engine 5.3 프로젝트 생성
├─ Template: Blank
├─ Blueprint or C++: Blueprint (빠른 프로토타입)
├─ Target Platform: Desktop
├─ Quality: Scalable
└─ Name: NEURALTWIN_Store3D
```

#### 1.2 Modeling Mode로 매장 생성

```
Tools → Modeling Mode Enable
├─ Create → Box (바닥)
│   └─ Size: 5000 × 3000 × 20 (cm 단위 = 50m × 30m)
├─ Create → Box (벽면 4개)
│   ├─ North Wall: 5000 × 20 × 400
│   ├─ South Wall: 5000 × 20 × 400
│   ├─ East Wall: 3000 × 20 × 400
│   └─ West Wall: 3000 × 20 × 400
└─ Create → Cylinder (기둥)
    ├─ Radius: 50cm
    ├─ Height: 400cm
    └─ 위치: 그리드 500cm 간격 (5m)
```

#### 1.3 선반 및 집기 배치

```
Content Browser → 3D Models → Store Fixtures
├─ Shelf_Grocery (식료품 선반)
│   ├─ 크기: 100 × 50 × 200 cm
│   ├─ 배치: 그리드 패턴 (10개)
│   └─ 간격: 500cm
├─ Freezer_Stand (냉동고)
│   └─ 위치: 벽면 따라
├─ Checkout_Counter (계산대)
│   └─ 위치: 출구 근처 (3개)
└─ Shopping_Cart (카트)
    └─ 위치: 입구 (10개)
```

### Week 3-4: PBR 머티리얼 시스템

#### 2.1 Master Material 생성

```
Content Browser → Materials → M_Store_Master
```

**Master Material Graph**:
```
┌─────────────────────────────────────────────────┐
│                 M_Store_Master                   │
├─────────────────────────────────────────────────┤
│ [T_BaseColor (Texture Parameter)]               │
│      ↓                                           │
│ [Base Color] ──────────────→ [Final Pixel]      │
│                                                  │
│ [T_Normal (Texture Parameter)]                   │
│      ↓                                           │
│ [Normal] ───────────────────→ [Final Pixel]      │
│                                                  │
│ [Roughness (Scalar Parameter, 0-1)]              │
│      ↓                                           │
│ [Roughness] ────────────────→ [Final Pixel]      │
│                                                  │
│ [Metallic (Scalar Parameter, 0-1)]               │
│      ↓                                           │
│ [Metallic] ─────────────────→ [Final Pixel]      │
└─────────────────────────────────────────────────┘
```

#### 2.2 Material Instances (실제 적용)

**MI_Floor_Concrete** (바닥)
```
Base Material: M_Store_Master
Parameters:
├─ T_BaseColor: T_Concrete_Albedo_2K.tga
├─ T_Normal: T_Concrete_Normal_2K.tga
├─ Roughness: 0.7 (약간 거침)
├─ Metallic: 0.0 (금속 아님)
└─ UV Tiling: (10, 10) → 5m당 1타일
```

**MI_Shelf_Metal** (선반)
```
Base Material: M_Store_Master
Parameters:
├─ T_BaseColor: T_Metal_Brushed_Albedo_1K.tga
├─ T_Normal: T_Metal_Brushed_Normal_1K.tga
├─ Roughness: 0.4 (약간 반사)
├─ Metallic: 1.0 (금속)
└─ UV Tiling: (1, 1)
```

**MI_Product_Plastic** (제품 박스)
```
Base Material: M_Store_Master
Parameters:
├─ Base Color: RGB(255, 200, 50) Orange
├─ Normal: Flat (no texture)
├─ Roughness: 0.3 (매끄러움)
└─ Metallic: 0.1 (약간 광택)
```

#### 2.3 텍스처 최적화

```bash
# Photoshop 또는 GIMP에서 텍스처 준비
Floor Textures: 2048×2048
├─ Albedo (RGB): JPEG 80% Quality → 1.5MB
├─ Normal (RGB): PNG → 3MB
└─ Roughness (Grayscale): JPEG 90% → 500KB

Product Textures: 512×512
├─ Albedo: JPEG 70% → 150KB
└─ Normal: 생략 가능 (단순 형태)
```

### Week 5-6: 라이팅 베이크

#### 3.1 조명 배치 전략

**태양광 (Directional Light)**
```
Details Panel:
├─ Mobility: Stationary ← 중요! (Static은 베이크 전용)
├─ Intensity: 10.0 (lux 단위)
├─ Light Color: (R=1, G=0.98, B=0.95) Warm White
├─ Rotation: (Pitch=-45°, Yaw=45°, Roll=0)
└─ Cast Shadows: ✓ Enabled
```

**매장 천장 조명 (Point Light × 20개)**
```
Details Panel:
├─ Mobility: Stationary
├─ Intensity: 5000 (candela)
├─ Attenuation Radius: 1000cm (10m)
├─ Light Color: (R=1, G=1, B=1) Cool White
└─ 배치: Blueprint로 자동 생성

Blueprint: BP_LightGrid
```cpp
// 천장 조명 그리드 자동 생성
for (int x = 0; x < 5; x++) {
    for (int y = 0; y < 4; y++) {
        FVector Pos(x * 1000, y * 750, 350); // 10m × 7.5m 간격
        UPointLightComponent* Light = CreatePointLight(Pos);
        Light->SetIntensity(5000);
        Light->SetAttenuationRadius(1000);
    }
}
```

#### 3.2 Lightmass 설정 (고품질)

```
World Settings → Lightmass
├─ Static Lighting Level Scale: 0.3 ← 매우 고품질 (기본 1.0)
├─ Num Indirect Lighting Bounces: 5 ← 간접광 반사 5회
├─ Num Sky Lighting Bounces: 3
├─ Indirect Lighting Quality: 8.0 ← 매우 정밀
└─ Indirect Lighting Smoothness: 0.8 ← 부드러운 그림자
```

**각 Static Mesh 설정**
```
Floor Mesh:
└─ Lightmap Resolution: 512 (큰 표면 → 높은 해상도)

Wall Mesh:
└─ Lightmap Resolution: 256

Shelf Mesh:
└─ Lightmap Resolution: 128

Product Mesh:
└─ Lightmap Resolution: 64 (작은 오브젝트)
```

#### 3.3 베이크 실행

```
Build → Lighting Quality → Production
├─ 예상 시간: 1-3시간 (매장 크기에 따라)
├─ CPU 사용률: 100% (전체 코어 활용)
└─ 결과: /Content/Maps/Store_BuiltData/ 폴더에 Lightmap 생성
```

**베이크 후 확인 사항**:
- [ ] 그림자가 부드럽게 나타나는가?
- [ ] 선반 아래 어두운 그림자가 있는가?
- [ ] 천장 조명이 바닥에 원형으로 표시되는가?
- [ ] 텍스처에 이상한 얼룩(artifact)이 없는가?

### Week 7-8: LOD 및 최적화

#### 4.1 자동 LOD 생성

```
Static Mesh Editor → LOD Settings
├─ LOD Group: LargeProp (큰 오브젝트용)
├─ Number of LODs: 3 (LOD0, LOD1, LOD2)
├─ Auto Compute LOD Distances: ✓
└─ LOD Generation Settings:
    ├─ LOD 1:
    │   ├─ Reduction Method: Triangles
    │   ├─ Percent Triangles: 50%
    │   └─ Screen Size: 0.5
    └─ LOD 2:
        ├─ Percent Triangles: 25%
        └─ Screen Size: 0.25
```

**수동 LOD 검증**:
```
Viewport → Show → Level of Detail Coloration
├─ 초록색: LOD0 (근거리)
├─ 노란색: LOD1 (중거리)
└─ 빨간색: LOD2 (원거리)
```

#### 4.2 Triangle Count 확인

```
목표 폴리곤 수:
├─ 전체 씬 (LOD0): ~500K triangles
├─ LOD1: ~250K triangles
└─ LOD2: ~125K triangles

Static Mesh Editor → Statistics
└─ Triangles: 12,345 개 표시
```

---

## 📦 Part 2: glTF 익스포트 (Week 9-12)

### Week 9-10: Datasmith Exporter 설정

#### 5.1 플러그인 활성화

```
Edit → Plugins → Search "Datasmith"
└─ Datasmith glTF Exporter → Enabled ✓
Restart Editor 필요
```

#### 5.2 익스포트 실행

```
File → Datasmith → Export → glTF Exporter

Export Settings:
├─ Output Path: D:/Exports/NEURALTWIN/
├─ Export Name: store-base
├─ Export Format: Binary (.glb) ← 단일 파일 (추천)
├─ Texture Image Format: JPEG
│   └─ JPEG Quality: 90%
├─ Export Options:
│   ├─ Bake Material Inputs: ✓ ← PBR → glTF 변환
│   ├─ Export Preview Mesh: ✗
│   ├─ Export Vertex Colors: ✗
│   ├─ Export Level of Details: ✓ ← LOD 포함
│   └─ Export Collision: ✗
└─ Click "Export"

예상 시간: 5-15분
결과 파일: store-base.glb (100-200MB)
```

### Week 11-12: glTF-Transform 최적화

#### 6.1 도구 설치

```bash
# Node.js 18+ 필요
npm install -g @gltf-transform/cli
```

#### 6.2 최적화 스크립트

**파일: `scripts/optimize-store.sh`**
```bash
#!/bin/bash
set -e

INPUT="exports/store-base.glb"
OUTPUT_DIR="optimized"
mkdir -p $OUTPUT_DIR

echo "🔧 Step 1: 기본 최적화 (Dedup, Weld, Instance)"
gltf-transform optimize $INPUT $OUTPUT_DIR/store-opt.glb \
  --texture-compress webp \
  --simplify 0.95 \
  --weld \
  --dedup \
  --instance

echo "🗜️ Step 2: Draco 지오메트리 압축"
gltf-transform draco $OUTPUT_DIR/store-opt.glb $OUTPUT_DIR/store-draco.glb \
  --method edgebreaker

echo "🖼️ Step 3: KTX2 GPU 텍스처 압축"
gltf-transform etc1s $OUTPUT_DIR/store-draco.glb $OUTPUT_DIR/store-final.glb \
  --quality 128 \
  --verbose

echo "✅ 완료!"
echo "원본: $(du -h $INPUT | cut -f1)"
echo "최적화: $(du -h $OUTPUT_DIR/store-final.glb | cut -f1)"
```

**실행**:
```bash
chmod +x scripts/optimize-store.sh
./scripts/optimize-store.sh

# 예상 결과:
# 원본: 180 MB
# 최적화: 28 MB (-84%)
```

#### 6.3 모바일용 추가 압축

```bash
# 텍스처 해상도 절반으로 감소
gltf-transform resize $OUTPUT_DIR/store-final.glb $OUTPUT_DIR/store-mobile.glb \
  --width 512 \
  --height 512

# 결과: store-mobile.glb (12 MB)
```

---

## ☁️ Part 3: Supabase Storage 업로드 (Week 13-14)

### Week 13: Storage Bucket 생성

#### 7.1 Lovable Cloud UI에서

```
1. Lovable 프로젝트 열기
2. Cloud 탭 클릭
3. Storage 섹션 이동
4. "Create Bucket" 클릭
   ├─ Bucket Name: "3d-assets"
   ├─ Public Access: ✓ Enabled
   ├─ File Size Limit: 100 MB
   └─ Create
```

#### 7.2 RLS Policy 설정

```sql
-- 공개 읽기 정책
CREATE POLICY "Anyone can view 3D assets"
ON storage.objects FOR SELECT
USING (bucket_id = '3d-assets');

-- 관리자만 업로드/삭제
CREATE POLICY "Admin can upload 3D assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = '3d-assets' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);
```

### Week 14: 자동 업로드 스크립트

#### 8.1 Node.js 업로드 스크립트

**파일: `scripts/upload-to-supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://fbffryjvvykhgoviektl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY! // .env에서 로드
);

interface Asset {
  localPath: string;
  remotePath: string;
  contentType: string;
}

const ASSETS: Asset[] = [
  {
    localPath: 'optimized/store-final.glb',
    remotePath: 'models/store-base.glb',
    contentType: 'model/gltf-binary'
  },
  {
    localPath: 'optimized/store-lod1.glb',
    remotePath: 'models/store-base-lod1.glb',
    contentType: 'model/gltf-binary'
  },
  {
    localPath: 'optimized/store-lod2.glb',
    remotePath: 'models/store-base-lod2.glb',
    contentType: 'model/gltf-binary'
  },
  {
    localPath: 'optimized/store-mobile.glb',
    remotePath: 'models/store-mobile.glb',
    contentType: 'model/gltf-binary'
  }
];

async function uploadAsset(asset: Asset) {
  console.log(`📤 Uploading: ${asset.remotePath}...`);
  
  const fileBuffer = fs.readFileSync(asset.localPath);
  const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
  
  const { data, error } = await supabase.storage
    .from('3d-assets')
    .upload(asset.remotePath, fileBuffer, {
      contentType: asset.contentType,
      cacheControl: '31536000', // 1년 캐싱
      upsert: true // 기존 파일 덮어쓰기
    });

  if (error) {
    console.error(`❌ Failed: ${asset.remotePath}`, error.message);
    return false;
  }
  
  console.log(`✅ Success: ${asset.remotePath} (${fileSizeMB} MB)`);
  return true;
}

async function main() {
  console.log('🚀 Starting upload to Supabase Storage...\n');
  
  let successCount = 0;
  for (const asset of ASSETS) {
    const success = await uploadAsset(asset);
    if (success) successCount++;
  }
  
  console.log(`\n🎉 Upload complete: ${successCount}/${ASSETS.length} files`);
}

main();
```

**실행**:
```bash
# .env 파일 생성
echo "SUPABASE_SERVICE_ROLE_KEY=your-key-here" > .env

# 업로드
npx tsx scripts/upload-to-supabase.ts
```

#### 8.2 Public URL 확인

```bash
# 업로드 후 URL 테스트
curl -I https://fbffryjvvykhgoviektl.supabase.co/storage/v1/object/public/3d-assets/models/store-base.glb

# 예상 응답:
# HTTP/2 200
# content-type: model/gltf-binary
# cache-control: max-age=31536000
```

---

## 🌐 Part 4: Three.js 통합 (Week 17-24)

### Week 17-18: 기본 씬 구성

#### 9.1 패키지 설치

```bash
npm install @react-three/fiber@^8.18.0 three@^0.133.0
npm install @react-three/drei@^9.122.0
npm install zustand@^4.5.0
npm install --save-dev @types/three
```

#### 9.2 첫 번째 3D 컴포넌트

**파일: `src/features/digital-twin-3d/components/StoreScene.tsx`**
```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';

export const StoreScene = () => {
  // Supabase Storage에서 모델 로드
  const { scene } = useGLTF(
    'https://fbffryjvvykhgoviektl.supabase.co/storage/v1/object/public/3d-assets/models/store-base.glb'
  );

  return (
    <Canvas
      camera={{ position: [30, 25, 30], fov: 50 }}
      shadows
    >
      {/* 조명 */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* 언리얼 에셋 */}
      <primitive object={scene} />

      {/* 카메라 컨트롤 */}
      <OrbitControls
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={100}
      />

      {/* 환경 (HDRI) */}
      <Environment preset="warehouse" background={false} />
    </Canvas>
  );
};
```

#### 9.3 페이지에 통합

**파일: `src/features/digital-twin-3d/pages/DigitalTwin3DPage.tsx`**
```tsx
import { DashboardLayout } from "@/components/DashboardLayout";
import { StoreScene } from "../components/StoreScene";

const DigitalTwin3DPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold gradient-text">
          3D 디지털 트윈
        </h1>
        
        <div className="h-[700px] rounded-lg overflow-hidden border border-border bg-background">
          <StoreScene />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DigitalTwin3DPage;
```

### Week 19-20: 히트맵 오버레이

#### 10.1 실시간 데이터 Hook

**파일: `src/features/digital-twin-3d/hooks/useRealtimeHeatmap.ts`**
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
}

export const useRealtimeHeatmap = (storeId: string) => {
  const [points, setPoints] = useState<HeatmapPoint[]>([]);

  useEffect(() => {
    // 초기 데이터 로드
    const loadInitial = async () => {
      const { data } = await supabase
        .from('traffic_logs')
        .select('zone_x, zone_y, dwell_time')
        .eq('store_id', storeId)
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString())
        .limit(500);

      if (data) {
        const heatmapPoints = data.map(d => ({
          x: d.zone_x,
          y: d.zone_y,
          intensity: Math.min(d.dwell_time / 300, 1) // 0-1 정규화
        }));
        setPoints(heatmapPoints);
      }
    };

    loadInitial();

    // 실시간 구독
    const channel = supabase
      .channel(`heatmap-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'traffic_logs',
          filter: `store_id=eq.${storeId}`
        },
        (payload: any) => {
          const newPoint: HeatmapPoint = {
            x: payload.new.zone_x,
            y: payload.new.zone_y,
            intensity: Math.min(payload.new.dwell_time / 300, 1)
          };
          setPoints(prev => [...prev.slice(-499), newPoint]); // 최대 500개
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return points;
};
```

#### 10.2 히트맵 오버레이 컴포넌트

**파일: `src/features/digital-twin-3d/components/HeatmapOverlay.tsx`**
```tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRealtimeHeatmap } from '../hooks/useRealtimeHeatmap';

interface HeatmapOverlayProps {
  storeId: string;
  storeWidth: number;
  storeDepth: number;
}

export const HeatmapOverlay = ({
  storeId,
  storeWidth,
  storeDepth
}: HeatmapOverlayProps) => {
  const points = useRealtimeHeatmap(storeId);
  const meshRef = useRef<THREE.Mesh>(null);

  // Canvas API로 히트맵 텍스처 생성
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const resolution = 512;
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d')!;

    // 배경 투명
    ctx.clearRect(0, 0, resolution, resolution);

    // 각 포인트를 그라디언트로 렌더링
    points.forEach(point => {
      const x = (point.x / storeWidth) * resolution;
      const y = (point.y / storeDepth) * resolution;
      const radius = 40 * point.intensity;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      // 색상: 빨강(높음) → 노랑(중간) → 파랑(낮음)
      gradient.addColorStop(0, `rgba(255, 0, 0, ${point.intensity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${point.intensity * 0.5})`);
      gradient.addColorStop(1, `rgba(0, 0, 255, ${point.intensity * 0.2})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    // Three.js 텍스처로 변환
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [points, storeWidth, storeDepth]);

  // 매 프레임 텍스처 업데이트
  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.map = texture;
      mat.needsUpdate = true;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]} // 바닥 위 5cm
    >
      <planeGeometry args={[storeWidth, storeDepth]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={0.7}
        emissive="#ffffff"
        emissiveIntensity={0.3}
        depthWrite={false}
      />
    </mesh>
  );
};
```

### Week 21-22: 고객 아바타 (Instanced Rendering)

**파일: `src/features/digital-twin-3d/components/CustomerAvatars.tsx`**
```tsx
import { Instances, Instance } from '@react-three/drei';
import { useRealtimeVisitors } from '../hooks/useRealtimeVisitors';

export const CustomerAvatars = ({ storeId }: { storeId: string }) => {
  const visitors = useRealtimeVisitors(storeId);

  return (
    <Instances limit={1000}>
      {/* 공유 지오메트리 (실린더 = 사람 형태) */}
      <cylinderGeometry args={[0.3, 0.3, 1.8, 8]} />
      <meshStandardMaterial />

      {/* 각 방문객 인스턴스 */}
      {visitors.map(visitor => (
        <Instance
          key={visitor.id}
          position={[visitor.x, 0.9, visitor.y]}
          color={visitor.type === 'new' ? '#4ade80' : '#3b82f6'}
        />
      ))}
    </Instances>
  );
};
```

---

## 🎯 완성된 통합 예시

**파일: `src/features/digital-twin-3d/pages/TrafficHeatmap3DPage.tsx`**
```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { DashboardLayout } from "@/components/DashboardLayout";
import { UnrealStoreModel } from '../components/UnrealStoreModel';
import { HeatmapOverlay } from '../components/HeatmapOverlay';
import { CustomerAvatars } from '../components/CustomerAvatars';
import { Card } from "@/components/ui/card";

const TrafficHeatmap3DPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            3D 트래픽 히트맵
          </h1>
          <p className="text-muted-foreground mt-2">
            실시간 고객 동선 + 언리얼 고품질 매장
          </p>
        </div>

        <div className="h-[700px] rounded-lg overflow-hidden border border-border">
          <Canvas
            camera={{ position: [30, 40, 30], fov: 50 }}
            shadows="soft"
          >
            {/* 조명 */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[20, 30, 10]}
              intensity={1.2}
              castShadow
              shadow-mapSize={[2048, 2048]}
            />

            {/* 🎨 언리얼 에셋: 매장 구조 (Static) */}
            <UnrealStoreModel
              modelPath="models/store-base.glb"
              receiveShadow
            />

            {/* 🌐 Three.js: 히트맵 오버레이 (Dynamic) */}
            <HeatmapOverlay
              storeId="store-001"
              storeWidth={50}
              storeDepth={30}
            />

            {/* 🌐 Three.js: 고객 아바타 (Dynamic) */}
            <CustomerAvatars storeId="store-001" />

            {/* 카메라 컨트롤 */}
            <OrbitControls
              maxPolarAngle={Math.PI / 2.2}
              minDistance={15}
              maxDistance={100}
            />

            {/* Environment */}
            <Environment preset="warehouse" background={false} />
          </Canvas>
        </div>

        {/* 범례 */}
        <Card className="p-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-sm">낮은 트래픽</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span className="text-sm">중간 트래픽</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-sm">높은 트래픽</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-sm">신규 방문객</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full" />
              <span className="text-sm">재방문객</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TrafficHeatmap3DPage;
```

---

## 📊 성능 벤치마크 목표

| 지표 | Desktop | Mobile | 비고 |
|------|---------|--------|------|
| **초기 로딩** | 3-5초 | 5-8초 | Progressive Loading |
| **FPS** | 60 | 30 | LOD 시스템 활용 |
| **메모리** | 500MB | 250MB | 텍스처 압축 |
| **네트워크** | 30MB | 15MB | Draco + KTX2 |

---

## ✅ 최종 체크리스트

### 언리얼 에셋
- [ ] 매장 구조 모델링 완료
- [ ] PBR 머티리얼 적용
- [ ] 라이팅 베이크 완료 (Production Quality)
- [ ] LOD 3단계 생성

### glTF 파이프라인
- [ ] Datasmith Exporter로 .glb 익스포트
- [ ] glTF-Transform으로 최적화 (< 30MB)
- [ ] KTX2 텍스처 압축

### Supabase Storage
- [ ] `3d-assets` Bucket 생성
- [ ] 에셋 업로드 완료
- [ ] Public URL 테스트 통과

### Three.js 통합
- [ ] GLTFLoader로 모델 로드 성공
- [ ] 그림자 렌더링 정상
- [ ] 히트맵 오버레이 실시간 업데이트
- [ ] Instanced Rendering (아바타 100명+)

### 성능
- [ ] Desktop 60 FPS
- [ ] Mobile 30 FPS
- [ ] Progressive Loading 구현

---

**문서 작성**: 2025-11-12  
**작성자**: NEURALTWIN Development Team  
**버전**: 1.0
