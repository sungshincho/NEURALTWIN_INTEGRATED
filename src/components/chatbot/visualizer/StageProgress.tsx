/**
 * NEURALTWIN Store Visualizer - Stage Progress Component (A-5 Enhanced)
 *
 * 고객 여정 단계 프로그레스 표시
 * - slide-up 등장 애니메이션 (단계 전환 시 재트리거)
 * - glassmorphism 스타일 강화
 * 🚪 1 진입 ─ 👀 2 탐색 ─ 💳 3 결제
 */

import { useEffect, useRef, useState } from 'react';
import type { CustomerStage } from './vizDirectiveTypes';

interface StageProgressProps {
  currentStage?: CustomerStage;
  stage?: CustomerStage;
}

interface StageConfig {
  id: CustomerStage;
  icon: string;
  number: number;
  label: string;
}

const STAGES: StageConfig[] = [
  { id: 'entry', icon: '🚪', number: 1, label: '진입' },
  { id: 'exploration', icon: '👀', number: 2, label: '탐색' },
  { id: 'purchase', icon: '💳', number: 3, label: '결제' }
];

const STAGE_ORDER: Record<CustomerStage, number> = {
  entry: 0,
  exploration: 1,
  purchase: 2
};

export default function StageProgress({ currentStage, stage }: StageProgressProps) {
  const activeStage = currentStage || stage;
  const prevStageRef = useRef<CustomerStage | undefined>(undefined);
  const [animKey, setAnimKey] = useState(0);

  // 단계가 변경되면 애니메이션 키를 업데이트하여 slide-up 재트리거
  useEffect(() => {
    if (activeStage && activeStage !== prevStageRef.current) {
      setAnimKey((k) => k + 1);
      prevStageRef.current = activeStage;
    }
  }, [activeStage]);

  if (!activeStage) {
    return null;
  }

  const currentIndex = STAGE_ORDER[activeStage];

  return (
    <>
      {/* CSS 애니메이션 정의 */}
      <style>{`
        @keyframes stageSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        key={animKey}
        className="flex items-center justify-center gap-0"
        style={{
          background: 'linear-gradient(to top, rgba(3,7,18,0.88) 50%, transparent 100%)',
          padding: 'clamp(8px, 1.2vw, 12px) clamp(8px, 2vw, 16px)',
          animation: 'stageSlideUp 0.35s ease-out both',
        }}
      >
        {STAGES.map((stageItem, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          // glassmorphism 스타일 결정
          let bgStyle = 'rgba(6, 11, 21, 0.8)';
          let borderStyle = 'rgba(30, 41, 59, 0.5)';
          let textColor = '#475569';
          let glowShadow = 'none';

          if (isCurrent) {
            bgStyle = 'rgba(14, 165, 233, 0.1)';
            borderStyle = 'rgba(14, 165, 233, 0.3)';
            textColor = '#0ea5e9';
            glowShadow = '0 0 12px rgba(14, 165, 233, 0.15)';
          } else if (isCompleted) {
            bgStyle = 'rgba(34, 197, 94, 0.06)';
            borderStyle = 'rgba(34, 197, 94, 0.25)';
            textColor = '#22c55e';
            glowShadow = '0 0 8px rgba(34, 197, 94, 0.1)';
          }

          // 연결선 색상
          const lineColor = isCompleted ? 'bg-[#22c55e44]' : 'bg-[#1e293b]';

          return (
            <div key={stageItem.id} className="flex items-center">
              {/* 단계 카드 */}
              <div
                className="flex items-center rounded-full transition-all duration-300"
                style={{
                  gap: 'clamp(4px, 0.8vw, 8px)',
                  padding: 'clamp(4px, 0.8vw, 8px) clamp(8px, 1.5vw, 16px)',
                  background: bgStyle,
                  border: `1px solid ${borderStyle}`,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: `${glowShadow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
                }}
              >
                <span style={{ fontSize: 'clamp(12px, 2vw, 16px)' }}>{stageItem.icon}</span>
                <span
                  className="font-medium"
                  style={{
                    fontFamily: "'Fira Code', 'Noto Sans KR', monospace",
                    fontSize: 'clamp(10px, 1.8vw, 12px)',
                    color: textColor,
                    textShadow: isCurrent ? '0 0 6px rgba(14, 165, 233, 0.3)' : 'none',
                  }}
                >
                  {stageItem.number} {stageItem.label}
                </span>
              </div>

              {/* 연결선 (마지막 단계 제외) */}
              {index < STAGES.length - 1 && (
                <div
                  className={`h-[2px] ${lineColor} transition-colors duration-300`}
                  style={{
                    width: 'clamp(10px, 2vw, 24px)',
                    margin: '0 clamp(1px, 0.4vw, 4px)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
