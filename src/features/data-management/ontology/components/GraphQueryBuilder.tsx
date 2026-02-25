import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Network, GitBranch, TrendingUp, Users, Code } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface GraphQueryBuilderProps {
  onResultsChange: (results: any) => void;
}

export const GraphQueryBuilder = ({ onResultsChange }: GraphQueryBuilderProps) => {
  const [queryType, setQueryType] = useState<'n_hop' | 'shortest_path' | 'pagerank' | 'community_detection' | 'cypher_like'>('n_hop');
  const [startEntityId, setStartEntityId] = useState('');
  const [endEntityId, setEndEntityId] = useState('');
  const [maxHops, setMaxHops] = useState(3);
  const [cypherQuery, setCypherQuery] = useState('MATCH (a)-[r]->(b) RETURN a, r, b LIMIT 100');
  const [algorithmParams, setAlgorithmParams] = useState({ damping: 0.85, iterations: 20 });

  // Fetch entities for selection
  const { data: entities } = useQuery({
    queryKey: ['graph-entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('graph_entities')
        .select('id, label, entity_type_id, properties');
      if (error) throw error;
      return data;
    },
  });

  // Helper to generate display label
  const getEntityDisplayLabel = (entity: any) => {
    if (entity.label && entity.label.trim() !== '') {
      return entity.label;
    }
    
    // Fallback: try to extract meaningful info from properties
    const props = entity.properties || {};
    const displayKeys = ['name', 'product_name', 'brand_name', 'store_name', 'customer_name', 'label'];
    
    for (const key of displayKeys) {
      if (props[key] && String(props[key]).trim() !== '') {
        return `${String(props[key]).substring(0, 50)} (${entity.id.substring(0, 8)})`;
      }
    }
    
    // Last resort: show ID
    return `Entity ${entity.id.substring(0, 8)}...`;
  };

  // Execute query mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const queryData: any = {
        query_type: queryType,
        start_entity_id: startEntityId || undefined,
        end_entity_id: endEntityId || undefined,
        max_hops: maxHops,
        cypher_query: cypherQuery,
        algorithm_params: algorithmParams,
      };

      const response = await supabase.functions.invoke('graph-query', {
        body: queryData,
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('쿼리가 성공적으로 실행되었습니다');
      onResultsChange(data);
    },
    onError: (error: any) => {
      toast.error(`쿼리 실행 실패: ${error.message}`);
    },
  });

  const handleExecute = () => {
    executeMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          그래프 쿼리 빌더
        </CardTitle>
        <CardDescription>
          Neo4j/Neptune 스타일의 고급 그래프 쿼리를 실행하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={queryType} onValueChange={(v: any) => setQueryType(v)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="n_hop" className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              N-Hop
            </TabsTrigger>
            <TabsTrigger value="shortest_path" className="flex items-center gap-1">
              <Network className="h-4 w-4" />
              최단경로
            </TabsTrigger>
            <TabsTrigger value="pagerank" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              PageRank
            </TabsTrigger>
            <TabsTrigger value="community_detection" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              커뮤니티
            </TabsTrigger>
            <TabsTrigger value="cypher_like" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              Cypher
            </TabsTrigger>
          </TabsList>

          <TabsContent value="n_hop" className="space-y-4">
            <div className="space-y-2">
              <Label>시작 엔티티</Label>
              <Select value={startEntityId} onValueChange={setStartEntityId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="엔티티 선택" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-[300px] overflow-y-auto">
                  {entities && entities.length > 0 ? (
                    entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {getEntityDisplayLabel(entity)}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      엔티티가 없습니다. 데이터를 먼저 임포트하세요.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>최대 홉 수</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={maxHops}
                onChange={(e) => setMaxHops(parseInt(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                1-10 사이의 값으로 설정 (높을수록 더 넓은 범위 탐색)
              </p>
            </div>

            <Button onClick={handleExecute} className="w-full" disabled={!startEntityId || executeMutation.isPending}>
              {executeMutation.isPending ? '실행 중...' : 'N-Hop 쿼리 실행'}
            </Button>
          </TabsContent>

          <TabsContent value="shortest_path" className="space-y-4">
            <div className="space-y-2">
              <Label>시작 엔티티</Label>
              <Select value={startEntityId} onValueChange={setStartEntityId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="엔티티 선택" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {entities && entities.length > 0 ? (
                    entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      엔티티가 없습니다. 데이터를 먼저 임포트하세요.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>도착 엔티티</Label>
              <Select value={endEntityId} onValueChange={setEndEntityId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="엔티티 선택" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-[300px] overflow-y-auto">
                  {entities && entities.length > 0 ? (
                    entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {getEntityDisplayLabel(entity)}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      엔티티가 없습니다. 데이터를 먼저 임포트하세요.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExecute} className="w-full" disabled={!startEntityId || !endEntityId || executeMutation.isPending}>
              {executeMutation.isPending ? '실행 중...' : '최단경로 찾기'}
            </Button>
          </TabsContent>

          <TabsContent value="pagerank" className="space-y-4">
            <div className="space-y-2">
              <Label>Damping Factor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={algorithmParams.damping}
                onChange={(e) => setAlgorithmParams({ ...algorithmParams, damping: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                일반적으로 0.85 사용 (0-1 사이)
              </p>
            </div>

            <div className="space-y-2">
              <Label>반복 횟수</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={algorithmParams.iterations}
                onChange={(e) => setAlgorithmParams({ ...algorithmParams, iterations: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                더 많은 반복 = 더 정확한 결과 (일반적으로 20-30)
              </p>
            </div>

            <Button onClick={handleExecute} className="w-full" disabled={executeMutation.isPending}>
              {executeMutation.isPending ? '계산 중...' : 'PageRank 계산'}
            </Button>
          </TabsContent>

          <TabsContent value="community_detection" className="space-y-4">
            <div className="space-y-2">
              <Label>반복 횟수</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={algorithmParams.iterations}
                onChange={(e) => setAlgorithmParams({ ...algorithmParams, iterations: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Label Propagation 알고리즘 반복 횟수 (일반적으로 10-20)
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">커뮤니티 탐지란?</h4>
              <p className="text-sm text-muted-foreground">
                그래프에서 밀접하게 연결된 노드 그룹을 자동으로 찾아냅니다.
                소셜 네트워크 분석, 고객 세그먼테이션 등에 활용됩니다.
              </p>
            </div>

            <Button onClick={handleExecute} className="w-full" disabled={executeMutation.isPending}>
              {executeMutation.isPending ? '분석 중...' : '커뮤니티 탐지 실행'}
            </Button>
          </TabsContent>

          <TabsContent value="cypher_like" className="space-y-4">
            <div className="space-y-2">
              <Label>Cypher 쿼리</Label>
              <Textarea
                value={cypherQuery}
                onChange={(e) => setCypherQuery(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="MATCH (a:Person)-[r:KNOWS]->(b:Person) WHERE a.age > 25 RETURN a, r, b"
              />
              <p className="text-sm text-muted-foreground">
                Neo4j Cypher와 유사한 문법으로 쿼리 작성
              </p>
            </div>

            <div className="space-y-2">
              <Label>쿼리 예시</Label>
              <div className="space-y-1">
                <Badge variant="outline" className="cursor-pointer" onClick={() => setCypherQuery('MATCH (a)-[r]->(b) RETURN a, r, b LIMIT 100')}>
                  기본 관계 탐색
                </Badge>
                <Badge variant="outline" className="cursor-pointer ml-2" onClick={() => setCypherQuery('MATCH (a:Customer)-[r:PURCHASED]->(b:Product) RETURN a, r, b')}>
                  고객-제품 구매 관계
                </Badge>
                <Badge variant="outline" className="cursor-pointer ml-2" onClick={() => setCypherQuery('MATCH (a:Store)-[r:CONTAINS]->(b:Zone) RETURN a, r, b')}>
                  매장-구역 관계
                </Badge>
              </div>
            </div>

            <Button onClick={handleExecute} className="w-full" disabled={executeMutation.isPending}>
              {executeMutation.isPending ? '실행 중...' : 'Cypher 쿼리 실행'}
            </Button>
          </TabsContent>
        </Tabs>

        {executeMutation.isSuccess && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">쿼리 결과</p>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(executeMutation.data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
