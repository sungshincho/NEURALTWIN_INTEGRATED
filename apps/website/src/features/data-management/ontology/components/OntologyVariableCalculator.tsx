import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Database, Network, TrendingUp } from "lucide-react";

interface OntologyStats {
  entityTypeCount: number;
  relationTypeCount: number;
  avgEntityProperties: number;
  avgRelationProperties: number;
  totalEntityInstances?: number;
  totalRelationInstances?: number;
}

interface Props {
  stats: OntologyStats;
}

export function OntologyVariableCalculator({ stats }: Props) {
  // 1. 타입 레벨 변수 계산
  const typeVariables = 
    stats.entityTypeCount + 
    stats.relationTypeCount + 
    (stats.entityTypeCount * stats.avgEntityProperties) + 
    (stats.relationTypeCount * stats.avgRelationProperties);

  // 2. 인스턴스 레벨 변수 계산 (예상치)
  const estimatedInstances = {
    small: 1000, // 소규모 매장
    medium: 10000, // 중규모 매장
    large: 100000, // 대규모 매장 체인
  };

  const calculateInstanceVariables = (instanceCount: number) => {
    const entityVars = instanceCount * stats.avgEntityProperties;
    const relationVars = instanceCount * 2 * stats.avgRelationProperties; // 관계는 엔티티의 2배로 추정
    return entityVars + relationVars;
  };

  // 3. 그래프 경로 조합 (N-hop)
  const calculatePathComplexity = (instances: number, hops: number) => {
    return Math.pow(instances, hops) * Math.pow(stats.relationTypeCount, hops - 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>온톨로지 변수 계산</CardTitle>
          </div>
          <CardDescription>
            그래프 기반 온톨로지에서 발생 가능한 변수의 개수
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">엔티티 타입</div>
              <div className="text-2xl font-bold text-primary">{stats.entityTypeCount}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">관계 타입</div>
              <div className="text-2xl font-bold text-primary">{stats.relationTypeCount}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">평균 엔티티 속성</div>
              <div className="text-2xl font-bold text-primary">{stats.avgEntityProperties}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">평균 관계 속성</div>
              <div className="text-2xl font-bold text-primary">{stats.avgRelationProperties}</div>
            </div>
          </div>

          <Tabs defaultValue="type" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="type">타입 레벨</TabsTrigger>
              <TabsTrigger value="instance">인스턴스 레벨</TabsTrigger>
              <TabsTrigger value="graph">그래프 경로</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  스키마 정의 단계에서의 변수 개수 (타입 + 속성)
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">엔티티 타입</span>
                  <Badge variant="outline">{stats.entityTypeCount}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">관계 타입</span>
                  <Badge variant="outline">{stats.relationTypeCount}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">엔티티 속성 합계</span>
                  <Badge variant="outline">{stats.entityTypeCount * stats.avgEntityProperties}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">관계 속성 합계</span>
                  <Badge variant="outline">{stats.relationTypeCount * stats.avgRelationProperties}</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                  <span className="font-semibold">총 타입 레벨 변수</span>
                  <Badge className="text-lg">{typeVariables.toLocaleString()}</Badge>
                </div>
              </div>

              <div className="text-sm text-muted-foreground mt-4">
                <strong>계산식:</strong> E + R + (E × P_E) + (R × P_R) = {stats.entityTypeCount} + {stats.relationTypeCount} + 
                ({stats.entityTypeCount} × {stats.avgEntityProperties}) + ({stats.relationTypeCount} × {stats.avgRelationProperties}) 
                = <strong>{typeVariables}</strong>
              </div>
            </TabsContent>

            <TabsContent value="instance" className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  실제 데이터가 입력될 때 발생하는 변수 개수
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">소규모 매장 (1천 인스턴스)</span>
                    <Badge variant="secondary">
                      {calculateInstanceVariables(estimatedInstances.small).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    예: 제품 500개, 고객 300개, 방문 200건
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">중규모 매장 (1만 인스턴스)</span>
                    <Badge variant="secondary">
                      {calculateInstanceVariables(estimatedInstances.medium).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    예: 제품 2천개, 고객 3천명, 방문 5천건
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">대규모 체인 (10만 인스턴스)</span>
                    <Badge variant="secondary">
                      {calculateInstanceVariables(estimatedInstances.large).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    예: 제품 5만개, 고객 3만명, 방문 2만건
                  </div>
                </div>

                {stats.totalEntityInstances && stats.totalRelationInstances && (
                  <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">현재 데이터베이스</span>
                      <Badge className="text-lg">
                        {calculateInstanceVariables(stats.totalEntityInstances + stats.totalRelationInstances).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      엔티티: {stats.totalEntityInstances.toLocaleString()}, 
                      관계: {stats.totalRelationInstances.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground mt-4">
                <strong>계산식:</strong> (n_e × P_E) + (n_r × P_R)
                <br />
                n_e = 엔티티 인스턴스 수, n_r = 관계 인스턴스 수
              </div>
            </TabsContent>

            <TabsContent value="graph" className="space-y-4">
              <Alert>
                <Network className="h-4 w-4" />
                <AlertDescription>
                  그래프 탐색에서 발생 가능한 경로 조합 수 (지수적 증가)
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="text-sm font-medium mb-2">1,000개 노드 기준 경로 복잡도</div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">1-hop (직접 연결)</span>
                  <Badge variant="outline">{(1000 * stats.relationTypeCount).toLocaleString()}</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">2-hop (친구의 친구)</span>
                  <Badge variant="outline">
                    {calculatePathComplexity(1000, 2).toExponential(2)}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">3-hop (3단계 관계)</span>
                  <Badge variant="outline">
                    {calculatePathComplexity(1000, 3).toExponential(2)}
                  </Badge>
                </div>

                <div className="p-4 bg-destructive/10 rounded-lg border-2 border-destructive/20 mt-4">
                  <div className="font-semibold text-destructive mb-2">조합 폭발 (Combinatorial Explosion)</div>
                  <div className="text-sm text-muted-foreground">
                    N-hop 탐색: O(n^N × R^(N-1))
                    <br />
                    • n = 노드 수, R = 관계 타입 수, N = 탐색 깊이
                    <br />
                    • 실제로는 제약 조건과 인덱싱으로 최적화 필요
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground mt-4">
                <strong>그래프 쿼리 최적화:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>엔티티 타입별 인덱싱</li>
                  <li>관계 방향성 제약</li>
                  <li>Max-hop 제한 (보통 3-5 hop)</li>
                  <li>캐싱 및 Materialized Views</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <Alert className="mt-6">
            <AlertDescription>
              <strong>결론:</strong> 현재 온톨로지는 <strong>{typeVariables}개</strong>의 타입 레벨 변수를 가지며, 
              실제 데이터 규모에 따라 <strong>수천~수백만 개</strong>의 인스턴스 변수가 발생합니다. 
              그래프 경로 조합까지 고려하면 <strong>지수적으로 증가</strong>합니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
