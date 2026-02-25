// ============================================================================
// DataQualityBanner.tsx
// 인사이트허브 상단에 표시되는 데이터 품질 배너
// ============================================================================

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDataQualityScore } from '@/features/data-control/hooks/useDataControlTower';

interface DataQualityBannerProps {
  className?: string;
}

export function DataQualityBanner({ className }: DataQualityBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: quality, isLoading, error } = useDataQualityScore();

  // Don't show if loading, error, or dismissed
  if (isLoading || error || isDismissed || !quality) {
    return null;
  }

  const { overall_score, confidence_level, warnings } = quality;

  // Don't show if score is high and no warnings
  if (overall_score >= 80 && warnings.length === 0) {
    return null;
  }

  // Determine variant based on score
  const getVariant = (): 'default' | 'destructive' => {
    if (overall_score < 50) return 'destructive';
    return 'default';
  };

  // Get icon based on confidence
  const getIcon = () => {
    switch (confidence_level) {
      case 'high':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Get background color based on score
  const getBgClass = () => {
    if (overall_score < 50) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (overall_score < 80) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  return (
    <div className={`relative rounded-lg border p-4 ${getBgClass()} ${className}`}>
      {/* Dismiss button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="닫기"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>

      <div className="flex items-start gap-3">
        {getIcon()}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              데이터 품질 점수: {overall_score}%
            </h4>
            <Badge
              variant="outline"
              className={`text-xs ${
                confidence_level === 'high'
                  ? 'border-green-500 text-green-700'
                  : confidence_level === 'medium'
                  ? 'border-yellow-500 text-yellow-700'
                  : 'border-red-500 text-red-700'
              }`}
            >
              신뢰도 {confidence_level === 'high' ? '높음' : confidence_level === 'medium' ? '보통' : '낮음'}
            </Badge>
          </div>

          {warnings.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {warnings[0].message}
              {warnings.length > 1 && (
                <span className="text-gray-500"> 외 {warnings.length - 1}건</span>
              )}
            </p>
          )}

          {overall_score < 80 && warnings.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              일부 데이터 소스가 연결되지 않았습니다. 분석 정확도가 제한될 수 있습니다.
            </p>
          )}
        </div>

        <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
          <Link to="/data/control-tower">
            데이터 관리 <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
