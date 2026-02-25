import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileSpreadsheet, Box, Wifi, Network, Database } from "lucide-react";

interface DataStatisticsProps {
  storeId?: string;
}

interface Statistics {
  csvImports: number;
  models3D: number;
  wifiZones: number;
  wifiTracking: number;
  entityTypes: number;
  entities: number;
  entitiesWith3D: number; // 실제 3D 모델이 할당된 엔티티
  storageUsed: number; // bytes
  totalFiles: number;
}

export function DataStatistics({ storeId }: DataStatisticsProps) {
  const [stats, setStats] = useState<Statistics>({
    csvImports: 0,
    models3D: 0,
    wifiZones: 0,
    wifiTracking: 0,
    entityTypes: 0,
    entities: 0,
    entitiesWith3D: 0,
    storageUsed: 0,
    totalFiles: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [storeId]);

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // CSV 임포트 수 (3D 모델 제외)
      let csvQuery = supabase
        .from('user_data_imports')
        .select('id', { count: 'exact', head: true })
        .neq('data_type', '3d_model');
      
      if (storeId) csvQuery = csvQuery.eq('store_id', storeId);
      const { count: csvCount } = await csvQuery;

      // 3D 모델 수 (스토리지에서) - 실제 경로 구조 반영
      const modelPath = storeId ? `${user.id}/${storeId}` : user.id;
      
      let totalModelCount = 0;
      let totalModelSize = 0;

      // 3d-models 서브폴더 우선 조회
      const modelSubPath = `${modelPath}/3d-models`;
      const { data: modelSubFiles, error: subError } = await supabase.storage
        .from('3d-models')
        .list(modelSubPath);

      if (modelSubFiles && !subError) {
        const validFiles = modelSubFiles.filter(f => f.id);
        totalModelCount += validFiles.length;
        totalModelSize += validFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
        console.log('3D models in subfolder:', validFiles.length);
      }
      
      // 루트 레벨의 .glb/.gltf 파일들도 확인 (이전 방식 호환)
      const { data: modelRootFiles } = await supabase.storage
        .from('3d-models')
        .list(modelPath);

      if (modelRootFiles) {
        const rootModels = modelRootFiles.filter(f => 
          f.id && (f.name.endsWith('.glb') || f.name.endsWith('.gltf'))
        );
        totalModelCount += rootModels.length;
        totalModelSize += rootModels.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
        console.log('3D models in root:', rootModels.length);
      }

      // 스토리지 데이터 파일
      const { data: dataFiles } = await supabase.storage
        .from('store-data')
        .list(modelPath);

      // 총 스토리지 사용량 계산
      const dataSize = (dataFiles || []).filter(f => f.id).reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const totalStorage = totalModelSize + dataSize;
      const totalFileCount = totalModelCount + ((dataFiles || []).filter(f => f.id).length);

      // WiFi 존 수
      let zoneQuery = supabase
        .from('wifi_zones' as any)
        .select('id', { count: 'exact', head: true });
      
      if (storeId) zoneQuery = zoneQuery.eq('store_id', storeId);
      const { count: zoneCount } = await zoneQuery;

      // WiFi 트래킹 포인트 수
      let trackingQuery = supabase
        .from('wifi_tracking' as any)
        .select('id', { count: 'exact', head: true });
      
      if (storeId) trackingQuery = trackingQuery.eq('store_id', storeId);
      const { count: trackingCount } = await trackingQuery;

      // Entity Types 수 (현재 사용자)
      const { count: entityTypeCount } = await supabase
        .from('ontology_entity_types')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Entities 수
      let entityQuery = supabase
        .from('graph_entities')
        .select('id', { count: 'exact', head: true });
      
      if (storeId) entityQuery = entityQuery.eq('store_id', storeId);
      const { count: entityCount } = await entityQuery;

      // 3D 정보를 가진 엔티티 수 (유효한 model_3d_url을 가진 엔티티 타입만)
      let entities3DQuery = supabase
        .from('graph_entities')
        .select(`
          id,
          entity_type_id,
          ontology_entity_types!inner(model_3d_url)
        `, { count: 'exact', head: true })
        .not('ontology_entity_types.model_3d_url', 'is', null);
      
      if (storeId) entities3DQuery = entities3DQuery.eq('store_id', storeId);
      const { count: entities3DCount } = await entities3DQuery;

      setStats({
        csvImports: csvCount || 0,
        models3D: totalModelCount,
        wifiZones: zoneCount || 0,
        wifiTracking: trackingCount || 0,
        entityTypes: entityTypeCount || 0,
        entities: entityCount || 0,
        entitiesWith3D: entities3DCount || 0,
        storageUsed: totalStorage,
        totalFiles: totalFileCount
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const statCards = [
    {
      title: "스토리지 사용량",
      value: formatBytes(stats.storageUsed),
      icon: Database,
      description: `총 ${stats.totalFiles}개 파일`,
      highlight: true
    },
    {
      title: "CSV 데이터",
      value: stats.csvImports,
      icon: FileSpreadsheet,
      description: "임포트된 파일 수"
    },
    {
      title: "3D 모델",
      value: stats.models3D,
      icon: Box,
      description: "업로드된 모델 수"
    },
    {
      title: "WiFi 존",
      value: stats.wifiZones,
      icon: Wifi,
      description: "설정된 센서 수"
    },
    {
      title: "트래킹 포인트",
      value: stats.wifiTracking,
      icon: Database,
      description: "수집된 위치 데이터"
    },
    {
      title: "Entity Types",
      value: stats.entityTypes,
      icon: Network,
      description: "정의된 타입 수"
    },
    {
      title: "Graph Entities",
      value: stats.entities,
      icon: Network,
      description: `총 ${stats.entities}개 (3D: ${stats.entitiesWith3D}개)`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
      {statCards.map((stat, index) => (
        <Card 
          key={index} 
          className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 border-0 ${
            stat.highlight 
              ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-background' 
              : 'bg-gradient-to-br from-muted/50 to-background'
          }`}
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
            <CardTitle className="text-sm font-semibold text-foreground/80">
              {stat.title}
            </CardTitle>
            <div className={`relative p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              stat.highlight 
                ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20' 
                : 'bg-gradient-to-br from-muted to-muted/70'
            }`}>
              <stat.icon className={`w-5 h-5 ${
                stat.highlight ? 'text-primary-foreground' : 'text-foreground/70'
              }`} />
              {/* 아이콘 글로우 효과 */}
              {stat.highlight && (
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md" />
              )}
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-3xl font-bold mb-1 transition-colors ${
              stat.highlight ? 'text-primary' : 'text-foreground'
            }`}>
              {loading ? (
                <div className="h-9 w-20 bg-muted/50 animate-pulse rounded" />
              ) : (
                typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value
              )}
            </div>
            <p className="text-xs text-muted-foreground/80">
              {stat.description}
            </p>
            
            {/* 호버 시 하단 액센트 */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 ${
              stat.highlight 
                ? 'bg-gradient-to-r from-primary to-primary/50 opacity-100' 
                : 'bg-gradient-to-r from-muted to-transparent opacity-0 group-hover:opacity-100'
            }`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
