/**
 * PropertyPanel.tsx
 *
 * 선택된 모델의 Position/Rotation/Scale 수치 입력 패널
 * - useScene() 훅에서 selectedModel, updateModel 사용
 * - Position X,Y,Z / Rotation X,Y,Z (도 단위) / Scale X,Y,Z 입력 필드
 * - 균등 스케일 토글 (Link 아이콘)
 * - 리셋 버튼
 * - 모델 미선택 시 안내 메시지
 */

import { useState, useEffect } from 'react';
import { Link, Unlink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useScene } from '../core/SceneProvider';
import type { Vector3Tuple } from '../types';

// ============================================================================
// 유틸리티 함수
// ============================================================================

// 라디안 → 도(degree)
const radToDeg = (rad: number): number => {
  return (rad * 180) / Math.PI;
};

// 도(degree) → 라디안
const degToRad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};

// 소수점 자르기
const roundTo = (num: number, decimals: number = 3): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// ============================================================================
// Props
// ============================================================================
interface PropertyPanelProps {
  className?: string;
}

// ============================================================================
// PropertyPanel 컴포넌트
// ============================================================================
export function PropertyPanel({ className }: PropertyPanelProps) {
  const { selectedModel, updateModel } = useScene();

  // 로컬 상태 (입력 중 동기화)
  const [position, setPosition] = useState<Vector3Tuple>([0, 0, 0]);
  const [rotation, setRotation] = useState<Vector3Tuple>([0, 0, 0]); // 도 단위
  const [scale, setScale] = useState<Vector3Tuple>([1, 1, 1]);
  const [uniformScale, setUniformScale] = useState(true);

  // 선택된 모델이 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (selectedModel) {
      setPosition([...selectedModel.position]);
      setRotation([
        roundTo(radToDeg(selectedModel.rotation[0])),
        roundTo(radToDeg(selectedModel.rotation[1])),
        roundTo(radToDeg(selectedModel.rotation[2])),
      ]);
      setScale([...selectedModel.scale]);
    }
  }, [selectedModel]);

  // 모델 미선택 시
  if (!selectedModel) {
    return (
      <div className={cn('p-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl', className)}>
        <p className="text-sm text-white/60 text-center">모델을 선택해주세요</p>
      </div>
    );
  }

  // ============================================================================
  // 핸들러
  // ============================================================================

  const handlePositionChange = (axis: 0 | 1 | 2, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newPosition: Vector3Tuple = [...position];
    newPosition[axis] = numValue;
    setPosition(newPosition);
    updateModel(selectedModel.id, { position: newPosition });
  };

  const handleRotationChange = (axis: 0 | 1 | 2, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newRotation: Vector3Tuple = [...rotation];
    newRotation[axis] = numValue;
    setRotation(newRotation);

    // 라디안으로 변환하여 updateModel
    const newRotationRad: Vector3Tuple = [
      degToRad(newRotation[0]),
      degToRad(newRotation[1]),
      degToRad(newRotation[2]),
    ];
    updateModel(selectedModel.id, { rotation: newRotationRad });
  };

  const handleScaleChange = (axis: 0 | 1 | 2, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    let newScale: Vector3Tuple = [...scale];

    if (uniformScale) {
      // 균등 스케일
      newScale = [numValue, numValue, numValue];
    } else {
      // 개별 스케일
      newScale[axis] = numValue;
    }

    setScale(newScale);
    updateModel(selectedModel.id, { scale: newScale });
  };

  const handleReset = () => {
    const defaultPosition: Vector3Tuple = [0, 0, 0];
    const defaultRotation: Vector3Tuple = [0, 0, 0];
    const defaultScale: Vector3Tuple = [1, 1, 1];

    setPosition(defaultPosition);
    setRotation(defaultRotation);
    setScale(defaultScale);

    updateModel(selectedModel.id, {
      position: defaultPosition,
      rotation: defaultRotation,
      scale: defaultScale,
    });
  };

  const axisColors = {
    x: 'text-red-400',
    y: 'text-green-400',
    z: 'text-blue-400',
  };

  return (
    <div className={cn('p-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">속성</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
          onClick={handleReset}
          title="리셋"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      {/* 모델 이름 */}
      <div className="text-xs text-white/80 font-medium truncate">{selectedModel.name}</div>

      {/* Position */}
      <PropertySection title="Position">
        {(['x', 'y', 'z'] as const).map((axis, idx) => (
          <PropertyInput
            key={axis}
            label={axis.toUpperCase()}
            value={roundTo(position[idx], 3)}
            onChange={(val) => handlePositionChange(idx as 0 | 1 | 2, val)}
            colorClass={axisColors[axis]}
          />
        ))}
      </PropertySection>

      {/* Rotation */}
      <PropertySection title="Rotation (°)">
        {(['x', 'y', 'z'] as const).map((axis, idx) => (
          <PropertyInput
            key={axis}
            label={axis.toUpperCase()}
            value={roundTo(rotation[idx], 2)}
            onChange={(val) => handleRotationChange(idx as 0 | 1 | 2, val)}
            colorClass={axisColors[axis]}
          />
        ))}
      </PropertySection>

      {/* Scale */}
      <PropertySection
        title="Scale"
        extra={
          <button
            onClick={() => setUniformScale(!uniformScale)}
            className="text-white/60 hover:text-white transition-colors"
            title={uniformScale ? '균등 스케일' : '개별 스케일'}
          >
            {uniformScale ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
          </button>
        }
      >
        {(['x', 'y', 'z'] as const).map((axis, idx) => (
          <PropertyInput
            key={axis}
            label={axis.toUpperCase()}
            value={roundTo(scale[idx], 3)}
            onChange={(val) => handleScaleChange(idx as 0 | 1 | 2, val)}
            colorClass={axisColors[axis]}
            disabled={uniformScale && idx !== 0}
          />
        ))}
      </PropertySection>
    </div>
  );
}

// ============================================================================
// PropertySection 컴포넌트
// ============================================================================
interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}

function PropertySection({ title, children, extra }: PropertySectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-white/80 font-medium">{title}</Label>
        {extra}
      </div>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

// ============================================================================
// PropertyInput 컴포넌트
// ============================================================================
interface PropertyInputProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  colorClass: string;
  disabled?: boolean;
}

function PropertyInput({ label, value, onChange, colorClass, disabled = false }: PropertyInputProps) {
  return (
    <div className="space-y-1">
      <Label className={cn('text-xs font-bold', colorClass)}>{label}</Label>
      <Input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'h-7 text-xs bg-black/40 border-white/10 text-white',
          'focus:border-white/30 focus:ring-0',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  );
}

export default PropertyPanel;
