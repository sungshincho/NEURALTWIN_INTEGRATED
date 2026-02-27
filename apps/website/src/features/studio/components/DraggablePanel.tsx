/**
 * DraggablePanel.tsx
 *
 * 드래그 가능한 플로팅 패널 컴포넌트
 * - 드래그 앤 드롭으로 자유롭게 이동
 * - 접기/펼치기 토글
 * - 닫기 버튼 (선택적)
 * - 크기 조절 가능 (resizable)
 * - 화면 경계 제한
 */

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { GripVertical, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DraggablePanelProps {
  id: string;
  title: string;
  icon?: ReactNode;
  defaultPosition?: Position;
  /** 오른쪽 끝에서의 오프셋 (픽셀) - 설정 시 left 대신 right 기준으로 배치 */
  rightOffset?: number;
  /** 외부에서 y 위치 동기화 (변경 시 자동 업데이트) */
  syncY?: number;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  closable?: boolean;
  onClose?: () => void;
  /** 접힘 상태 변경 시 콜백 */
  onCollapseChange?: (isCollapsed: boolean) => void;
  /** 패널 높이 변경 시 콜백 (리사이즈, 접힘/펼침 시 호출) */
  onHeightChange?: (height: number) => void;
  width?: string;
  /** 리사이즈 가능 여부 */
  resizable?: boolean;
  /** 최소 크기 */
  minSize?: { width: number; height: number };
  /** 최대 크기 */
  maxSize?: { width: number; height: number };
  children: ReactNode;
  className?: string;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  title,
  icon,
  defaultPosition = { x: 16, y: 16 },
  rightOffset,
  syncY,
  defaultCollapsed = false,
  collapsible = true,
  closable = false,
  onClose,
  onCollapseChange,
  onHeightChange,
  width = 'w-64',
  resizable = true,
  minSize = { width: 180, height: 100 },
  maxSize = { width: 500, height: 600 },
  children,
  className,
}) => {
  // 위치 상태 (left 기반으로 통일)
  const [position, setPosition] = useState<Position>(() => {
    return { x: defaultPosition.x, y: defaultPosition.y };
  });
  // rightOffset에서 left 기반으로 전환되었는지 여부
  const [useLeftPosition, setUseLeftPosition] = useState(!rightOffset);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [size, setSize] = useState<Size | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number; posX: number }>({ x: 0, y: 0, width: 0, height: 0, posX: 0 });

  // 컨테이너 참조 설정 (드래그 경계 계산용)
  useEffect(() => {
    const container = panelRef.current?.closest('.relative') as HTMLElement;
    containerRef.current = container;
  }, []);

  // syncY가 변경되면 y 위치 동기화 (드래그로 이동하지 않은 경우에만)
  useEffect(() => {
    // useLeftPosition이 true면 사용자가 드래그한 것이므로 syncY 무시
    if (syncY !== undefined && !useLeftPosition) {
      setPosition(prev => ({ ...prev, y: syncY }));
    }
  }, [syncY, useLeftPosition]);

  // 접힘 상태 변경 시 부모에게 알림
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  // 패널 높이 변경 감지 (ResizeObserver)
  useEffect(() => {
    if (!panelRef.current || !onHeightChange) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange(entry.contentRect.height);
      }
    });

    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    const container = containerRef.current;
    const containerRect = container?.getBoundingClientRect();

    // rightOffset 모드에서 드래그 시작 시 left 기반으로 전환
    let currentX = position.x;
    if (!useLeftPosition && containerRect) {
      // right 기반 위치를 left 기반으로 변환
      currentX = rect.left - containerRect.left;
      setPosition(prev => ({ ...prev, x: currentX }));
      setUseLeftPosition(true);
    }

    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - currentX,
      y: e.clientY - position.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const containerBounds = containerRef.current?.getBoundingClientRect();
      const maxX = containerBounds ? containerBounds.width - 100 : window.innerWidth - 100;
      const maxY = containerBounds ? containerBounds.height - 50 : window.innerHeight - 50;

      const newX = Math.max(0, Math.min(maxX, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(maxY, e.clientY - dragOffset.current.y));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position, useLeftPosition]);

  // 리사이즈 핸들러
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    const container = containerRef.current;
    const containerRect = container?.getBoundingClientRect();

    // 리사이즈 시작 전 left 기반으로 전환 (좌측 리사이즈를 위해 필요)
    let currentX = position.x;
    if (!useLeftPosition && containerRect) {
      currentX = rect.left - containerRect.left;
      setPosition(prev => ({ ...prev, x: currentX }));
      setUseLeftPosition(true);
    }

    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size?.width || rect.width,
      height: size?.height || rect.height,
      posX: currentX,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.current.x;
      const deltaY = e.clientY - resizeStart.current.y;

      let newWidth = resizeStart.current.width;
      let newHeight = resizeStart.current.height;
      let newPosX = resizeStart.current.posX;

      // 우측 리사이즈 (동쪽)
      if (direction.includes('e')) {
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, resizeStart.current.width + deltaX));
      }
      // 좌측 리사이즈 (서쪽) - 위치도 함께 조정
      if (direction.includes('w')) {
        const widthChange = -deltaX; // 마우스 왼쪽 이동 시 너비 증가
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, resizeStart.current.width + widthChange));
        // 실제 너비 변화량 계산 (min/max 제한 적용 후)
        const actualWidthChange = newWidth - resizeStart.current.width;
        newPosX = resizeStart.current.posX - actualWidthChange;
      }
      // 하단 리사이즈 (남쪽)
      if (direction.includes('s')) {
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, resizeStart.current.height + deltaY));
      }

      setSize({ width: newWidth, height: newHeight });
      if (direction.includes('w')) {
        setPosition(prev => ({ ...prev, x: newPosX }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [size, minSize, maxSize, position.x, useLeftPosition]);

  return (
    <div
      ref={panelRef}
      data-panel-id={id}
      className={cn(
        'absolute z-20 pointer-events-auto',
        !size && width,
        (isDragging || isResizing) ? 'cursor-grabbing select-none' : '',
        className
      )}
      style={{
        // useLeftPosition이면 left 사용, 아니면 rightOffset 사용
        ...(useLeftPosition
          ? { left: position.x, top: position.y }
          : { right: rightOffset, top: position.y }),
        width: size?.width,
        transition: (isDragging || isResizing) ? 'none' : 'box-shadow 0.2s',
      }}
    >
      <div className={cn(
        'bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-xl relative',
        (isDragging || isResizing) && 'ring-2 ring-primary/50'
      )}>
        {/* 헤더 (드래그 핸들) */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing select-none border-b border-white/10 bg-white/5"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
          {icon && <span className="text-white/60 flex-shrink-0">{icon}</span>}
          <span className="flex-1 text-sm font-medium text-white truncate">
            {title}
          </span>

          <div className="flex items-center gap-1">
            {collapsible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-white/60" />
                )}
              </button>
            )}

            {closable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white/60 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* 컨텐츠 */}
        <div
          className={cn(
            'overflow-hidden',
            // 리사이즈 중이 아닐 때만 transition 적용 (접힘 애니메이션용)
            !isResizing && 'transition-all duration-200 ease-in-out',
            isCollapsed ? 'max-h-0' : ''
          )}
          style={{
            maxHeight: isCollapsed ? 0 : (size?.height ? size.height - 40 : 500),
          }}
        >
          <div className="p-3 overflow-y-auto" style={{ maxHeight: size?.height ? size.height - 56 : 460 }}>
            {children}
          </div>
        </div>

        {/* 리사이즈 핸들 (펼쳐진 상태에서만) */}
        {resizable && !isCollapsed && (
          <>
            {/* 좌측 핸들 */}
            <div
              className="absolute top-0 left-0 w-2 h-full cursor-w-resize hover:bg-primary/30 transition-colors"
              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            />
            {/* 우측 핸들 */}
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-primary/30 transition-colors"
              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            />
            {/* 하단 핸들 */}
            <div
              className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-primary/30 transition-colors"
              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            />
            {/* 좌하단 코너 핸들 */}
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-primary/50 transition-colors rounded-tr"
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            />
            {/* 우하단 코너 핸들 */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-primary/50 transition-colors rounded-tl"
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            >
              <svg
                className="w-3 h-3 absolute bottom-0.5 right-0.5 text-white/30"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DraggablePanel;
