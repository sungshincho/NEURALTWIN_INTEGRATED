import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface OntologyContext {
  schema: {
    stats: {
      totalEntityTypes: number;
      totalRelationTypes: number;
      criticalEntities: number;
      criticalRelations: number;
    };
  };
  entities: {
    total: number;
    byType: Record<string, number>;
  };
  relations: {
    total: number;
    byType: Record<string, number>;
  };
  patterns: {
    frequentPairs: Array<{ items: string[]; count: number }>;
    hubs: Array<{ entity: string; connections: number; type: string }>;
    isolated: Array<{ entity: string; type: string }>;
    relationChains: Array<{ chain: string[]; count: number }>;
  };
  stats: {
    avgDegree: number;
    density: number;
    schemaCoverage: number;
  };
}

interface OntologyBasedInsights {
  hubProductsImpact?: string;
  coOccurrenceOpportunities?: string[];
  isolatedProductsRisk?: string[];
  hubProductsStrategy?: string;
  bundleInventory?: string;
  slowMoversAlert?: string;
  anchorPricing?: string;
  bundlePricing?: string;
  promotionalPricing?: string;
  crossSellOpportunities?: string[];
  upSellPaths?: string[];
  churnRiskCustomers?: string;
  reEngagementTargets?: string;
  [key: string]: any;
}

interface OntologyInsightChartProps {
  ontologyContext?: OntologyContext | null;
  insights?: OntologyBasedInsights | null;
  simulationType?: string;
  compact?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * OntologyInsightChart
 * 
 * 온톨로지 컨텍스트와 인사이트를 시각화하는 컴포넌트
 */
export function OntologyInsightChart({
  ontologyContext,
  insights,
  simulationType,
  compact = false,
}: OntologyInsightChartProps) {
  // 엔티티 타입 분포 데이터
  const entityDistributionData = useMemo(() => {
    if (!ontologyContext?.entities.byType) return [];
    
    return Object.entries(ontologyContext.entities.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [ontologyContext?.entities.byType]);

  // 관계 타입 분포 데이터
  const relationDistributionData = useMemo(() => {
    if (!ontologyContext?.relations.byType) return [];
    
    return Object.entries(ontologyContext.relations.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name: formatRelationName(name), value }));
  }, [ontologyContext?.relations.byType]);

  // 허브 엔티티 데이터
  const hubData = useMemo(() => {
    if (!ontologyContext?.patterns.hubs) return [];
    
    return ontologyContext.patterns.hubs.slice(0, 10).map(hub => ({
      name: truncateText(hub.entity, 15),
      connections: hub.connections,
      type: hub.type,
    }));
  }, [ontologyContext?.patterns.hubs]);

  // 동시 발생 패턴 데이터
  const coOccurrenceData = useMemo(() => {
    if (!ontologyContext?.patterns.frequentPairs) return [];
    
    return ontologyContext.patterns.frequentPairs.slice(0, 8).map(pair => ({
      name: pair.items.map(i => truncateText(i, 8)).join(' + '),
      count: pair.count,
    }));
  }, [ontologyContext?.patterns.frequentPairs]);

  // 스키마 커버리지 데이터 (레이더 차트용)
  const coverageData = useMemo(() => {
    if (!ontologyContext) return [];
    
    const usedEntityTypes = Object.keys(ontologyContext.entities.byType).length;
    const usedRelationTypes = Object.keys(ontologyContext.relations.byType).length;
    
    return [
      {
        metric: '엔티티 타입',
        usage: Math.round((usedEntityTypes / ontologyContext.schema.stats.totalEntityTypes) * 100),
        fullMark: 100,
      },
      {
        metric: '관계 타입',
        usage: Math.round((usedRelationTypes / ontologyContext.schema.stats.totalRelationTypes) * 100),
        fullMark: 100,
      },
      {
        metric: '그래프 밀도',
        usage: Math.min(Math.round(ontologyContext.stats.density * 10000), 100),
        fullMark: 100,
      },
      {
        metric: '평균 연결',
        usage: Math.min(Math.round(ontologyContext.stats.avgDegree * 10), 100),
        fullMark: 100,
      },
      {
        metric: '스키마 커버리지',
        usage: Math.round(ontologyContext.stats.schemaCoverage),
        fullMark: 100,
      },
    ];
  }, [ontologyContext]);

  if (!ontologyContext && !insights) {
    return null;
  }

  // 컴팩트 모드
  if (compact) {
    return (
      <div className="p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
        <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
          <Network className="h-3 w-3" />
          지식 그래프 인사이트
        </div>
        
        {insights && (
          <ul className="text-xs text-muted-foreground space-y-1">
            {Object.entries(insights).slice(0, 3).map(([key, value]) => (
              <li key={key} className="flex items-start gap-1">
                <span className="text-primary">•</span>
                <span>{Array.isArray(value) ? value.slice(0, 2).join(', ') : String(value).slice(0, 80)}</span>
              </li>
            ))}
          </ul>
        )}

        {ontologyContext && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{ontologyContext.entities.total} 엔티티</span>
            <span>{ontologyContext.relations.total} 관계</span>
            <span>{ontologyContext.stats.schemaCoverage.toFixed(0)}% 커버리지</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">온톨로지 기반 분석</h3>
        </div>
        {ontologyContext && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {ontologyContext.schema.stats.totalEntityTypes}개 엔티티 타입
            </Badge>
            <Badge variant="outline">
              {ontologyContext.schema.stats.totalRelationTypes}개 관계 타입
            </Badge>
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      {ontologyContext && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="총 엔티티"
            value={ontologyContext.entities.total}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <StatCard
            label="총 관계"
            value={ontologyContext.relations.total}
            icon={<Network className="h-4 w-4" />}
          />
          <StatCard
            label="허브 노드"
            value={ontologyContext.patterns.hubs.length}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            label="스키마 커버리지"
            value={`${ontologyContext.stats.schemaCoverage.toFixed(0)}%`}
            icon={<Lightbulb className="h-4 w-4" />}
          />
        </div>
      )}

      {/* 차트 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 엔티티 타입 분포 */}
        {entityDistributionData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">엔티티 타입 분포</CardTitle>
              <CardDescription className="text-xs">
                상위 {entityDistributionData.length}개 엔티티 타입
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={entityDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {entityDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 허브 엔티티 */}
        {hubData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">허브 엔티티 (연결 수)</CardTitle>
              <CardDescription className="text-xs">
                가장 많은 관계를 가진 엔티티
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hubData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value}개 연결`,
                      props.payload.type
                    ]}
                  />
                  <Bar dataKey="connections" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 동시 발생 패턴 */}
        {coOccurrenceData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">동시 발생 패턴</CardTitle>
              <CardDescription className="text-xs">
                함께 나타나는 엔티티 쌍
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={coOccurrenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 스키마 커버리지 레이더 */}
        {coverageData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">스키마 활용도</CardTitle>
              <CardDescription className="text-xs">
                온톨로지 스키마 사용 현황
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={coverageData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="활용도"
                    dataKey="usage"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.5}
                  />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 인사이트 카드 */}
      {insights && Object.keys(insights).length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              AI 기반 온톨로지 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(insights).map(([key, value]) => (
                <InsightItem key={key} label={formatInsightKey(key)} value={value} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 고립 노드 경고 */}
      {ontologyContext && ontologyContext.patterns.isolated.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              고립 엔티티 ({ontologyContext.patterns.isolated.length}개)
            </CardTitle>
            <CardDescription className="text-xs">
              관계가 없는 엔티티들 - 데이터 연결이 필요할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ontologyContext.patterns.isolated.slice(0, 10).map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {item.entity} ({item.type})
                </Badge>
              ))}
              {ontologyContext.patterns.isolated.length > 10 && (
                <Badge variant="secondary" className="text-xs">
                  +{ontologyContext.patterns.isolated.length - 10}개 더
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

// 인사이트 항목 컴포넌트
function InsightItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-2 bg-background/50 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm">
        {Array.isArray(value) ? value.join(', ') : String(value)}
      </p>
    </div>
  );
}

// 헬퍼 함수
function formatRelationName(name: string): string {
  return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatInsightKey(key: string): string {
  const labels: Record<string, string> = {
    hubProductsImpact: '허브 상품 영향',
    coOccurrenceOpportunities: '교차 판매 기회',
    isolatedProductsRisk: '고립 상품 위험',
    hubProductsStrategy: '허브 상품 전략',
    bundleInventory: '번들 재고',
    slowMoversAlert: '저회전 상품',
    anchorPricing: '앵커 가격 전략',
    bundlePricing: '번들 가격 전략',
    promotionalPricing: '프로모션 가격',
    crossSellOpportunities: '교차 판매',
    upSellPaths: '업셀 경로',
    churnRiskCustomers: '이탈 위험 고객',
    reEngagementTargets: '재참여 대상',
  };
  return labels[key] || key.replace(/([A-Z])/g, ' $1').trim();
}

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

export default OntologyInsightChart;
