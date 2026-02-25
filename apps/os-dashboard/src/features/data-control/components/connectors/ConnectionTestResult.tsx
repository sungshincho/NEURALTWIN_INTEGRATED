// ============================================================================
// Phase 8: ConnectionTestResult Component
// 연결 테스트 결과 표시 컴포넌트
// ============================================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  List,
  Zap,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import { ConnectionTestResult as TestResultType } from '../../types';

// ============================================================================
// Props Interface
// ============================================================================

interface ConnectionTestResultProps {
  result: TestResultType;
  showSampleData?: boolean;
  compact?: boolean;
}

// ============================================================================
// Status Indicator Component
// ============================================================================

function StatusIndicator({ success }: { success: boolean }) {
  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">연결 성공</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-red-600">
      <XCircle className="h-5 w-5" />
      <span className="font-medium">연결 실패</span>
    </div>
  );
}

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

function MetricCard({ icon: Icon, label, value, subValue, color = 'text-muted-foreground' }: MetricCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && (
          <div className="text-xs text-muted-foreground mt-0.5">{subValue}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConnectionTestResult({
  result,
  showSampleData = true,
  compact = false,
}: ConnectionTestResultProps) {
  // 실패 시 에러 표시
  if (!result.success) {
    return (
      <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
        <XCircle className="h-4 w-4" />
        <AlertTitle>연결 실패</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{result.error || '알 수 없는 오류가 발생했습니다'}</p>
          {result.status_code && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                HTTP {result.status_code}
              </Badge>
              {result.response_time_ms && (
                <span className="text-xs text-muted-foreground">
                  {result.response_time_ms}ms
                </span>
              )}
            </div>
          )}
          {result.error_details && (
            <pre className="mt-2 text-xs bg-destructive/10 p-2 rounded overflow-auto max-h-32">
              {typeof result.error_details === 'string'
                ? result.error_details
                : JSON.stringify(result.error_details, null, 2)}
            </pre>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Compact 모드
  if (compact) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-600">연결 성공</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          {result.response_time_ms}ms 응답 / {result.record_count?.toLocaleString()}개 레코드 감지
        </AlertDescription>
      </Alert>
    );
  }

  // 전체 모드
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* 성공 알림 */}
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-600">연결 성공</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          API 연결이 정상적으로 확인되었습니다. 아래에서 상세 정보를 확인하세요.
        </AlertDescription>
      </Alert>

      {/* 메트릭 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          icon={Clock}
          label="응답 시간"
          value={`${result.response_time_ms || 0}ms`}
          subValue={
            result.response_time_ms && result.response_time_ms < 500
              ? '빠름'
              : result.response_time_ms && result.response_time_ms < 2000
              ? '보통'
              : '느림'
          }
          color={
            result.response_time_ms && result.response_time_ms < 500
              ? 'text-green-500'
              : result.response_time_ms && result.response_time_ms < 2000
              ? 'text-yellow-500'
              : 'text-red-500'
          }
        />

        <MetricCard
          icon={Database}
          label="레코드 수"
          value={result.record_count?.toLocaleString() || '0'}
          subValue="감지된 데이터"
        />

        <MetricCard
          icon={List}
          label="필드 수"
          value={result.detected_fields?.length || 0}
          subValue="감지된 필드"
        />
      </div>

      {/* HTTP 상태 */}
      {result.status_code && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">HTTP 상태:</span>
          <Badge
            variant={result.status_code === 200 ? 'default' : 'secondary'}
            className="font-mono"
          >
            {result.status_code}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {result.response_time_ms}ms
          </span>
        </div>
      )}

      {/* 감지된 필드 */}
      {result.detected_fields && result.detected_fields.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <List className="h-4 w-4" />
              감지된 필드 ({result.detected_fields.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.detected_fields.map((field) => (
                <Badge key={field} variant="secondary" className="font-mono text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 샘플 데이터 */}
      {showSampleData && result.sample_data && result.sample_data.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              샘플 데이터 (최대 3건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64 font-mono">
              {JSON.stringify(result.sample_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 경고 메시지 (레코드가 없는 경우) */}
      {result.record_count === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>데이터 없음</AlertTitle>
          <AlertDescription>
            API 연결은 성공했지만 현재 데이터가 없습니다. 응답 데이터 경로 설정을 확인하세요.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ConnectionTestResult;
