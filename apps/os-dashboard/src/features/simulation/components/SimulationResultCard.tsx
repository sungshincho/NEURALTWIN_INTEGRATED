import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  RefreshCw, 
  Loader2, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileDown,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface SimulationResultMeta {
  executedAt?: string;
  processingTime?: number;  // ms
  dataPointsAnalyzed?: number;
  confidenceScore?: number;  // 0-100
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}

interface SimulationResultCardProps {
  // 기본 정보
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;  // tailwind color class (e.g., 'blue', 'green')
  
  // 상태
  isLoading: boolean;
  hasResult: boolean;
  meta?: SimulationResultMeta;
  
  // 액션
  onRefresh: () => void;
  onExport?: (format: 'csv' | 'pdf' | 'json') => void;
  onExpand?: () => void;
  onSave?: () => void;
  
  // 결과 컨텐츠 (children)
  children?: React.ReactNode;
  
  // 빈 상태 메시지
  emptyMessage?: string;
  emptySubMessage?: string;
  
  // 옵션
  collapsible?: boolean;
  defaultExpanded?: boolean;
  fullWidth?: boolean;
  minHeight?: string;
}

/**
 * SimulationResultCard
 * 
 * 시뮬레이션 결과를 표시하는 통합 카드 컴포넌트
 * - 로딩, 성공, 에러, 빈 상태 처리
 * - 내보내기 (CSV, PDF, JSON)
 * - 확장/축소
 */
export function SimulationResultCard({
  type,
  title,
  description,
  icon: Icon,
  color,
  isLoading,
  hasResult,
  meta,
  onRefresh,
  onExport,
  onExpand,
  onSave,
  children,
  emptyMessage = '분석을 시작하려면 새로고침 버튼을 클릭하세요',
  emptySubMessage,
  collapsible = false,
  defaultExpanded = true,
  fullWidth = false,
  minHeight = '200px',
}: SimulationResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // 색상 클래스 생성
  const colorClasses = {
    icon: `text-${color}-500`,
    bg: `bg-${color}-500/10`,
    gradient: `from-${color}-500/20`,
    border: `border-${color}-500/20`,
  };

  // 상태 배지 렌더링
  const renderStatusBadge = () => {
    if (!meta) return null;
    
    switch (meta.status) {
      case 'loading':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            분석 중
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            완료
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            오류
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            대기
          </Badge>
        );
    }
  };

  // 메타 정보 렌더링
  const renderMetaInfo = () => {
    if (!meta || !hasResult) return null;
    
    return (
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {meta.executedAt && (
          <span>실행: {new Date(meta.executedAt).toLocaleTimeString('ko-KR')}</span>
        )}
        {meta.processingTime && (
          <span>· {(meta.processingTime / 1000).toFixed(1)}초</span>
        )}
        {meta.dataPointsAnalyzed && (
          <span>· {meta.dataPointsAnalyzed.toLocaleString()}건 분석</span>
        )}
        {meta.confidenceScore && (
          <span>· 신뢰도 {meta.confidenceScore}%</span>
        )}
      </div>
    );
  };

  // 컨텐츠 렌더링
  const renderContent = () => {
    // 로딩 상태
    if (isLoading) {
      return (
        <div 
          className="flex flex-col items-center justify-center py-12 text-muted-foreground"
          style={{ minHeight }}
        >
          <Loader2 className={cn("h-10 w-10 animate-spin mb-4", colorClasses.icon)} />
          <p className="text-sm font-medium">AI가 분석 중입니다...</p>
          <p className="text-xs">잠시만 기다려주세요</p>
        </div>
      );
    }

    // 에러 상태
    if (meta?.status === 'error') {
      return (
        <div 
          className="flex flex-col items-center justify-center py-12 text-muted-foreground"
          style={{ minHeight }}
        >
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-sm font-medium text-destructive">분석 중 오류가 발생했습니다</p>
          {meta.errorMessage && (
            <p className="text-xs mt-1">{meta.errorMessage}</p>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            다시 시도
          </Button>
        </div>
      );
    }

    // 결과가 있는 경우
    if (hasResult && children) {
      return children;
    }

    // 빈 상태
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
        style={{ minHeight }}
      >
        <Icon className={cn("h-10 w-10 mb-4 opacity-30", colorClasses.icon)} />
        <p className="text-sm">{emptyMessage}</p>
        {emptySubMessage && (
          <p className="text-xs mt-1">{emptySubMessage}</p>
        )}
      </div>
    );
  };

  const cardContent = (
    <Card className={cn("relative overflow-hidden", fullWidth && "col-span-full")}>
      {/* 배경 그라데이션 */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br to-transparent rounded-bl-full",
        colorClasses.gradient
      )} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", colorClasses.bg)}>
              <Icon className={cn("h-5 w-5", colorClasses.icon)} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {title}
                {renderStatusBadge()}
              </CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* 내보내기 버튼 */}
            {onExport && hasResult && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onExport('csv')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV로 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF로 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('json')}>
                    <FileText className="h-4 w-4 mr-2" />
                    JSON으로 내보내기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* 확장 버튼 */}
            {onExpand && hasResult && (
              <Button variant="ghost" size="sm" onClick={onExpand}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            
            {/* 새로고침 버튼 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            
            {/* 접기/펼치기 버튼 (collapsible인 경우) */}
            {collapsible && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* 메타 정보 */}
        {renderMetaInfo()}
      </CardHeader>
      
      <CardContent className="pt-0">
        {collapsible ? (
          <Collapsible open={isExpanded}>
            <CollapsibleContent>
              {renderContent()}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          renderContent()
        )}
      </CardContent>
    </Card>
  );

  return cardContent;
}

/**
 * SimulationResultGrid
 * 
 * 여러 SimulationResultCard를 그리드로 배치
 */
interface SimulationResultGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function SimulationResultGrid({ 
  children, 
  columns = 2 
}: SimulationResultGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns])}>
      {children}
    </div>
  );
}
