import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Plus, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EntityTypeManager } from "@/features/data-management/ontology/components/EntityTypeManager";
import { RelationTypeManager } from "@/features/data-management/ontology/components/RelationTypeManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

interface OntologyDataManagementProps {
  storeId?: string;
}

export function OntologyDataManagement({ storeId }: OntologyDataManagementProps) {
  const { toast } = useToast();
  const [entityTypeCount, setEntityTypeCount] = useState(0);
  const [entityCount, setEntityCount] = useState(0);
  const [relationTypeCount, setRelationTypeCount] = useState(0);
  const [relationCount, setRelationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isBulkConverting, setIsBulkConverting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentFile: '' });

  useEffect(() => {
    loadStatistics();
  }, [storeId]);

  const loadStatistics = async () => {
    try {
      // 현재 로그인한 사용자의 ontology schema 조회
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        setLoading(false);
        return;
      }
      
      // Entity Types (마스터 타입 + 현재 사용자 타입)
      const { count: etCount } = await supabase
        .from('ontology_entity_types')
        .select('id', { count: 'exact', head: true })
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.id}`);

      setEntityTypeCount(etCount || 0);

      // Entities (현재 사용자, 선택된 매장)
      let entityQuery = supabase
        .from('graph_entities')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (storeId) entityQuery = entityQuery.eq('store_id', storeId);
      const { count: eCount } = await entityQuery;
      setEntityCount(eCount || 0);

      // Relation Types (마스터 타입 + 현재 사용자 타입)
      const { count: rtCount } = await supabase
        .from('ontology_relation_types')
        .select('id', { count: 'exact', head: true })
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.id}`);

      setRelationTypeCount(rtCount || 0);

      // Relations (현재 사용자, 선택된 매장)
      let relationQuery = supabase
        .from('graph_relations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (storeId) relationQuery = relationQuery.eq('store_id', storeId);
      const { count: rCount } = await relationQuery;
      setRelationCount(rCount || 0);

    } catch (error) {
      console.error('Failed to load ontology statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // 모든 CSV 파일 일괄 온톨로지 변환
  const handleBulkConvertToOntology = async () => {
    setIsBulkConverting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      // 온톨로지 타입 확인 (마스터 타입 + 사용자 타입)
      const { data: entityTypes } = await supabase
        .from('ontology_entity_types')
        .select('id')
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.id}`)
        .limit(1);

      if (!entityTypes || entityTypes.length === 0) {
        toast({
          title: "온톨로지 타입 없음",
          description: "먼저 Entity Type과 Relation Type을 생성해주세요",
          variant: "destructive",
        });
        setIsBulkConverting(false);
        return;
      }

      // CSV 파일만 필터링 (3d_model 제외)
      const query = storeId 
        ? await supabase
            .from('user_data_imports')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })
        : await supabase
            .from('user_data_imports')
            .select('*')
            .order('created_at', { ascending: false });
      
      const { data: allImports, error } = query;
      
      // JavaScript에서 3d_model 제외
      const csvImports = allImports?.filter(item => 
        item.data_type !== '3d_model'
      ) || [];
      
      if (error) throw error;

      if (!csvImports || csvImports.length === 0) {
        toast({
          title: "변환할 파일 없음",
          description: "온톨로지로 변환할 CSV 파일이 없습니다",
        });
        setIsBulkConverting(false);
        return;
      }

      console.log('🚀 Starting bulk conversion for', csvImports.length, 'files');
      setBulkProgress({ current: 0, total: csvImports.length, currentFile: '' });

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < csvImports.length; i++) {
        const importItem = csvImports[i];
        setBulkProgress({ 
          current: i + 1, 
          total: csvImports.length, 
          currentFile: importItem.file_name 
        });

        console.log(`📄 Processing ${i + 1}/${csvImports.length}: ${importItem.file_name}`);

        try {
          // 1. AI 자동 매핑
          const rawData = importItem.raw_data as any[];
          
          if (!Array.isArray(rawData) || rawData.length === 0) {
            throw new Error('데이터가 비어있습니다');
          }

          const dataSample = rawData.slice(0, 5);
          const columns = Object.keys(rawData[0]);

          console.log(`  📊 Columns: ${columns.join(', ')}`);
          console.log(`  📝 Sample rows: ${dataSample.length}`);

          const { data: mappingData, error: mappingError } = await supabase.functions.invoke(
            'auto-map-etl',
            {
              body: {
                import_id: importItem.id,
                data_sample: dataSample,
                columns: columns,
              }
            }
          );

          if (mappingError) {
            console.error('  ❌ Mapping error:', mappingError);
            throw new Error(`매핑 실패: ${mappingError.message}`);
          }

          if (!mappingData || !mappingData.entity_mappings) {
            throw new Error('매핑 결과가 없습니다');
          }

          console.log(`  ✅ Mapped ${mappingData.entity_mappings.length} entities`);

          // 2. ETL 실행
          const { data: etlData, error: etlError } = await supabase.functions.invoke(
            'unified-etl',
            {
              body: {
                etl_type: 'schema',
                import_id: importItem.id,
                store_id: storeId,
                entity_mappings: mappingData.entity_mappings,
                relation_mappings: mappingData.relation_mappings || [],
              }
            }
          );

          if (etlError) {
            console.error('  ❌ ETL error:', etlError);
            throw new Error(`ETL 실패: ${etlError.message}`);
          }

          console.log(`  ✅ Created ${etlData?.entities_created || 0} entities`);

          successCount++;
          sonnerToast.success(`${importItem.file_name} 변환 완료`);
        } catch (error: any) {
          failCount++;
          console.error(`  ❌ ${importItem.file_name} 변환 실패:`, error);
          sonnerToast.error(`${importItem.file_name} 변환 실패: ${error.message}`);
        }
      }

      toast({
        title: "일괄 변환 완료",
        description: `성공: ${successCount}개, 실패: ${failCount}개`,
      });

      // 통계 새로고침
      await loadStatistics();
    } catch (error: any) {
      console.error('Bulk conversion error:', error);
      toast({
        title: "오류",
        description: "일괄 변환 실패: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsBulkConverting(false);
      setBulkProgress({ current: 0, total: 0, currentFile: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 일괄 변환 진행 상태 */}
      {isBulkConverting && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              온톨로지 일괄 변환 중...
            </CardTitle>
            <CardDescription>
              {bulkProgress.current} / {bulkProgress.total} - {bulkProgress.currentFile}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : entityTypeCount}
            </div>
            <p className="text-xs text-muted-foreground">정의된 타입 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entities</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : entityCount}
            </div>
            <p className="text-xs text-muted-foreground">생성된 엔티티</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relation Types</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : relationTypeCount}
            </div>
            <p className="text-xs text-muted-foreground">정의된 관계 타입</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relations</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : relationCount}
            </div>
            <p className="text-xs text-muted-foreground">생성된 관계</p>
          </CardContent>
        </Card>
      </div>

      {/* 일괄 변환 버튼 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CSV → 온톨로지 일괄 변환</CardTitle>
              <CardDescription>
                업로드된 모든 CSV 파일을 온톨로지 엔티티로 자동 변환합니다
              </CardDescription>
            </div>
            <Button 
              onClick={handleBulkConvertToOntology}
              disabled={isBulkConverting}
              size="lg"
              className="gap-2"
            >
              {isBulkConverting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  변환 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  모든 CSV 온톨로지 변환
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>온톨로지 스키마 관리</CardTitle>
          <CardDescription>
            Entity Type과 Relation Type을 정의하여 지식 그래프를 구축하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entity-types" className="space-y-4">
            <TabsList>
              <TabsTrigger value="entity-types">Entity Types</TabsTrigger>
              <TabsTrigger value="relation-types">Relation Types</TabsTrigger>
              <TabsTrigger value="guide">사용 가이드</TabsTrigger>
            </TabsList>

            <TabsContent value="entity-types">
              <EntityTypeManager />
            </TabsContent>

            <TabsContent value="relation-types">
              <RelationTypeManager />
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  온톨로지는 매장의 모든 구성 요소와 관계를 정의하는 스키마입니다
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">1</Badge>
                    Entity Type 정의
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    매장의 구성 요소 타입을 정의합니다 (예: StoreSpace, Shelf, Product)
                  </p>
                  <ul className="text-sm text-muted-foreground ml-12 mt-2 space-y-1 list-disc">
                    <li>3D 모델 타입 선택 (GLTF 또는 Primitive)</li>
                    <li>속성(Properties) 정의 (이름, 타입, 필수 여부)</li>
                    <li>3D 시각화용 크기 설정</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">2</Badge>
                    Relation Type 정의
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Entity 간의 관계 타입을 정의합니다 (예: contains, purchased_by)
                  </p>
                  <ul className="text-sm text-muted-foreground ml-12 mt-2 space-y-1 list-disc">
                    <li>Source와 Target Entity Type 지정</li>
                    <li>방향성 설정 (directed/undirected)</li>
                    <li>관계 속성 정의</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">3</Badge>
                    Entity 생성
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    정의된 타입을 기반으로 실제 인스턴스를 생성합니다
                  </p>
                  <ul className="text-sm text-muted-foreground ml-12 mt-2 space-y-1 list-disc">
                    <li>3D 좌표 설정 (x, y, z)</li>
                    <li>회전 및 스케일 조정</li>
                    <li>속성 값 입력</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">4</Badge>
                    시각화
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    "디지털 트윈 3D" 페이지에서 생성된 온톨로지를 3D로 시각화합니다
                  </p>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    <strong>💡 Tip:</strong> "3D 모델" 탭에서 샘플 데이터를 생성하면 
                    기본적인 온톨로지 구조를 바로 체험할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
