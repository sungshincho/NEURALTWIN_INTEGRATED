/**
 * ToolPanel.tsx
 *
 * 도구 패널
 * - 모드 전환 (뷰/편집)
 * - 변환 도구 (이동/회전/스케일)
 */

import { useState, useEffect } from 'react';
import {
  Move,
  RotateCw,
  Maximize,
  Link,
  Trash2,
  MousePointer,
  Eye,
  Edit3,
  Undo,
  Redo,
  Copy,
  Clipboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { StudioMode, TransformMode } from '../types';

// ============================================================================
// Props
// ============================================================================
interface ToolPanelProps {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  onTransformModeChange?: (mode: TransformMode) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelection?: boolean;
}

// ============================================================================
// ToolPanel 컴포넌트
// ============================================================================
export function ToolPanel({
  mode,
  onModeChange,
  onTransformModeChange,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
}: ToolPanelProps) {
  const [activeTool, setActiveTool] = useState<TransformMode>('translate');

  const handleToolChange = (tool: TransformMode) => {
    setActiveTool(tool);
    onTransformModeChange?.(tool);
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 모드 전환
      if (e.key === 'v' && !e.ctrlKey && !e.metaKey) {
        onModeChange('view');
      }
      if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
        onModeChange('edit');
      }

      // 변환 도구
      if (mode === 'edit') {
        if (e.key === 'g') handleToolChange('translate');
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) handleToolChange('rotate');
        if (e.key === 's' && !e.ctrlKey && !e.metaKey) handleToolChange('scale');
      }

      // 실행 취소/다시 실행
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        onRedo?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        onRedo?.();
      }

      // 삭제
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hasSelection) {
          onDelete?.();
        }
      }

      // 복제
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (hasSelection) {
          onDuplicate?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, hasSelection, onModeChange, onDelete, onDuplicate, onUndo, onRedo]);

  const modes = [
    { id: 'view' as const, icon: Eye, label: '뷰 모드', shortcut: 'V' },
    { id: 'edit' as const, icon: Edit3, label: '편집 모드', shortcut: 'E' },
  ];

  const tools = [
    { id: 'translate' as const, icon: Move, label: '이동', shortcut: 'G' },
    { id: 'rotate' as const, icon: RotateCw, label: '회전', shortcut: 'R' },
    { id: 'scale' as const, icon: Maximize, label: '크기', shortcut: 'S' },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {/* 모드 전환 */}
        <div className="flex gap-1 p-1.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg">
          {modes.map((m) => (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    mode === m.id
                      ? 'bg-primary text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                  onClick={() => onModeChange(m.id)}
                >
                  <m.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {m.label} ({m.shortcut})
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* 변환 도구 (편집 모드에서만) */}
        {mode === 'edit' && (
          <div className="flex flex-col gap-1 p-1.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg">
            {tools.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8',
                      activeTool === tool.id
                        ? 'bg-white/20 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    )}
                    onClick={() => handleToolChange(tool.id)}
                  >
                    <tool.icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {tool.label} ({tool.shortcut})
                </TooltipContent>
              </Tooltip>
            ))}

            <div className="h-px bg-white/10 my-1" />

            {/* 복제 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={onDuplicate}
                  disabled={!hasSelection}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">복제 (Ctrl+D)</TooltipContent>
            </Tooltip>

            {/* 삭제 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                  onClick={onDelete}
                  disabled={!hasSelection}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">삭제 (Delete)</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* 실행 취소/다시 실행 */}
        {mode === 'edit' && (
          <div className="flex gap-1 p-1.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={onUndo}
                  disabled={!canUndo}
                >
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">실행 취소 (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={onRedo}
                  disabled={!canRedo}
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">다시 실행 (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default ToolPanel;
