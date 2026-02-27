// ============================================================================
// ImportHistoryWidget.tsx
// 임포트 히스토리 위젯 - Phase 3
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  History,
  RefreshCw,
  Undo2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  Download,
  FileJson,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// ============================================================================
// 3D 스타일 시스템
// ============================================================================

const getText3D = (isDark: boolean) => ({
  title: isDark ? {
    fontWeight: 600, fontSize: '14px', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '14px',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #2a2a2f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px',
    background: 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
    <div style={{
      borderRadius: '24px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25), 0 16px 32px rgba(0,0,0,0.2)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02), 0 16px 16px rgba(0,0,0,0.02)',
      height: '100%',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '23px', height: '100%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: dark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.08) 55%, transparent 100%)',
          borderRadius: '23px 23px 50% 50%', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 44, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)',
    flexShrink: 0,
  }}>
    {!dark && <div style={{ position: 'absolute', top: '3px', left: '15%', right: '15%', height: '35%',
      background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
      borderRadius: '40% 40% 50% 50%', pointerEvents: 'none',
    }} />}
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

// ============================================================================
// Types
// ============================================================================

interface ImportRecord {
  id: string;
  session_id: string;
  user_id: string;
  org_id: string | null;
  store_id: string | null;
  import_type: string;
  target_table: string;
  file_name: string;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed' | 'rolled_back';
  started_at: string;
  completed_at: string | null;
  error_details: Array<{ batch_start: number; batch_end: number; error: string }> | null;
  created_at: string;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
> = {
  pending: {
    label: '대기',
    variant: 'secondary',
    icon: <Loader2 className="w-3 h-3" />,
  },
  processing: {
    label: '처리중',
    variant: 'secondary',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  completed: {
    label: '완료',
    variant: 'default',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  partial: {
    label: '부분완료',
    variant: 'outline',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  failed: {
    label: '실패',
    variant: 'destructive',
    icon: <XCircle className="w-3 h-3" />,
  },
  rolled_back: {
    label: '롤백됨',
    variant: 'outline',
    icon: <Undo2 className="w-3 h-3" />,
  },
};

const IMPORT_TYPE_LABELS: Record<string, string> = {
  products: '상품',
  customers: '고객',
  transactions: '거래',
  staff: '직원',
  inventory: '재고',
};

// ============================================================================
// Component
// ============================================================================

interface ImportHistoryWidgetProps {
  onRollback?: (importId: string) => void;
  className?: string;
}

export function ImportHistoryWidget({ onRollback, className }: ImportHistoryWidgetProps) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  const { user } = useAuth();
  const { toast } = useToast();

  // 다크 모드 감지
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  // 히스토리 로드
  const loadHistory = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_data_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setImports((data as unknown as ImportRecord[]) || []);
    } catch (err) {
      console.error('Failed to load import history:', err);
      toast({
        title: '히스토리 로드 실패',
        description: '임포트 히스토리를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 롤백 핸들러
  const handleRollback = async (importRecord: ImportRecord) => {
    setIsRollingBack(importRecord.id);
    setShowRollbackDialog(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // rollback-import Edge Function 호출
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rollback-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            import_id: importRecord.id,
            session_id: importRecord.session_id,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '롤백에 실패했습니다.');
      }

      toast({
        title: '롤백 완료',
        description: `${data.rolled_back_rows}개 레코드가 롤백되었습니다.`,
      });

      // 히스토리 새로고침
      loadHistory();
      onRollback?.(importRecord.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : '롤백 실패';
      toast({
        title: '롤백 실패',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsRollingBack(null);
      setSelectedImport(null);
    }
  };

  // 에러 리포트 다운로드 (CSV/JSON 포맷 지원)
  const handleDownloadErrors = (importRecord: ImportRecord, format: 'csv' | 'json' | 'txt' = 'csv') => {
    if (!importRecord.error_details || importRecord.error_details.length === 0) {
      toast({
        title: '에러 없음',
        description: '해당 임포트에 에러가 없습니다.',
      });
      return;
    }

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'json':
        content = JSON.stringify({
          import_id: importRecord.id,
          file_name: importRecord.file_name,
          import_type: importRecord.import_type,
          total_rows: importRecord.total_rows,
          imported_rows: importRecord.imported_rows,
          failed_rows: importRecord.failed_rows,
          status: importRecord.status,
          created_at: importRecord.created_at,
          errors: importRecord.error_details.map((err, i) => ({
            index: i + 1,
            batch_start: err.batch_start,
            batch_end: err.batch_end,
            error: err.error,
          })),
        }, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;

      case 'csv':
        const csvHeaders = ['번호', '시작행', '종료행', '에러 메시지'];
        const csvRows = importRecord.error_details.map((err, i) =>
          [i + 1, err.batch_start, err.batch_end, `"${err.error.replace(/"/g, '""')}"`].join(',')
        );
        content = [csvHeaders.join(','), ...csvRows].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
        break;

      default: // txt
        content = `임포트 에러 리포트
========================================
파일: ${importRecord.file_name}
타입: ${importRecord.import_type}
일시: ${importRecord.created_at}
총 행: ${importRecord.total_rows}
성공: ${importRecord.imported_rows}
실패: ${importRecord.failed_rows}
========================================

에러 목록:
${importRecord.error_details.map((err, i) =>
  `${i + 1}. 행 ${err.batch_start}-${err.batch_end}: ${err.error}`
).join('\n')}`;
        mimeType = 'text/plain';
        extension = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${importRecord.id.slice(0, 8)}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: '다운로드 완료',
      description: `에러 리포트가 ${extension.toUpperCase()} 형식으로 저장되었습니다.`,
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={44} dark={isDark}>
              <History className="w-5 h-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <span style={text3D.label}>Import History</span>
              <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>임포트 히스토리</h3>
            </div>
          </div>
          <button
            onClick={loadHistory}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-50"
            style={{
              background: isDark
                ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,255,0.8) 100%)',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)'
                : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: isDark ? '#ffffff' : '#1a1a1f' }} />
            ) : (
              <RefreshCw className="w-4 h-4" style={{ color: isDark ? '#ffffff' : '#1a1a1f' }} />
            )}
          </button>
        </div>

        <div>
        {isLoading && imports.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : imports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>임포트 기록이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파일명</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead className="text-right">행</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>일시</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((record) => {
                  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="max-w-[150px] truncate font-medium">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{record.file_name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{record.file_name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {IMPORT_TYPE_LABELS[record.import_type] || record.import_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600">{record.imported_rows}</span>
                        {record.failed_rows > 0 && (
                          <>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-red-600">{record.failed_rows}</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="gap-1">
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(record.created_at), 'MM/dd HH:mm', { locale: ko })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* 에러 다운로드 (포맷 선택) */}
                          {record.error_details && record.error_details.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownloadErrors(record, 'csv')}>
                                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                                  CSV 형식
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadErrors(record, 'json')}>
                                  <FileJson className="w-4 h-4 mr-2" />
                                  JSON 형식
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadErrors(record, 'txt')}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  텍스트 형식
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* 롤백 버튼 */}
                          {(record.status === 'completed' || record.status === 'partial') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-orange-500 hover:text-orange-600"
                                    disabled={isRollingBack === record.id}
                                    onClick={() => {
                                      setSelectedImport(record);
                                      setShowRollbackDialog(true);
                                    }}
                                  >
                                    {isRollingBack === record.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Undo2 className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>임포트 롤백</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        </div>
      </div>

      {/* 롤백 확인 다이얼로그 */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-orange-500" />
              임포트 롤백
            </DialogTitle>
            <DialogDescription>
              이 작업은 임포트된 데이터를 삭제합니다. 계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          {selectedImport && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">파일명:</span>
                <span className="font-medium">{selectedImport.file_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">타입:</span>
                <Badge variant="secondary">
                  {IMPORT_TYPE_LABELS[selectedImport.import_type] || selectedImport.import_type}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">임포트 행:</span>
                <span className="text-green-600 font-medium">{selectedImport.imported_rows}행</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">일시:</span>
                <span>
                  {format(new Date(selectedImport.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedImport && handleRollback(selectedImport)}
              disabled={isRollingBack !== null}
            >
              {isRollingBack ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Undo2 className="w-4 h-4 mr-1" />
              )}
              롤백 실행
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}

export default ImportHistoryWidget;
