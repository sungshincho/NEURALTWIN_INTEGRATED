// ============================================================================
// LineageExplorerPage.tsx
// KPI Lineage 탐색기 - 데이터 출처 추적
// ============================================================================

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GitBranch,
  Search,
  Database,
  Layers,
  BarChart3,
  ArrowDown,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useKPILineage } from './hooks/useDataControlTower';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

const kpiTables = [
  { value: 'daily_kpis_agg', label: '일별 KPI 집계' },
  { value: 'zone_daily_metrics', label: '존별 일간 메트릭' },
];

export default function LineageExplorerPage() {
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const [selectedTable, setSelectedTable] = useState('daily_kpis_agg');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const {
    data: lineage,
    isLoading,
    error,
  } = useKPILineage(selectedTable, undefined, selectedDate);

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{
                background:
                  'linear-gradient(145deg, #2f2f38 0%, #1c1c22 35%, #282830 65%, #1e1e26 100%)',
                boxShadow:
                  '0 2px 4px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <GitBranch
                className="h-5 w-5"
                style={{
                  color: '#ffffff',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                }}
              />
            </div>

            <div>
              <h1
                className="text-2xl"
                style={{
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  ...(isDark
                    ? {
                        color: '#ffffff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      }
                    : {
                        background:
                          'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
                      }),
                }}
              >
                Lineage 탐색기
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.6)' : '#515158',
                  textShadow: isDark ? 'none' : '0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                KPI 데이터 출처 추적 - L3 → L2 → L1
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link to="/data/control-tower">
              <ExternalLink className="w-4 h-4 mr-2" />
              컨트롤타워로
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  KPI 테이블
                </label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="테이블 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {kpiTables.map((table) => (
                      <SelectItem key={table.value} value={table.value}>
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  날짜
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  조회
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center text-red-600">
              <p>Lineage 조회 중 오류가 발생했습니다.</p>
              <p className="text-sm mt-1">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Lineage Result */}
        {lineage && lineage.success && (
          <div className="space-y-6">
            {/* Lineage Path Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  데이터 Lineage 경로
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  {lineage.lineage.lineage_path.map((layer, index) => (
                    <div key={layer.layer} className="w-full max-w-md">
                      {/* Layer Card */}
                      <div
                        className={`p-4 rounded-xl border-2 ${
                          layer.layer === 'L3'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : layer.layer === 'L2'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant="outline"
                            className={`${
                              layer.layer === 'L3'
                                ? 'border-green-500 text-green-700'
                                : layer.layer === 'L2'
                                ? 'border-purple-500 text-purple-700'
                                : 'border-blue-500 text-blue-700'
                            }`}
                          >
                            {layer.layer}
                          </Badge>
                          {layer.layer === 'L3' && (
                            <BarChart3 className="w-5 h-5 text-green-600" />
                          )}
                          {layer.layer === 'L2' && (
                            <Layers className="w-5 h-5 text-purple-600" />
                          )}
                          {layer.layer === 'L1' && (
                            <Database className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {layer.description}
                        </p>
                        {layer.table && (
                          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mt-2 inline-block">
                            {layer.table}
                          </code>
                        )}
                        {layer.tables && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(layer.tables as string[]).map((t) => (
                              <code
                                key={t}
                                className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                              >
                                {t}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      {index < lineage.lineage.lineage_path.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ArrowDown className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* KPI Record Details */}
            {lineage.kpi_record && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    KPI 레코드 상세
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(lineage.kpi_record)
                      .filter(([key]) => !['id', 'source_trace'].includes(key))
                      .slice(0, 8)
                      .map(([key, value]) => (
                        <div key={key} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {typeof value === 'number'
                              ? value.toLocaleString()
                              : String(value)}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ETL Run Info */}
            {lineage.lineage.etl_run && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    ETL 실행 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">함수</p>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {lineage.lineage.etl_run.etl_function}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">상태</p>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {lineage.lineage.etl_run.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">입력/출력</p>
                      <p className="text-sm font-medium">
                        {lineage.lineage.etl_run.input_record_count?.toLocaleString()} →{' '}
                        {lineage.lineage.etl_run.output_record_count?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">소요 시간</p>
                      <p className="text-sm font-medium">
                        {lineage.lineage.etl_run.duration_ms
                          ? `${lineage.lineage.etl_run.duration_ms}ms`
                          : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Imports */}
            {lineage.lineage.raw_imports && lineage.lineage.raw_imports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    원본 데이터 (Raw Imports)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lineage.lineage.raw_imports.map((raw: any) => (
                      <div
                        key={raw.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {raw.source_name || raw.source_type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {raw.data_type} · {raw.row_count?.toLocaleString()} rows
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={raw.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {raw.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* No Data State */}
        {lineage && !lineage.success && (
          <Card>
            <CardContent className="p-12 text-center">
              <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lineage 정보 없음
              </h3>
              <p className="text-gray-500">
                선택한 날짜에 해당하는 KPI 레코드를 찾을 수 없습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
