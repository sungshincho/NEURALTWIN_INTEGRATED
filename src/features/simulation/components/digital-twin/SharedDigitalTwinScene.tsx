/**
 * 통합 3D 디지털트윈 씬 컴포넌트
 * 모든 Analysis/Simulation 페이지에서 동일한 3D 씬을 재사용
 */

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Package } from 'lucide-react';
import { useStoreScene } from '@/hooks/useStoreScene';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { SceneComposer } from './SceneComposer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type OverlayType = 
  | 'heatmap'        // Traffic Heatmap
  | 'journey'        // Customer Journey  
  | 'funnel'         // Conversion Funnel
  | 'inventory'      // Inventory Status
  | 'profit'         // Profit Center
  | 'product'        // Product Performance
  | 'layout'         // Layout Simulation
  | 'recommendation' // Recommendation Strategy
  | 'none';          // No overlay (Digital Twin 3D only)

interface SharedDigitalTwinSceneProps {
  /**
   * 표시할 오버레이 타입
   */
  overlayType?: OverlayType;
  
  /**
   * 커스텀 오버레이 컴포넌트 (overlayType 대신 사용 가능)
   */
  customOverlay?: ReactNode;
  
  /**
   * 레이아웃 시뮬레이션 데이터 (layout overlayType 사용 시)
   */
  layoutSimulationData?: any;
  
  /**
   * 3D 뷰어 높이
   */
  height?: string;
  
  /**
   * 컨트롤 표시 여부 (OrbitControls)
   */
  showControls?: boolean;
  
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 통합 3D 디지털트윈 씬 컴포넌트
 * 
 * Digital Twin 3D 페이지에서 생성한 씬을 모든 페이지에서 공유
 * 각 페이지별 오버레이만 다르게 렌더링
 */
export function SharedDigitalTwinScene({
  overlayType = 'none',
  customOverlay,
  layoutSimulationData,
  height = '600px',
  showControls = true,
  className = ''
}: SharedDigitalTwinSceneProps) {
  const { selectedStore } = useSelectedStore();
  const { activeScene, isLoading, error } = useStoreScene();
  const navigate = useNavigate();

  // 로딩 상태
  if (isLoading) {
    return (
      <Card className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">3D 씬 로딩 중...</p>
        </div>
      </Card>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card className={`p-6 ${className}`} style={{ height }}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            3D 씬을 불러오는 중 오류가 발생했습니다: {error.message}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // 씬 없음 상태
  if (!activeScene) {
    return (
      <Card className={`flex items-center justify-center p-8 ${className}`} style={{ height }}>
        <div className="text-center space-y-4 max-w-md">
          <Package className="w-16 h-16 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">3D 디지털트윈 씬이 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              {selectedStore 
                ? `${selectedStore.store_name} 매장의 3D 씬을 먼저 생성해주세요.`
                : '매장을 선택하고 3D 씬을 생성해주세요.'
              }
            </p>
          </div>
          <Button onClick={() => navigate('/digital-twin/3d')}>
            3D 씬 생성하러 가기
          </Button>
        </div>
      </Card>
    );
  }

  // 정상 렌더링: SceneComposer 사용
  // 레이아웃 시뮬레이션 데이터가 있으면 그것을 사용, 없으면 기본 씬 사용
  const sceneData = (overlayType === 'layout' && layoutSimulationData) 
    ? layoutSimulationData 
    : activeScene.recipe_data;

  return (
    <div style={{ height }} className={`w-full ${className}`}>
      <SceneComposer 
        recipe={sceneData}
        overlay={customOverlay || getOverlayByType(overlayType)}
      />
    </div>
  );
}

/**
 * 오버레이 타입별 컴포넌트 반환
 * 실제 오버레이 컴포넌트들은 각 페이지에서 import하여 사용
 */
function getOverlayByType(type: OverlayType): ReactNode {
  switch (type) {
    case 'none':
      return null;
    
    // Analysis 섹션 오버레이
    case 'heatmap':
      // Traffic Heatmap 페이지에서 실제 HeatmapOverlay3D를 customOverlay로 전달
      return null;
    
    case 'journey':
      // Customer Journey 페이지에서 실제 CustomerPathOverlay를 customOverlay로 전달
      return null;
    
    case 'funnel':
      // Conversion Funnel 페이지에서 실제 오버레이를 customOverlay로 전달
      return null;
    
    case 'inventory':
      // Inventory Status 페이지에서 실제 ProductInfoOverlay를 customOverlay로 전달
      return null;
    
    case 'profit':
      // Profit Center 페이지에서 실제 오버레이를 customOverlay로 전달
      return null;
    
    case 'product':
      // Product Performance 페이지에서 실제 오버레이를 customOverlay로 전달
      return null;
    
    // Simulation 섹션 오버레이
    case 'layout':
      // Layout Simulation 페이지에서 실제 오버레이를 customOverlay로 전달
      return null;
    
    case 'recommendation':
      // Recommendation Strategy 페이지에서 실제 오버레이를 customOverlay로 전달
      return null;
    
    default:
      return null;
  }
}

/**
 * 페이지별 권장 사용 예시:
 * 
 * // Traffic Heatmap Page
 * <SharedDigitalTwinScene
 *   overlayType="heatmap"
 *   customOverlay={<HeatmapOverlay3D heatPoints={heatPoints} />}
 * />
 * 
 * // Customer Journey Page
 * <SharedDigitalTwinScene
 *   overlayType="journey"
 *   customOverlay={<CustomerPathOverlay paths={paths} />}
 * />
 * 
 * // Inventory Status Page
 * <SharedDigitalTwinScene
 *   overlayType="inventory"
 *   customOverlay={<ProductInfoOverlay products={products} />}
 * />
 * 
 * // Layout Simulation Page
 * <SharedDigitalTwinScene
 *   overlayType="layout"
 *   customOverlay={<LayoutEditorOverlay onZoneMove={handleZoneMove} />}
 * />
 */
