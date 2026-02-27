/**
 * SceneSavePanel.tsx
 *
 * 씬 저장/불러오기 패널
 */

import { useState } from 'react';
import { Save, FolderOpen, Trash2, Clock, Loader2, Plus, RotateCcw, AlertTriangle, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SavedScene } from '../types';

// ============================================================================
// Props
// ============================================================================
interface SceneSavePanelProps {
  currentSceneName?: string;
  savedScenes?: SavedScene[];
  isSaving?: boolean;
  isDirty?: boolean;
  onSave?: (name: string) => void;
  onLoad?: (sceneId: string) => void;
  onDelete?: (sceneId: string) => void;
  onNew?: () => void;
  /** 🆕 씬 초기화 (뉴럴트윈 기본값으로 복원) */
  onReset?: () => void;
  /** 🆕 씬 이름 변경 */
  onRename?: (sceneId: string, newName: string) => void;
  /** 최대 저장 가능한 씬 개수 (기본값: 무제한) */
  maxScenes?: number;
}

// ============================================================================
// SceneSavePanel 컴포넌트
// ============================================================================
export function SceneSavePanel({
  currentSceneName = '',
  savedScenes = [],
  isSaving = false,
  isDirty = false,
  onSave,
  onLoad,
  onDelete,
  onNew,
  onReset,
  onRename,
  maxScenes,
}: SceneSavePanelProps) {
  const [sceneName, setSceneName] = useState(currentSceneName);
  const [showInputWarning, setShowInputWarning] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // 🆕 인라인 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 최대 개수 제한 (maxScenes가 설정된 경우)
  const displayedScenes = maxScenes ? savedScenes.slice(0, maxScenes) : savedScenes;
  
  // 🔧 FIX: 기존 씬과 같은 이름이면 업데이트이므로 저장 가능
  const existingScene = savedScenes.find(s => s.name === sceneName.trim());
  const isUpdate = !!existingScene;
  const canSaveNew = maxScenes ? (savedScenes.length < maxScenes || isUpdate) : true;

  const isDisabled = !sceneName.trim() || isSaving || !canSaveNew;

  const handleSave = () => {
    if (!sceneName.trim()) {
      // 빈 입력 상태에서 저장 클릭 시 경고 표시 (2초 후 자동 복귀)
      setShowInputWarning(true);
      setTimeout(() => setShowInputWarning(false), 2000);
      return;
    }
    setShowInputWarning(false);
    onSave?.(sceneName.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSceneName(e.target.value);
    // 입력 시작하면 경고 해제
    if (e.target.value.trim()) {
      setShowInputWarning(false);
    }
  };

  // 🆕 인라인 편집 시작
  const startEditing = (scene: SavedScene) => {
    setEditingId(scene.id);
    setEditingName(scene.name);
  };

  // 🆕 인라인 편집 저장
  const saveEditing = () => {
    if (editingId && editingName.trim() && onRename) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  // 🆕 인라인 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  // 🔧 FIX: created_at 사용 (저장 시간)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      {/* 저장 섹션 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Save className="w-3.5 h-3.5 text-white/60" />
          <span className="text-xs font-medium text-white">씬 저장</span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="저장되지 않은 변경사항" />
          )}
        </div>
        <Input
          value={sceneName}
          onChange={handleInputChange}
          placeholder="씬 이름을 입력하세요"
          className={cn(
            "border-0 text-white h-8 text-xs",
            showInputWarning
              ? "placeholder:text-orange-400 animate-shake"
              : "placeholder:text-white/70"
          )}
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
        <Button
          className={cn(
            "w-full h-7 text-xs transition-all",
            isDisabled
              ? "bg-white/5 text-white/70"
              : isUpdate
              ? "bg-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white"
              : "bg-white/10 text-white/70 hover:bg-gradient-to-r hover:from-purple-700 hover:to-pink-700 hover:text-white"
          )}
          onClick={handleSave}
          disabled={isDisabled}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-3 h-3 mr-1" />
              {isUpdate ? '업데이트' : '저장'}
            </>
          )}
        </Button>
        {/* 상태 표시 */}
        {sceneName.trim() && !canSaveNew && !isUpdate && (
          <p className="text-[10px] text-orange-400 mt-1">
            최대 {maxScenes}개까지 저장 가능합니다
          </p>
        )}
      </div>

      {/* 새 씬 버튼 */}
      <Button
        className="w-full bg-white/10 text-white/70 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white h-7 text-xs transition-all"
        onClick={onNew}
      >
        <Plus className="w-3 h-3 mr-1" />
        새 씬
      </Button>

      {/* 🆕 씬 초기화 버튼 */}
      {onReset && (
        <div className="space-y-2">
          {!showResetConfirm ? (
            <Button
              className="w-full bg-white/5 text-white/50 hover:bg-orange-500/20 hover:text-orange-400 h-7 text-xs transition-all border border-white/10 hover:border-orange-500/30"
              onClick={() => setShowResetConfirm(true)}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              씬 초기화
            </Button>
          ) : (
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-orange-400 font-medium">초기화 확인</p>
                  <p className="text-[10px] text-white/60 mt-0.5">
                    뉴럴트윈이 설정한 최초 기본값으로 복원됩니다. 현재 변경사항이 모두 사라집니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white h-6 text-[10px] transition-all"
                  onClick={() => {
                    onReset();
                    setShowResetConfirm(false);
                  }}
                >
                  초기화 실행
                </Button>
                <Button
                  className="flex-1 bg-white/5 text-white/50 hover:bg-white/10 h-6 text-[10px] transition-all"
                  onClick={() => setShowResetConfirm(false)}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 저장된 씬 목록 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-white">저장된 씬</span>
          <span className="text-[10px] text-white/40">
            {displayedScenes.length}{maxScenes ? `/${maxScenes}` : ''}
          </span>
        </div>

        {displayedScenes.length === 0 ? (
          <p className="text-[10px] text-white/40 py-3 text-center">저장된 씬이 없습니다</p>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {displayedScenes.map((scene) => (
              <div
                key={scene.id}
                className={cn(
                  'flex items-center gap-1.5 p-1.5 rounded transition-colors group',
                  scene.is_active ? 'bg-primary/20' : 'bg-white/5 hover:bg-white/10'
                )}
              >
                <div className="flex-1 min-w-0">
                  {/* 🆕 인라인 편집 모드 */}
                  {editingId === scene.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-5 text-[11px] bg-white/10 border-white/20 text-white px-1.5 py-0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 text-green-400 hover:text-green-300"
                        onClick={saveEditing}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 text-red-400 hover:text-red-300"
                        onClick={cancelEditing}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p 
                        className="text-[11px] text-white truncate flex items-center gap-1 cursor-pointer hover:text-blue-300"
                        onClick={() => startEditing(scene)}
                        title="클릭하여 이름 변경"
                      >
                        {scene.name}
                        {scene.is_active && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-primary/30 text-primary-foreground">
                            활성
                          </span>
                        )}
                      </p>
                      {/* 🔧 FIX: created_at 사용 (저장 시간) */}
                      <p className="text-[9px] text-white/40 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(scene.created_at)}
                      </p>
                    </>
                  )}
                </div>

                {/* 편집 모드가 아닐 때만 버튼 표시 */}
                {editingId !== scene.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onLoad?.(scene.id)}
                    >
                      <FolderOpen className="w-3 h-3 text-white/60" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDelete?.(scene.id)}
                    >
                      <Trash2 className="w-3 h-3 text-red-400/60" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SceneSavePanel;
