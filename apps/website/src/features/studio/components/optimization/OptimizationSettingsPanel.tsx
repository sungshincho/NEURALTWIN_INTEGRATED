/**
 * OptimizationSettingsPanel.tsx
 *
 * AI 최적화 설정 패널 메인 컴포넌트
 * - ObjectiveSelector: 최적화 목표 선택
 * - FurnitureSelector: 이동 가능 가구 선택
 * - ProductSelector: 재배치 가능 제품 선택
 * - IntensitySlider: 최적화 강도 선택
 */

import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  OptimizationSettings,
  FurnitureItem,
  ProductItem,
  OptimizationObjective,
  OptimizationIntensity,
  FurnitureSettings,
  ProductSettings,
  IntegratedOptimizationSettings as IntegratedSettingsType,
} from '../../types/optimization.types';
import { DEFAULT_OPTIMIZATION_SETTINGS, DEFAULT_INTEGRATED_SETTINGS } from '../../types/optimization.types';
import { ObjectiveSelector } from './ObjectiveSelector';
import { FurnitureSelector } from './FurnitureSelector';
import { ProductSelector } from './ProductSelector';
import { IntensitySlider } from './IntensitySlider';
import { IntegratedOptimizationSettings } from './IntegratedOptimizationSettings';

interface OptimizationSettingsPanelProps {
  /** 현재 설정 값 */
  settings: OptimizationSettings;
  /** 설정 변경 콜백 */
  onChange: (settings: OptimizationSettings) => void;
  /** 가구 목록 (FurnitureSelector용) */
  furniture: FurnitureItem[];
  /** 제품 목록 (ProductSelector용) */
  products: ProductItem[];
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 추가 클래스 */
  className?: string;
  /** B안: 최적화 타입 (통합 설정 표시용) */
  optimizationType?: 'layout' | 'staffing' | 'both';
  /** B안: 통합 최적화 설정 표시 여부 */
  showIntegratedSettings?: boolean;
}

export function OptimizationSettingsPanel({
  settings = DEFAULT_OPTIMIZATION_SETTINGS,
  onChange,
  furniture = [],
  products = [],
  disabled = false,
  compact = false,
  className,
  optimizationType = 'both',
  showIntegratedSettings = true,
}: OptimizationSettingsPanelProps) {
  // 목표 변경 핸들러
  const handleObjectiveChange = (objective: OptimizationObjective) => {
    onChange({ ...settings, objective });
  };

  // 가구 설정 변경 핸들러
  const handleFurnitureChange = (furnitureSettings: FurnitureSettings) => {
    onChange({ ...settings, furniture: furnitureSettings });
  };

  // 제품 설정 변경 핸들러
  const handleProductsChange = (productSettings: ProductSettings) => {
    onChange({ ...settings, products: productSettings });
  };

  // 강도 변경 핸들러
  const handleIntensityChange = (intensity: OptimizationIntensity) => {
    onChange({ ...settings, intensity });
  };

  // B안: 통합 설정 변경 핸들러
  const handleIntegratedChange = (integratedSettings: IntegratedSettingsType) => {
    onChange({ ...settings, integrated: integratedSettings });
  };

  return (
    <div
      className={cn(
        'space-y-4 p-4 bg-white/5 rounded-xl border border-white/10',
        compact && 'p-3 space-y-3',
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 text-sm font-medium text-white/90">
        <Settings2 className="h-4 w-4 text-purple-400" />
        최적화 설정
      </div>

      {/* 최적화 목표 */}
      <ObjectiveSelector
        value={settings.objective}
        onChange={handleObjectiveChange}
        disabled={disabled}
      />

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* 이동 가능 가구 */}
      <FurnitureSelector
        furniture={furniture}
        settings={settings.furniture}
        onChange={handleFurnitureChange}
        disabled={disabled}
      />

      {/* 재배치 가능 제품 */}
      <ProductSelector
        products={products}
        settings={settings.products}
        onChange={handleProductsChange}
        disabled={disabled}
      />

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* 최적화 강도 */}
      <IntensitySlider
        value={settings.intensity}
        onChange={handleIntensityChange}
        disabled={disabled}
      />

      {/* B안: 통합 최적화 설정 */}
      {showIntegratedSettings && (
        <>
          <div className="border-t border-white/10" />
          <IntegratedOptimizationSettings
            settings={settings.integrated || DEFAULT_INTEGRATED_SETTINGS}
            onChange={handleIntegratedChange}
            optimizationType={optimizationType}
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}

export default OptimizationSettingsPanel;
