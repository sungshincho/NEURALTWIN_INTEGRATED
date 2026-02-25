import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Loader2, Pause, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImportProgress, ImportProgress } from '@/hooks/useImportProgress';

interface UploadProgressCardProps {
  import_id: string;
  file_name: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

const getStageLabel = (stage?: string) => {
  const labels: Record<string, string> = {
    loading: '데이터 로딩 중',
    validation: '데이터 검증 중',
    mapping: '온톨로지 매핑 중',
    etl: 'ETL 처리 중',
    verification: '결과 검증 중',
    completed: '완료',
    failed: '실패'
  };
  return labels[stage || ''] || '처리 중';
};

const getStatusColor = (status: ImportProgress['status']) => {
  const colors = {
    pending: 'bg-gray-500',
    uploading: 'bg-blue-500',
    processing: 'bg-yellow-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    paused: 'bg-orange-500'
  };
  return colors[status] || 'bg-gray-500';
};

const getStatusIcon = (status: ImportProgress['status']) => {
  const icons = {
    pending: Clock,
    uploading: Loader2,
    processing: Loader2,
    completed: CheckCircle,
    failed: AlertCircle,
    paused: Pause
  };
  const Icon = icons[status] || Clock;
  const isSpinning = status === 'uploading' || status === 'processing';
  return <Icon className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />;
};

export function UploadProgressCard({
  import_id,
  file_name,
  onPause,
  onResume,
  onCancel
}: UploadProgressCardProps) {
  const { progress } = useImportProgress(import_id);

  if (!progress) return null;

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{file_name}</span>
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(progress.status)} text-white`}
            >
              {getStatusIcon(progress.status)}
              <span className="ml-1.5">{progress.status}</span>
            </Badge>
          </div>
          
          {progress.stage && (
            <p className="text-xs text-muted-foreground">
              {getStageLabel(progress.stage)}
            </p>
          )}

          {progress.details && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {progress.details.rows_loaded && (
                <div>• {progress.details.rows_loaded}개 행 로드됨</div>
              )}
              {progress.details.quality_score !== undefined && (
                <div>• 데이터 품질: {progress.details.quality_score}/100</div>
              )}
              {progress.details.from_cache && (
                <div>• 캐시된 매핑 사용 (2배 빠름 ⚡)</div>
              )}
              {progress.details.entities_created !== undefined && (
                <div>• {progress.details.entities_created}개 엔티티 생성</div>
              )}
              {progress.details.relations_created !== undefined && (
                <div>• {progress.details.relations_created}개 관계 생성</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {progress.can_pause && progress.status === 'processing' && onPause && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onPause}
              title="일시정지"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          
          {progress.can_resume && progress.status === 'paused' && onResume && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onResume}
              title="재개"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}

          {progress.status !== 'completed' && progress.status !== 'failed' && onCancel && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onCancel}
              title="취소"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {progress.percentage !== undefined && (
        <div className="space-y-1">
          <Progress value={progress.percentage} className="h-2" />
          <p className="text-xs text-right text-muted-foreground">
            {Math.round(progress.percentage)}%
          </p>
        </div>
      )}

      {progress.error && (
        <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{progress.error}</span>
        </div>
      )}
    </div>
  );
}
