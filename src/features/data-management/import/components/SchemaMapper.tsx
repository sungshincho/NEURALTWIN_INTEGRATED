import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Database, ArrowRight, Play, Check, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSelectedStore } from '@/hooks/useSelectedStore';

/**
 * 이름 기준 중복 제거 - 사용자 타입(user_id != null)이 마스터 타입보다 우선
 */
function deduplicateByName<T extends { name: string; user_id: string | null }>(items: T[]): T[] {
  const byName = new Map<string, T>();
  for (const item of items) {
    const existing = byName.get(item.name);
    // 사용자 타입이 마스터 타입보다 우선
    if (!existing || (item.user_id !== null && existing.user_id === null)) {
      byName.set(item.name, item);
    }
  }
  return Array.from(byName.values());
}

// 문자열 유사도 계산 (Levenshtein distance)
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().replace(/[_-]/g, '');
  const s2 = str2.toLowerCase().replace(/[_-]/g, '');
  
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
};

interface SchemaMappingProps {
  importId: string;
  importData: any;
  onComplete: () => void;
}

export const SchemaMapper = ({ importId, importData, onComplete }: SchemaMappingProps) => {
  const queryClient = useQueryClient();
  const { selectedStore } = useSelectedStore();
  const [entityMappings, setEntityMappings] = useState<any[]>([]);
  const [relationMappings, setRelationMappings] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isAutoMapping, setIsAutoMapping] = useState(false);

  // 온톨로지 스키마 불러오기 (마스터 + 사용자 타입 통합)
  const { data: entityTypes } = useQuery({
    queryKey: ['entity-types'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.user.id}`)
        .order('name');
      if (error) throw error;

      // 사용자 타입이 마스터 타입보다 우선 (이름 기준 중복 제거)
      return deduplicateByName(data || []);
    },
  });

  const { data: relationTypes } = useQuery({
    queryKey: ['relation-types'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ontology_relation_types')
        .select('*')
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.user.id}`)
        .order('name');
      if (error) throw error;

      // 사용자 타입이 마스터 타입보다 우선 (이름 기준 중복 제거)
      return deduplicateByName(data || []);
    },
  });

  useEffect(() => {
    // 임포트 데이터에서 컬럼 추출
    if (importData?.raw_data?.length > 0) {
      const cols = Object.keys(importData.raw_data[0]);
      setColumns(cols);
    }
  }, [importData]);

  // 전체 자동 매핑 (AI 기반)
  const handleFullAutoMapping = async () => {
    if (!entityTypes || entityTypes.length === 0) {
      toast.error('먼저 온톨로지 스키마를 정의하세요');
      return;
    }

    setIsAutoMapping(true);
    try {
      const dataSample = importData.raw_data.slice(0, 5); // 처음 5개 레코드

      const { data, error } = await supabase.functions.invoke('auto-map-etl', {
        body: {
          import_id: importId,
          data_sample: dataSample,
          columns: columns,
        },
      });

      if (error) throw error;

      console.log('🤖 Auto-mapping result:', data);

      // 매핑 결과 적용
      if (data.entity_mappings && data.entity_mappings.length > 0) {
        setEntityMappings(data.entity_mappings);
        toast.success(
          `AI가 ${data.entity_mappings.length}개 엔티티를 자동 매핑했습니다`,
          { description: '결과를 검토하고 필요시 수정하세요' }
        );
      } else {
        toast.warning('자동 매핑 결과가 없습니다', {
          description: '수동으로 매핑을 추가하세요',
        });
      }

      if (data.relation_mappings && data.relation_mappings.length > 0) {
        setRelationMappings(data.relation_mappings);
      }
    } catch (error: any) {
      console.error('Auto-mapping error:', error);
      toast.error(`자동 매핑 실패: ${error.message}`);
    } finally {
      setIsAutoMapping(false);
    }
  };

  // ETL 실행
  const etlMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStore) {
        throw new Error('매장을 선택해주세요');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('unified-etl', {
        body: {
          etl_type: 'schema',
          import_id: importId,
          store_id: selectedStore.id,
          entity_mappings: entityMappings,
          relation_mappings: relationMappings,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`ETL 완료: ${data.entities_created}개 엔티티, ${data.relations_created}개 관계 생성`, {
        description: selectedStore ? `${selectedStore.store_name}에 저장됨` : undefined
      });
      queryClient.invalidateQueries({ queryKey: ['graph-entities'] });
      onComplete();
    },
    onError: (error: any) => {
      toast.error(`ETL 실패: ${error.message}`);
    },
  });

  const addEntityMapping = () => {
    setEntityMappings([
      ...entityMappings,
      {
        entity_type_id: undefined,
        column_mappings: {},
        label_template: '',
      },
    ]);
  };

  const updateEntityMapping = (index: number, field: string, value: any) => {
    const updated = [...entityMappings];
    updated[index] = { ...updated[index], [field]: value };
    setEntityMappings(updated);
  };

  // 스마트 자동 매핑
  const autoMapProperties = (entityIndex: number) => {
    const mapping = entityMappings[entityIndex];
    if (!mapping.entity_type_id) {
      toast.error('먼저 엔티티 타입을 선택하세요');
      return;
    }

    const entityType = selectedEntityType(mapping.entity_type_id);
    if (!entityType?.properties || !Array.isArray(entityType.properties)) {
      toast.error('속성 정보를 찾을 수 없습니다');
      return;
    }

    const newMappings: { [key: string]: string } = {};
    let mappedCount = 0;

    // 각 속성에 대해 가장 유사한 컬럼 찾기
    entityType.properties.forEach((prop: any) => {
      let bestMatch = '';
      let bestScore = 0;

      columns.forEach(col => {
        const score = calculateSimilarity(prop.name, col);
        if (score > bestScore && score > 0.5) { // 50% 이상 유사도
          bestScore = score;
          bestMatch = col;
        }
      });

      if (bestMatch) {
        newMappings[prop.name] = bestMatch;
        mappedCount++;
      }
    });

    // 키 컬럼 자동 추천 (id가 포함된 컬럼 찾기)
    const keyColumn = columns.find(col => 
      col.toLowerCase().includes('id') && 
      col.toLowerCase().includes(entityType.name.toLowerCase())
    ) || columns.find(col => col.toLowerCase().endsWith('id'));

    if (keyColumn && !mapping.label_template) {
      updateEntityMapping(entityIndex, 'label_template', `{${keyColumn}}`);
    }

    // 매핑 적용
    const updated = [...entityMappings];
    updated[entityIndex].column_mappings = {
      ...updated[entityIndex].column_mappings,
      ...newMappings,
    };
    setEntityMappings(updated);

    if (mappedCount > 0) {
      toast.success(`${mappedCount}개 속성이 자동으로 매핑되었습니다`, {
        description: keyColumn ? `키 컬럼: ${keyColumn}` : undefined,
      });
    } else {
      toast.warning('유사한 컬럼을 찾을 수 없습니다', {
        description: '수동으로 매핑해주세요',
      });
    }
  };

  const addPropertyMapping = (entityIndex: number, propName: string, columnName: string) => {
    const updated = [...entityMappings];
    updated[entityIndex].column_mappings = {
      ...updated[entityIndex].column_mappings,
      [propName]: columnName,
    };
    setEntityMappings(updated);
  };

  const addRelationMapping = () => {
    setRelationMappings([
      ...relationMappings,
      {
        relation_type_id: undefined,
        source_entity_type_id: undefined,
        target_entity_type_id: undefined,
        source_key: undefined,
        target_key: undefined,
        properties: {},
      },
    ]);
  };

  const updateRelationMapping = (index: number, field: string, value: any) => {
    const updated = [...relationMappings];
    updated[index] = { ...updated[index], [field]: value };
    setRelationMappings(updated);
  };

  const handleExecuteETL = () => {
    if (entityMappings.length === 0) {
      toast.error('최소 1개의 엔티티 매핑이 필요합니다');
      return;
    }

    etlMutation.mutate();
  };

  const selectedEntityType = (typeId: string) => 
    entityTypes?.find(t => t.id === typeId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            스키마 매핑 - ETL 파이프라인
          </CardTitle>
          <CardDescription>
            임포트된 데이터를 온톨로지 스키마에 맞게 변환합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 데이터 정보 */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">임포트 데이터</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">파일:</span> {importData.file_name}
              </div>
              <div>
                <span className="text-muted-foreground">레코드:</span> {importData.row_count}개
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">컬럼:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {columns.map(col => (
                    <Badge key={col} variant="outline">{col}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 자동 매핑 버튼 */}
          <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">AI 자동 매핑</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  AI가 데이터를 분석하고 온톨로지 스키마에 자동으로 매핑합니다
                </p>
              </div>
              <Button
                onClick={handleFullAutoMapping}
                disabled={isAutoMapping || !entityTypes || entityTypes.length === 0}
                className="ml-4"
              >
                {isAutoMapping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    전체 자동 매핑
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>

          {/* 엔티티 매핑 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">1. 엔티티 매핑</h3>
              <Button onClick={addEntityMapping} variant="outline" size="sm">
                + 엔티티 타입 추가
              </Button>
            </div>

            {entityMappings.map((mapping, idx) => (
              <Card key={idx} className="relative">
                <CardContent className="pt-4 space-y-4">
                  {/* 신뢰도 표시 */}
                  {mapping.confidence && (
                    <div className="absolute top-2 right-2">
                      <Badge variant={mapping.confidence > 0.8 ? "default" : "secondary"}>
                        신뢰도 {(mapping.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-[1fr,auto] gap-4">
                    <div className="space-y-2">
                      <Label>엔티티 타입</Label>
                      <Select
                        value={mapping.entity_type_id}
                        onValueChange={(value) => updateEntityMapping(idx, 'entity_type_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="엔티티 타입 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {entityTypes?.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label} ({type.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {mapping.entity_type_id && (
                      <div className="space-y-2">
                        <Label className="text-transparent">_</Label>
                        <Button 
                          onClick={() => autoMapProperties(idx)}
                          variant="outline"
                          size="default"
                          className="w-full"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          스마트 자동 매핑
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>라벨 템플릿</Label>
                    <Input
                      placeholder="예: {customer_name} 또는 제품#{product_id}"
                      value={mapping.label_template}
                      onChange={(e) => updateEntityMapping(idx, 'label_template', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      컬럼명을 중괄호로 감싸서 사용하세요
                    </p>
                  </div>

                  {mapping.entity_type_id && (
                    <div className="space-y-3">
                      <Label>속성 매핑</Label>
                      {(() => {
                        const entityType = selectedEntityType(mapping.entity_type_id);
                        const properties = entityType?.properties;
                        if (!properties || !Array.isArray(properties)) return null;
                        
                        return properties.map((prop: any) => (
                          <div key={prop.name} className="flex items-center gap-2">
                            <Badge variant="outline">{prop.label}</Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Select
                              value={mapping.column_mappings[prop.name] || undefined}
                              onValueChange={(value) => addPropertyMapping(idx, prop.name, value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="컬럼 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map(col => (
                                  <SelectItem key={col} value={col}>{col}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 관계 매핑 */}
          {entityMappings.length >= 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">2. 관계 매핑 (선택사항)</h3>
                <Button onClick={addRelationMapping} variant="outline" size="sm">
                  + 관계 추가
                </Button>
              </div>

              {relationMappings.map((relMapping, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>관계 타입</Label>
                      <Select
                        value={relMapping.relation_type_id}
                        onValueChange={(value) => updateRelationMapping(idx, 'relation_type_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="관계 타입 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationTypes?.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label} ({type.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Source 엔티티</Label>
                        <Select
                          value={relMapping.source_entity_type_id}
                          onValueChange={(value) => updateRelationMapping(idx, 'source_entity_type_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="엔티티 타입" />
                          </SelectTrigger>
                          <SelectContent>
                            {entityMappings.map((em, i) => (
                              <SelectItem key={i} value={em.entity_type_id}>
                                {entityTypes?.find(t => t.id === em.entity_type_id)?.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Target 엔티티</Label>
                        <Select
                          value={relMapping.target_entity_type_id}
                          onValueChange={(value) => updateRelationMapping(idx, 'target_entity_type_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="엔티티 타입" />
                          </SelectTrigger>
                          <SelectContent>
                            {entityMappings.map((em, i) => (
                              <SelectItem key={i} value={em.entity_type_id}>
                                {entityTypes?.find(t => t.id === em.entity_type_id)?.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Source 키 컬럼</Label>
                        <Select
                          value={relMapping.source_key}
                          onValueChange={(value) => updateRelationMapping(idx, 'source_key', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="컬럼 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Target 키 컬럼</Label>
                        <Select
                          value={relMapping.target_key}
                          onValueChange={(value) => updateRelationMapping(idx, 'target_key', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="컬럼 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ETL 실행 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {entityMappings.length}개 엔티티 타입, {relationMappings.length}개 관계 타입 매핑됨
            </div>
            <Button 
              onClick={handleExecuteETL} 
              disabled={entityMappings.length === 0 || etlMutation.isPending}
              size="lg"
            >
              {etlMutation.isPending ? (
                <>실행 중...</>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  ETL 실행
                </>
              )}
            </Button>
          </div>

          {etlMutation.isPending && (
            <div className="space-y-2">
              <Progress value={50} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                온톨로지 스키마에 맞게 데이터를 변환하고 있습니다...
              </p>
            </div>
          )}

          {etlMutation.isSuccess && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Check className="h-5 w-5" />
                <div>
                  <p className="font-semibold">ETL 완료!</p>
                  <p className="text-sm">
                    {etlMutation.data.entities_created}개 엔티티, {etlMutation.data.relations_created}개 관계가 생성되었습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
