import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Box, Layers, Package, Store, AlertCircle, Upload, Trash2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { upload3DModel, delete3DModel } from "../../utils/modelStorageManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModelLayer {
  id: string;
  name: string;
  type: 'space' | 'furniture' | 'product' | 'other';
  model_url: string;
  dimensions?: { width: number; height: number; depth: number };
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  metadata?: any;
}

interface ModelLayerManagerProps {
  models: ModelLayer[];
  activeLayers: string[];
  onLayersChange: (layerIds: string[]) => void;
  userId?: string;
  storeId?: string;
  onModelsReload?: () => void;
}

export function ModelLayerManager({ 
  models, 
  activeLayers, 
  onLayersChange,
  userId,
  storeId,
  onModelsReload
}: ModelLayerManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localActive, setLocalActive] = useState<string[]>(activeLayers);

  useEffect(() => {
    setLocalActive(activeLayers);
  }, [activeLayers]);

  // 파일명에서 베이스 이름 추출 (mannequin_1 -> mannequin)
  const getBaseName = (name: string): string => {
    // 언더스코어 + 숫자 패턴 제거 (예: mannequin_1 -> mannequin)
    const baseMatch = name.match(/^(.+?)_\d+$/);
    if (baseMatch) return baseMatch[1];
    
    // 언더스코어만 있는 경우 제거 (예: mannequin_ -> mannequin)
    const underscoreMatch = name.match(/^(.+?)_$/);
    if (underscoreMatch) return underscoreMatch[1];
    
    return name;
  };

  // 엔티티 타입별로 그룹화 (인스턴스 포함)
  const groupedByEntityType = models.reduce((acc, model) => {
    // 엔티티 인스턴스인 경우
    if (model.id.startsWith('entity-')) {
      const entityTypeName = model.metadata?.entityTypeName || 'Unknown';
      if (!acc[entityTypeName]) {
        acc[entityTypeName] = {
          type: model.type,
          entityTypeId: model.metadata?.entityTypeId,
          instances: []
        };
      }
      acc[entityTypeName].instances.push(model);
    }
    // 스토리지 또는 온톨로지 타입 모델
    else {
      // Storage 파일인 경우 베이스 이름으로 그룹화
      const key = model.id.startsWith('storage-') 
        ? getBaseName(model.name)
        : model.name;
      
      if (!acc[key]) {
        acc[key] = {
          type: model.type,
          entityTypeId: model.metadata?.entityTypeId,
          instances: []
        };
      }
      acc[key].instances.push(model);
    }
    return acc;
  }, {} as Record<string, { type: ModelLayer['type']; entityTypeId?: string; instances: ModelLayer[] }>);

  // 타입별로 재그룹화
  const groupedModels = {
    space: Object.entries(groupedByEntityType).filter(([_, group]) => group.type === 'space'),
    furniture: Object.entries(groupedByEntityType).filter(([_, group]) => group.type === 'furniture'),
    product: Object.entries(groupedByEntityType).filter(([_, group]) => group.type === 'product'),
    other: Object.entries(groupedByEntityType).filter(([_, group]) => group.type === 'other')
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !userId || !storeId) return;

    setIsUploading(true);
    const uploadedFiles: Array<{ fileName: string; publicUrl: string }> = [];
    let errorCount = 0;

    // 1. Storage에 파일 업로드
    for (const file of Array.from(files)) {
      const result = await upload3DModel(userId, storeId, file);
      if (result.success && result.publicUrl) {
        uploadedFiles.push({
          fileName: file.name,
          publicUrl: result.publicUrl
        });
      } else {
        errorCount++;
        toast.error(`${file.name} 업로드 실패: ${result.error}`);
      }
    }

    if (uploadedFiles.length === 0) {
      setIsUploading(false);
      toast.error('업로드된 파일이 없습니다');
      return;
    }

    // 2. 자동 처리 (AI 분석 + 엔티티 매핑 + 인스턴스 생성)
    try {
      const { data, error } = await supabase.functions.invoke('auto-process-3d-models', {
        body: {
          files: uploadedFiles,
          storeId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `${data.processed}개 모델 자동 처리 완료`,
          {
            description: `엔티티 타입 매핑 및 인스턴스 생성 완료`
          }
        );
        onModelsReload?.();
      } else {
        throw new Error(data.error || '자동 처리 실패');
      }
    } catch (error: any) {
      console.error('Auto-process error:', error);
      toast.error(`자동 처리 실패: ${error.message}`, {
        description: '모델은 업로드되었으나 자동 매핑에 실패했습니다'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (modelId: string, modelName: string) => {
    if (!userId || !storeId) return;
    
    // Storage에서 온 모델인지 확인
    if (!modelId.startsWith('storage-')) {
      toast.error('온톨로지 엔티티 모델은 여기서 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`"${modelName}" 모델을 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(modelId));

    const fileName = modelName + (modelName.endsWith('.glb') || modelName.endsWith('.gltf') ? '' : '.glb');
    const result = await delete3DModel(userId, storeId, fileName);

    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(modelId);
      return next;
    });

    if (result.success && result.publicUrl) {
      // 스토리지 파일 삭제 후, 엔티티 연결 정리
      const { cleanupEntityReferences } = await import('@/features/simulation/utils/cleanupEntityReferences');
      const cleanupResult = await cleanupEntityReferences(result.publicUrl, userId);
      
      if (cleanupResult.success && (cleanupResult.entityTypesUpdated > 0 || cleanupResult.entitiesUpdated > 0)) {
        toast.success(`모델 삭제 완료 (엔티티 타입 ${cleanupResult.entityTypesUpdated}개, 인스턴스 ${cleanupResult.entitiesUpdated}개 연결 해제)`);
      } else {
        toast.success('모델 삭제 완료');
      }
      
      onModelsReload?.();
    } else {
      toast.error(`삭제 실패: ${result.error}`);
    }
  };

  const renderGroup = (
    title: string, 
    icon: any, 
    groups: [string, { type: ModelLayer['type']; entityTypeId?: string; instances: ModelLayer[] }][], 
    color: string
  ) => {
    if (groups.length === 0) return null;

    const Icon = icon;
    const allInstances = groups.flatMap(([_, group]) => group.instances);
    const allSelected = allInstances.every(item => localActive.includes(item.id));

    const toggleAll = () => {
      if (allSelected) {
        const newActive = localActive.filter(id => !allInstances.find(item => item.id === id));
        setLocalActive(newActive);
        onLayersChange(newActive);
      } else {
        const newActive = [...new Set([...localActive, ...allInstances.map(item => item.id)])];
        setLocalActive(newActive);
        onLayersChange(newActive);
      }
    };

    const toggleItem = (id: string) => {
      const newActive = localActive.includes(id)
        ? localActive.filter(layerId => layerId !== id)
        : [...localActive, id];
      setLocalActive(newActive);
      onLayersChange(newActive);
    };

    const toggleEntityType = (instances: ModelLayer[]) => {
      const allTypeSelected = instances.every(item => localActive.includes(item.id));
      if (allTypeSelected) {
        const newActive = localActive.filter(id => !instances.find(item => item.id === id));
        setLocalActive(newActive);
        onLayersChange(newActive);
      } else {
        const newActive = [...new Set([...localActive, ...instances.map(item => item.id)])];
        setLocalActive(newActive);
        onLayersChange(newActive);
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`all-${title}`}
              checked={allSelected}
              onCheckedChange={toggleAll}
              className="data-[state=checked]:bg-primary"
            />
            <Icon className={`h-4 w-4 ${color}`} />
            <label
              htmlFor={`all-${title}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {title}
            </label>
            <Badge variant="secondary" className="ml-auto">
              {allInstances.filter(item => localActive.includes(item.id)).length} / {allInstances.length}
            </Badge>
          </div>
        </div>
        
        <div className="ml-6 space-y-3">
          {groups.map(([typeName, group]) => {
            const allTypeSelected = group.instances.every(item => localActive.includes(item.id));
            
            return (
              <div key={typeName} className="space-y-1">
                {/* 엔티티 타입 헤더 */}
                <div className="flex items-center gap-2 py-1">
                  <Checkbox
                    id={`type-${typeName}`}
                    checked={allTypeSelected}
                    onCheckedChange={() => toggleEntityType(group.instances)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <label
                    htmlFor={`type-${typeName}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {typeName}
                  </label>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {group.instances.filter(item => localActive.includes(item.id)).length} / {group.instances.length}
                  </Badge>
                </div>
                
                {/* 인스턴스 리스트 */}
                <div className="ml-6 space-y-1">
                  {group.instances.map((item) => {
                    const isDeleting = deletingIds.has(item.id);
                    const canDelete = item.id.startsWith('storage-');
                    const isInstance = item.id.startsWith('entity-');
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between group hover:bg-muted/50 rounded-md p-1">
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            id={item.id}
                            checked={localActive.includes(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="data-[state=checked]:bg-primary"
                            disabled={isDeleting}
                          />
                          <label
                            htmlFor={item.id}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {item.name}
                          </label>
                          {isInstance && (
                            <Badge variant="secondary" className="text-xs">인스턴스</Badge>
                          )}
                          {item.dimensions && item.dimensions.width !== undefined && item.dimensions.height !== undefined && item.dimensions.depth !== undefined && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {item.dimensions.width.toFixed(1)}×{item.dimensions.height.toFixed(1)}×{item.dimensions.depth.toFixed(1)}
                            </span>
                          )}
                          {item.position && item.position.x !== undefined && item.position.z !== undefined && (item.position.x !== 0 || item.position.z !== 0) && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({item.position.x.toFixed(1)}, {item.position.z.toFixed(1)})
                            </span>
                          )}
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(item.id, item.name)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          모델 레이어 관리
        </CardTitle>
        <CardDescription>
          3D 씬에 표시할 레이어를 선택하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!userId || !storeId) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              먼저 매장을 선택해주세요.
            </AlertDescription>
          </Alert>
        )}

        {userId && storeId && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  3D 모델 업로드
                </>
              )}
            </Button>
          </div>
        )}

        <Separator />

        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {renderGroup("매장 공간", Store, groupedModels.space, "text-blue-500")}
            {renderGroup("가구", Box, groupedModels.furniture, "text-amber-500")}
            {renderGroup("상품", Package, groupedModels.product, "text-green-500")}
            {renderGroup("기타", Layers, groupedModels.other, "text-gray-500")}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
