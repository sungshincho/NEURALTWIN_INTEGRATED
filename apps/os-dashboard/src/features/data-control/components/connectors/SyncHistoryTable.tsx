// ============================================================================
// Phase 8: SyncHistoryTable Component
// 동기화 이력 테이블 컴포넌트
// ============================================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  History,
  Eye,
  Calendar,
  Zap,
  Timer,
  Database,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================

interface SyncLog {
  id: string;
  api_connection_id: string;
  connection_name?: string;
  provider?: string;
  data_category?: string;
  sync_type: 'scheduled' | 'manual' | 'retry';
  status: 'running' | 'success' | 'partial' | 'failed';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  records_fetched: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_type?: string;
  error_message?: string;
  raw_import_id?: string;
  etl_run_id?: string;
}

interface SyncHistoryTableProps {
  connectionId?: string;
  orgId?: string;
  showConnectionName?: boolean;
  limit?: number;
  compact?: boolean;
}

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: SyncLog['status'] }) {
  const config = {
    running: {
      icon: Loader2,
      label: '실행 중',
      variant: 'outline' as const,
      className: 'border-blue-500 text-blue-500',
      iconClassName: 'animate-spin',
    },
    success: {
      icon: CheckCircle,
      label: '성공',
      variant: 'outline' as const,
      className: 'border-green-500 text-green-500',
      iconClassName: '',
    },
    partial: {
      icon: AlertTriangle,
      label: '부분 성공',
      variant: 'outline' as const,
      className: 'border-yellow-500 text-yellow-500',
      iconClassName: '',
    },
    failed: {
      icon: XCircle,
      label: '실패',
      variant: 'outline' as const,
      className: 'border-red-500 text-red-500',
      iconClassName: '',
    },
  };

  const { icon: Icon, label, variant, className, iconClassName } = config[status];

  return (
    <Badge variant={variant} className={`gap-1 ${className}`}>
      <Icon className={`h-3 w-3 ${iconClassName}`} />
      {label}
    </Badge>
  );
}

// ============================================================================
// Sync Type Badge Component
// ============================================================================

function SyncTypeBadge({ type }: { type: SyncLog['sync_type'] }) {
  const config = {
    scheduled: { label: '스케줄', icon: Calendar, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    manual: { label: '수동', icon: Zap, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    retry: { label: '재시도', icon: RefreshCw, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  };

  const { label, icon: Icon, color } = config[type] || config.manual;

  return (
    <Badge variant="secondary" className={`gap-1 ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// Detail Dialog Component
// ============================================================================

function SyncDetailDialog({ log }: { log: SyncLog }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            동기화 상세 정보
          </DialogTitle>
          <DialogDescription>
            {format(new Date(log.started_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 상태 및 유형 */}
          <div className="flex items-center gap-3">
            <StatusBadge status={log.status} />
            <SyncTypeBadge type={log.sync_type} />
            {log.connection_name && (
              <Badge variant="outline">{log.connection_name}</Badge>
            )}
          </div>

          {/* 시간 정보 */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">시작 시간</div>
                  <div className="font-medium">
                    {format(new Date(log.started_at), 'HH:mm:ss')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">완료 시간</div>
                  <div className="font-medium">
                    {log.completed_at
                      ? format(new Date(log.completed_at), 'HH:mm:ss')
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">소요 시간</div>
                  <div className="font-medium">
                    {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(2)}s` : '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 레코드 처리 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">레코드 처리 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center p-2 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{log.records_fetched}</div>
                  <div className="text-xs text-muted-foreground">가져옴</div>
                </div>
                <div className="text-center p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{log.records_created}</div>
                  <div className="text-xs text-muted-foreground">생성</div>
                </div>
                <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{log.records_updated}</div>
                  <div className="text-xs text-muted-foreground">업데이트</div>
                </div>
                <div className="text-center p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{log.records_failed}</div>
                  <div className="text-xs text-muted-foreground">실패</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 에러 정보 */}
          {log.error_message && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  오류 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                {log.error_type && (
                  <Badge variant="destructive" className="mb-2">
                    {log.error_type}
                  </Badge>
                )}
                <p className="text-sm text-red-600">{log.error_message}</p>
              </CardContent>
            </Card>
          )}

          {/* 관련 ID */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Log ID: {log.id}</div>
            {log.raw_import_id && <div>Raw Import ID: {log.raw_import_id}</div>}
            {log.etl_run_id && <div>ETL Run ID: {log.etl_run_id}</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Hook: useSyncHistory
// ============================================================================

function useSyncHistory(params: {
  connectionId?: string;
  orgId?: string;
  limit: number;
  offset: number;
}) {
  return useQuery({
    queryKey: ['sync-history', params],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sync_history', {
        p_connection_id: params.connectionId || null,
        p_org_id: params.orgId || null,
        p_limit: params.limit,
        p_offset: params.offset,
      });

      if (error) throw error;
      return data as unknown as {
        success: boolean;
        logs: SyncLog[];
        total: number;
        limit: number;
        offset: number;
      };
    },
    refetchInterval: 10000, // 10초마다 새로고침
  });
}

// ============================================================================
// Main Component
// ============================================================================

export function SyncHistoryTable({
  connectionId,
  orgId,
  showConnectionName = false,
  limit = 10,
  compact = false,
}: SyncHistoryTableProps) {
  const [pageSize, setPageSize] = useState(limit);
  const [currentPage, setCurrentPage] = useState(0);

  const { data, isLoading, error, refetch } = useSyncHistory({
    connectionId,
    orgId,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const logs = data?.logs || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p>동기화 이력을 불러오는 중 오류가 발생했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  // 데이터 없음
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>동기화 이력이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            동기화 이력
          </CardTitle>
          <CardDescription>
            총 {data?.total || 0}건의 동기화 기록
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="w-[80px]">유형</TableHead>
                {showConnectionName && <TableHead>연결</TableHead>}
                <TableHead>시간</TableHead>
                {!compact && (
                  <>
                    <TableHead className="text-right">가져옴</TableHead>
                    <TableHead className="text-right">생성</TableHead>
                    <TableHead className="text-right">업데이트</TableHead>
                  </>
                )}
                <TableHead className="text-right">소요 시간</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <StatusBadge status={log.status} />
                  </TableCell>
                  <TableCell>
                    <SyncTypeBadge type={log.sync_type} />
                  </TableCell>
                  {showConnectionName && (
                    <TableCell className="font-medium">
                      {log.connection_name || '-'}
                    </TableCell>
                  )}
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDistanceToNow(new Date(log.started_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(log.started_at), 'yyyy-MM-dd HH:mm:ss')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {!compact && (
                    <>
                      <TableCell className="text-right font-mono text-sm">
                        {log.records_fetched.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-green-600">
                        +{log.records_created.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-blue-600">
                        ~{log.records_updated.toLocaleString()}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SyncDetailDialog log={log} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              페이지 {currentPage + 1} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default SyncHistoryTable;
