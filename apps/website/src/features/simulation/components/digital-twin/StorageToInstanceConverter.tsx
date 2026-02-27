import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight, Package } from "lucide-react";
import type { ModelLayer } from "./ModelLayerManager";

interface StorageToInstanceConverterProps {
  storageModels: ModelLayer[];
  entityTypes: Array<{
    id: string;
    name: string;
    label: string;
  }>;
  userId: string;
  storeId: string;
  onConversionComplete?: () => void;
}

export function StorageToInstanceConverter({
  storageModels,
  entityTypes,
  userId,
  storeId,
  onConversionComplete
}: StorageToInstanceConverterProps) {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("");
  const [instanceLabel, setInstanceLabel] = useState<string>("");
  const [converting, setConverting] = useState(false);

  const handleConvert = async () => {
    if (!selectedModel || !selectedEntityType || !instanceLabel.trim()) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    setConverting(true);

    try {
      const model = storageModels.find(m => m.id === selectedModel);
      if (!model) {
        throw new Error("모델을 찾을 수 없습니다");
      }

      // 엔티티 타입 정보 가져오기
      const { data: entityType } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('id', selectedEntityType)
        .single();

      if (!entityType) {
        throw new Error("엔티티 타입을 찾을 수 없습니다");
      }

      // 새 인스턴스 생성 (Storage 모델 URL 사용)
      const { error: insertError } = await supabase
        .from('graph_entities')
        .insert({
          user_id: userId,
          store_id: storeId,
          entity_type_id: selectedEntityType,
          label: instanceLabel,
          model_3d_position: model.position || { x: 0, y: 0, z: 0 },
          model_3d_rotation: model.rotation || { x: 0, y: 0, z: 0 },
          model_3d_scale: model.scale || { x: 1, y: 1, z: 1 },
          properties: {
            source: 'storage',
            original_file: model.name,
            model_url: model.model_url // Storage URL 저장
          }
        });

      if (insertError) throw insertError;

      // 엔티티 타입에 이 모델 URL이 연결되지 않았다면 연결
      if (!entityType.model_3d_url) {
        await supabase
          .from('ontology_entity_types')
          .update({
            model_3d_url: model.model_url,
            model_3d_dimensions: model.dimensions || { width: 1, height: 1, depth: 1 }
          })
          .eq('id', selectedEntityType);
      }

      toast.success(`"${instanceLabel}" 인스턴스 생성 완료`);
      setInstanceLabel("");
      setSelectedModel("");
      onConversionComplete?.();
    } catch (error: any) {
      console.error('Instance conversion error:', error);
      toast.error(`변환 실패: ${error.message}`);
    } finally {
      setConverting(false);
    }
  };

  if (storageModels.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Storage 파일을 인스턴스로 변환
        </CardTitle>
        <CardDescription>
          업로드한 3D 모델을 엔티티 인스턴스로 변환하여 레이어에 추가하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Storage 파일 선택</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue placeholder="변환할 모델 선택" />
            </SelectTrigger>
            <SelectContent>
              {storageModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{model.type}</Badge>
                    {model.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />

        <div className="space-y-2">
          <Label>엔티티 타입 선택</Label>
          <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
            <SelectTrigger>
              <SelectValue placeholder="연결할 엔티티 타입" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label || type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>인스턴스 이름</Label>
          <Input
            placeholder="예: 마네킨 1"
            value={instanceLabel}
            onChange={(e) => setInstanceLabel(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleConvert}
          disabled={converting || !selectedModel || !selectedEntityType || !instanceLabel.trim()}
        >
          {converting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              변환 중...
            </>
          ) : (
            "인스턴스 생성"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
