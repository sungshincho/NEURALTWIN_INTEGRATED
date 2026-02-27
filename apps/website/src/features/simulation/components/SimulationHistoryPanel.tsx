import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Trash2,
  FileText,
  Download,
  MoreVertical,
  Network,
  Calendar,
  Search,
  GitCompare,
  StickyNote,
  Tag,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useSimulationHistory, SimulationHistoryItem, SimulationType } from '../hooks/useSimulationHistory';
import { exportSimulationResult, ExportFormat } from '../utils/simulationExporter';
import { toast } from 'sonner';

interface SimulationHistoryPanelProps {
  onSelectResult?: (result: any) => void;
  onCompare?: (results: SimulationHistoryItem[]) => void;
  filterType?: SimulationType;
}

const TYPE_LABELS: Record<SimulationType, string> = {
  demand: '수요 예측',
  inventory: '재고 최적화',
  pricing: '가격 최적화',
  layout: '레이아웃',
  marketing: '마케팅',
};

const TYPE_COLORS: Record<SimulationType, string> = {
  demand: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  inventory: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pricing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  layout: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

/**
 * SimulationHistoryPanel
 * 
 * 시뮬레이션 히스토리 목록, 필터링, 비교, 내보내기 기능
 */
export function SimulationHistoryPanel({
  onSelectResult,
  onCompare,
  filterType,
}: SimulationHistoryPanelProps) {
  const {
    history,
    loading,
    deleteFromHistory,
    updateNote,
    addTags,
    compareResults,
  } = useSimulationHistory();

  // 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SimulationType | 'all'>(filterType || 'all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<SimulationHistoryItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  // 필터링된 히스토리
  const filteredHistory = useMemo(() => {
    let filtered = history;

    // 타입 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.simulationType === typeFilter);
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.storeName?.toLowerCase().includes(query) ||
        item.note?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        TYPE_LABELS[item.simulationType].toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [history, typeFilter, searchQuery]);

  // 선택 토글
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map(item => item.id)));
    }
  };

  // 내보내기
  const handleExport = async (item: SimulationHistoryItem, format: ExportFormat) => {
    await exportSimulationResult(item.simulationType, item.result, format, {
      filename: `${item.simulationType}_${new Date(item.createdAt).toISOString().split('T')[0]}`,
      includeOntologyInsights: true,
    });
  };

  // 노트 저장
  const handleSaveNote = async () => {
    if (!noteTarget) return;
    
    const success = await updateNote(noteTarget.id, noteText);
    if (success) {
      toast.success('노트가 저장되었습니다');
      setNoteDialogOpen(false);
      setNoteTarget(null);
      setNoteText('');
    }
  };

  // 비교 실행
  const handleCompare = async () => {
    if (selectedIds.size < 2) {
      toast.error('비교하려면 2개 이상 선택하세요');
      return;
    }

    const result = await compareResults(Array.from(selectedIds));
    if (result && onCompare) {
      onCompare(result.items);
    }
    setCompareDialogOpen(true);
  };

  // 선택된 항목 일괄 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`${selectedIds.size}개 항목을 삭제하시겠습니까?`)) return;

    for (const id of selectedIds) {
      await deleteFromHistory(id);
    }
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size}개 항목이 삭제되었습니다`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              시뮬레이션 히스토리
            </CardTitle>
            <CardDescription>
              이전 시뮬레이션 결과 조회 및 비교
            </CardDescription>
          </div>
          
          {/* 액션 버튼 */}
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompare}
                  disabled={selectedIds.size < 2}
                >
                  <GitCompare className="h-4 w-4 mr-1" />
                  비교 ({selectedIds.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 필터 바 */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="검색 (매장명, 노트, 태그...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSelectAll}
          >
            {selectedIds.size === filteredHistory.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            로딩 중...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>저장된 시뮬레이션 결과가 없습니다</p>
            <p className="text-sm">시뮬레이션을 실행하면 자동으로 저장됩니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelection(item.id)}
                onSelect={() => onSelectResult?.(item.result)}
                onDelete={() => deleteFromHistory(item.id)}
                onExport={(format) => handleExport(item, format)}
                onEditNote={() => {
                  setNoteTarget(item);
                  setNoteText(item.note || '');
                  setNoteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* 노트 편집 다이얼로그 */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>노트 편집</DialogTitle>
            <DialogDescription>
              이 시뮬레이션 결과에 대한 메모를 추가하세요
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="노트 입력..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveNote}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// 히스토리 아이템 컴포넌트
function HistoryItem({
  item,
  isSelected,
  onToggleSelect,
  onSelect,
  onDelete,
  onExport,
  onEditNote,
}: {
  item: SimulationHistoryItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onExport: (format: ExportFormat) => void;
  onEditNote: () => void;
}) {
  const formattedDate = new Date(item.createdAt).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-colors
        ${isSelected ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'}
      `}
    >
      {/* 선택 체크박스 */}
      <button onClick={onToggleSelect} className="shrink-0">
        {isSelected ? (
          <CheckSquare className="h-5 w-5 text-primary" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* 정보 */}
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center gap-2 mb-1">
          <Badge className={TYPE_COLORS[item.simulationType]}>
            {TYPE_LABELS[item.simulationType]}
          </Badge>
          {item.ontologyEnhanced && (
            <Badge variant="outline" className="gap-1">
              <Network className="h-3 w-3" />
              온톨로지
            </Badge>
          )}
          <span className="text-sm font-medium">{item.confidenceScore}%</span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          {item.note && (
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <StickyNote className="h-3 w-3" />
              {item.note}
            </span>
          )}
        </div>

        {/* 태그 */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 액션 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSelect}>
            <FileText className="h-4 w-4 mr-2" />
            결과 보기
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEditNote}>
            <StickyNote className="h-4 w-4 mr-2" />
            노트 편집
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV 내보내기
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            JSON 내보내기
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF 내보내기
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default SimulationHistoryPanel;
