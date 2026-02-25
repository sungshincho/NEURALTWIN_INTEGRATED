import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Cloud, 
  Plug, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Settings,
  Link2,
  Unlink,
  FileSpreadsheet,
  Users,
  Package,
  ShoppingCart,
  MapPin,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 데이터 소스 타입 정의
 */
export interface ImportedDataSource {
  id: string;
  name: string;
  table: string;
  recordCount: number;
  lastUpdated: string;
  status: 'connected' | 'pending' | 'error';
  mappedToOntology: boolean;
  ontologyEntityType?: string;
}

export interface PresetApiSource {
  id: string;
  name: string;
  description: string;
  provider: string;
  enabled: boolean;
  lastSync?: string;
  dataPoints?: number;
  adminOnly: boolean;  // NEURALTWIN master 계정만 설정 가능
}

export interface CustomApiSource {
  id: string;
  name: string;
  type: 'pos' | 'crm' | 'erp' | 'other';
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  recordCount?: number;
}

export interface OntologyMappingStatus {
  totalEntities: number;
  mappedEntities: number;
  totalRelations: number;
  unmappedFields: string[];
  healthScore: number;  // 0-100
}

interface DataSourceMappingCardProps {
  importedData: ImportedDataSource[];
  presetApis: PresetApiSource[];
  customApis: CustomApiSource[];
  mappingStatus: OntologyMappingStatus;
  isAdmin?: boolean;  // NEURALTWIN master 계정 여부
  onRefresh: () => void;
  onConnectApi?: (apiId: string) => void;
  onDisconnectApi?: (apiId: string) => void;
  onConfigureApi?: (apiId: string) => void;
  isLoading?: boolean;
}

/**
 * DataSourceMappingCard
 * 
 * 데이터 소스와 온톨로지 스키마 매핑 상태를 표시하는 컴포넌트
 * - 임포트된 데이터 (CSV/Excel)
 * - 프리셋 API (날씨, 경제지표 등) - 관리자만 설정 가능
 * - 고객 연동 API (POS, CRM, ERP)
 */
export function DataSourceMappingCard({
  importedData,
  presetApis,
  customApis,
  mappingStatus,
  isAdmin = false,
  onRefresh,
  onConnectApi,
  onDisconnectApi,
  onConfigureApi,
  isLoading = false,
}: DataSourceMappingCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('imported');

  // 상태별 아이콘 및 색상
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      connected: 'default',
      pending: 'secondary',
      error: 'destructive',
      disconnected: 'outline',
    };
    const labels: Record<string, string> = {
      connected: '연결됨',
      pending: '대기중',
      error: '오류',
      disconnected: '미연결',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {labels[status] || status}
      </Badge>
    );
  };

  // 데이터 타입별 아이콘
  const getDataTypeIcon = (table: string) => {
    const icons: Record<string, React.ReactNode> = {
      products: <Package className="h-4 w-4" />,
      customers: <Users className="h-4 w-4" />,
      purchases: <ShoppingCart className="h-4 w-4" />,
      stores: <MapPin className="h-4 w-4" />,
    };
    return icons[table] || <FileSpreadsheet className="h-4 w-4" />;
  };

  // API 타입별 아이콘
  const getApiTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      pos: <ShoppingCart className="h-4 w-4" />,
      crm: <Users className="h-4 w-4" />,
      erp: <Database className="h-4 w-4" />,
    };
    return icons[type] || <Plug className="h-4 w-4" />;
  };

  // 연결된 소스 수 계산
  const connectedImported = importedData.filter(d => d.status === 'connected').length;
  const enabledPresetApis = presetApis.filter(a => a.enabled).length;
  const connectedCustomApis = customApis.filter(a => a.status === 'connected').length;
  const totalConnected = connectedImported + enabledPresetApis + connectedCustomApis;
  const totalSources = importedData.length + presetApis.length + customApis.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
        
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Database className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    데이터 소스 & 온톨로지 매핑
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </CardTitle>
                  <CardDescription>
                    {totalConnected}/{totalSources} 소스 연결됨 · 매핑 건강도 {mappingStatus.healthScore}%
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          {/* 요약 배지 */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="gap-1">
              <FileSpreadsheet className="h-3 w-3" />
              임포트 {connectedImported}/{importedData.length}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Cloud className="h-3 w-3" />
              프리셋 API {enabledPresetApis}/{presetApis.length}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Plug className="h-3 w-3" />
              고객 API {connectedCustomApis}/{customApis.length}
            </Badge>
            <Badge 
              variant={mappingStatus.unmappedFields.length > 0 ? "outline" : "default"}
              className="gap-1"
            >
              {mappingStatus.unmappedFields.length > 0 ? (
                <>
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  미매핑 {mappingStatus.unmappedFields.length}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  매핑 완료
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* 매핑 건강도 프로그레스 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">온톨로지 매핑 건강도</span>
                <span className="font-medium">{mappingStatus.healthScore}%</span>
              </div>
              <Progress 
                value={mappingStatus.healthScore} 
                className={cn(
                  "h-2",
                  mappingStatus.healthScore >= 80 && "[&>div]:bg-green-500",
                  mappingStatus.healthScore >= 50 && mappingStatus.healthScore < 80 && "[&>div]:bg-yellow-500",
                  mappingStatus.healthScore < 50 && "[&>div]:bg-red-500"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>엔티티 {mappingStatus.mappedEntities}/{mappingStatus.totalEntities}</span>
                <span>관계 {mappingStatus.totalRelations}개</span>
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="imported" className="text-xs">
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  임포트 데이터
                </TabsTrigger>
                <TabsTrigger value="preset" className="text-xs">
                  <Cloud className="h-3 w-3 mr-1" />
                  프리셋 API
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs">
                  <Plug className="h-3 w-3 mr-1" />
                  고객 API
                </TabsTrigger>
              </TabsList>

              {/* 임포트된 데이터 */}
              <TabsContent value="imported" className="mt-3 space-y-2">
                {importedData.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">임포트된 데이터가 없습니다</p>
                    <p className="text-xs">데이터 관리 → 통합 데이터 임포트에서 추가하세요</p>
                  </div>
                ) : (
                  importedData.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-muted">
                          {getDataTypeIcon(source.table)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{source.name}</span>
                            {getStatusIcon(source.status)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{source.recordCount.toLocaleString()}건</span>
                            <span>·</span>
                            <span>{source.table}</span>
                            {source.mappedToOntology && source.ontologyEntityType && (
                              <>
                                <span>·</span>
                                <Badge variant="outline" className="text-xs py-0">
                                  → {source.ontologyEntityType}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(source.status)}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* 프리셋 API */}
              <TabsContent value="preset" className="mt-3 space-y-2">
                {!isAdmin && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-3">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ 프리셋 API 설정은 NEURALTWIN 관리자만 가능합니다
                    </p>
                  </div>
                )}
                {presetApis.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">프리셋 API가 없습니다</p>
                  </div>
                ) : (
                  presetApis.map((api) => (
                    <div
                      key={api.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border bg-card transition-colors",
                        api.enabled ? "hover:bg-accent/50" : "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded",
                          api.enabled ? "bg-blue-500/10" : "bg-muted"
                        )}>
                          <Cloud className={cn(
                            "h-4 w-4",
                            api.enabled ? "text-blue-500" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{api.name}</span>
                            {api.enabled && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {api.description} · {api.provider}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {api.enabled && api.dataPoints && (
                          <span className="text-xs text-muted-foreground">
                            {api.dataPoints.toLocaleString()} 포인트
                          </span>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onConfigureApi?.(api.id)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                        <Badge variant={api.enabled ? "default" : "outline"}>
                          {api.enabled ? "활성" : "비활성"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* 고객 연동 API */}
              <TabsContent value="custom" className="mt-3 space-y-2">
                {customApis.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Plug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">연동된 API가 없습니다</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Link2 className="h-4 w-4 mr-1" />
                      API 연동하기
                    </Button>
                  </div>
                ) : (
                  customApis.map((api) => (
                    <div
                      key={api.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded",
                          api.status === 'connected' ? "bg-green-500/10" : "bg-muted"
                        )}>
                          {getApiTypeIcon(api.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{api.name}</span>
                            {getStatusIcon(api.status)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="uppercase">{api.type}</span>
                            {api.recordCount && (
                              <> · {api.recordCount.toLocaleString()}건</>
                            )}
                            {api.lastSync && (
                              <> · 최근 동기화: {api.lastSync}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {api.status === 'connected' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDisconnectApi?.(api.id)}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onConnectApi?.(api.id)}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                        {getStatusBadge(api.status)}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* 미매핑 필드 경고 */}
            {mappingStatus.unmappedFields.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      미매핑 필드 {mappingStatus.unmappedFields.length}개
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mappingStatus.unmappedFields.slice(0, 3).join(', ')}
                      {mappingStatus.unmappedFields.length > 3 && ` 외 ${mappingStatus.unmappedFields.length - 3}개`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
