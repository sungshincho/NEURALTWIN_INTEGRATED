import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle, Copy, ExternalLink, Sparkles, Eye, AlertCircle } from 'lucide-react';
import { AutoModelMapper } from './AutoModelMapper';
import { Model3DPreview } from './Model3DPreview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseModelFilename, isMovableEntityType, suggestDefaultPosition, logParseResult } from '../../utils/modelFilenameParser';

interface UploadedFile {
  name: string;
  url: string;
}

interface ModelAnalysis {
  matched_entity_type: any;
  confidence: number;
  inferred_type: string;
  suggested_dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  reasoning: string;
  fileName: string;
  fileUrl: string;
}

export function ModelUploader() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [pendingAnalysis, setPendingAnalysis] = useState<ModelAnalysis | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: "URL이 클립보드에 복사되었습니다",
    });
  };

  const autoMapFromFilename = async (
    file: UploadedFile, 
    parsed: ReturnType<typeof parseModelFilename>
  ) => {
    if (!user || !selectedStore) return;

    try {
      // 1. 엔티티 타입 찾기 또는 생성
      const { data: existingTypes, error: typeError } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('user_id', user.id)
        .ilike('label', parsed.entityType);

      if (typeError) throw typeError;

      let entityTypeId: string;

      if (existingTypes && existingTypes.length > 0) {
        // 기존 엔티티 타입 사용
        entityTypeId = existingTypes[0].id;
        
        // 3D 모델 URL과 치수 업데이트
        await supabase
          .from('ontology_entity_types')
          .update({
            model_3d_url: file.url,
            model_3d_dimensions: parsed.dimensions,
            model_3d_type: isMovableEntityType(parsed.entityType) ? 'movable' : 'fixed'
          })
          .eq('id', entityTypeId);
      } else {
        // 새 엔티티 타입 생성
        const { data: newType, error: createError } = await supabase
          .from('ontology_entity_types')
          .insert([{
            label: parsed.entityType,
            name: parsed.entityType,
            description: `${parsed.entityType} (자동 생성)`,
            user_id: user.id,
            model_3d_url: file.url,
            model_3d_dimensions: parsed.dimensions,
            model_3d_type: isMovableEntityType(parsed.entityType) ? 'movable' : 'fixed',
            properties: {}
          } as any])
          .select()
          .single();

        if (createError) throw createError;
        if (!newType) throw new Error('엔티티 타입 생성 실패');
        entityTypeId = newType.id;
      }

      // 2. 엔티티 인스턴스 생성
      const position = suggestDefaultPosition(parsed.entityType, parsed.dimensions);
      
      const { error: entityError } = await supabase
        .from('graph_entities')
        .insert([{
          entity_type_id: entityTypeId,
          label: `${parsed.identifier}`,
          properties: {
            store_id: selectedStore.id,
            store_name: selectedStore.store_name,
            auto_mapped: true,
            source_filename: parsed.originalFilename
          },
          user_id: user.id,
          model_3d_position: position,
          model_3d_rotation: { x: 0, y: 0, z: 0 },
          model_3d_scale: { x: 1, y: 1, z: 1 }
        } as any]);

      if (entityError) throw entityError;

      console.log(`✅ 자동 매핑 완료: ${parsed.originalFilename} → ${parsed.entityType}`);
    } catch (err) {
      console.error('Auto mapping error:', err);
      toast({
        title: "자동 매핑 실패",
        description: "파일명 기반 자동 매핑에 실패했습니다. AI 분석을 시도하세요.",
        variant: "destructive",
      });
    }
  };

  const analyzeModel = async (file: UploadedFile) => {
    if (!user) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-3d-model', {
        body: {
          fileName: file.name,
          fileUrl: file.url,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        setPendingAnalysis({
          ...data.analysis,
          matched_entity_type: data.matched_entity_type,
          fileName: file.name,
          fileUrl: file.url
        });
      }
    } catch (err) {
      console.error('Model analysis error:', err);
      toast({
        title: "분석 실패",
        description: "3D 모델 자동 분석에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
  };

  const processFiles = async (files: FileList) => {
    if (!user) return;

    if (!selectedStore) {
      toast({
        title: "매장을 선택해주세요",
        description: "3D 모델을 업로드하려면 먼저 매장을 선택해야 합니다",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // GLB/GLTF와 JSON 파일 분리
      const modelFiles = Array.from(files).filter(f => 
        f.name.toLowerCase().endsWith('.glb') || f.name.toLowerCase().endsWith('.gltf')
      );
      const jsonFiles = Array.from(files).filter(f => 
        f.name.toLowerCase().endsWith('.json')
      );

      // 모든 파일 업로드 (원본 파일명 유지)
      const uploadPromises = Array.from(files).map(async (file) => {
        const filePath = `${user.id}/${selectedStore.id}/${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('3d-models')
          .upload(filePath, file, {
            upsert: true // 같은 이름이면 덮어쓰기
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('3d-models')
          .getPublicUrl(filePath);

        return { 
          name: file.name, 
          url: publicUrl,
          type: file.type
        };
      });

      console.log(`Uploading ${modelFiles.length} model files and ${jsonFiles.length} metadata files`);

      const results = await Promise.all(uploadPromises);
      
      // DB에 임포트 기록 저장
      const dbInserts = results.map((result, idx) => ({
        user_id: user.id,
        store_id: selectedStore.id,
        file_name: result.name,
        file_type: '3d-model',
        data_type: '3d_model',
        raw_data: { url: result.url },
        row_count: 1,
      }));
      
      if (dbInserts.length > 0) {
        const { error: dbError } = await supabase
          .from('user_data_imports')
          .insert(dbInserts);
        
        if (dbError) {
          console.error('DB insert error:', dbError);
        }
      }
      
      setUploadedFiles(prev => [...prev, ...results]);
      
      // 온톨로지 통합: 자동으로 3D 모델 연결
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        let linkedCount = 0;
        
        for (const result of results) {
          try {
            const { data: linkResult, error: linkError } = await supabase.functions.invoke(
              'import-with-ontology',
              {
                body: {
                  modelUrl: result.url,
                  autoCreateEntityType: true
                },
                headers: { Authorization: `Bearer ${session.access_token}` }
              }
            );

            if (!linkError && linkResult?.entityTypesLinked) {
              linkedCount += linkResult.entityTypesLinked;
            }
          } catch (err) {
            console.error('Model link error:', err);
          }
        }

        toast({
          title: "통합 업로드 완료",
          description: `${results.length}개 모델 업로드 및 ${linkedCount}개 엔티티 타입 연결`,
        });
        
        // Activity logging
        logActivity('data_upload', {
          file_count: results.length,
          entity_types_linked: linkedCount,
          upload_type: '3d_model',
          store_id: selectedStore.id,
          timestamp: new Date().toISOString()
        });
      } else {
        toast({
          title: "업로드 완료",
          description: `${results.length}개의 3D 모델이 업로드되었습니다.`,
        });
        
        // Activity logging
        logActivity('data_upload', {
          file_count: results.length,
          upload_type: '3d_model',
          store_id: selectedStore.id,
          timestamp: new Date().toISOString()
        });
      }

      // 기존 자동 매핑은 제거하고 통합 시스템 사용
      
      if (results.length > 1) {
        toast({
          title: "자동 매핑 완료",
          description: "파일명 규칙에 따라 온톨로지에 자동으로 연결되었습니다",
        });
      }
    } catch (err) {
      console.error('업로드 실패:', err);
      toast({
        title: "업로드 실패",
        description: err instanceof Error ? err.message : "파일 업로드에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!selectedStore && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            3D 모델을 업로드하려면 먼저 사이드바에서 매장을 선택해주세요
          </AlertDescription>
        </Alert>
      )}

      {pendingAnalysis && (
        <AutoModelMapper
          analysis={pendingAnalysis}
          onAccept={() => {
            setPendingAnalysis(null);
            toast({
              title: "매핑 완료",
              description: "3D 모델이 온톨로지에 자동으로 연결되었습니다",
            });
          }}
          onReject={() => {
            setPendingAnalysis(null);
            toast({
              title: "매핑 거부",
              description: "수동으로 스키마 빌더에서 연결할 수 있습니다",
            });
          }}
        />
      )}

      {analyzing && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 animate-pulse text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">AI가 3D 모델을 분석하고 있습니다...</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          3D 모델 업로드
        </CardTitle>
        <CardDescription>
          GLB/GLTF 파일과 메타데이터 JSON을 함께 업로드하세요. 같은 이름의 파일을 페어로 선택하면 자동으로 인식됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && document.getElementById('model-upload')?.click()}
        >
          <input
            id="model-upload"
            type="file"
            accept=".glb,.gltf,.json"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">업로드 중...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    파일을 여기에 드래그하거나 클릭하여 선택
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    GLB/GLTF + JSON 파일 지원 (최대 100MB)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    예: Rack_Main_2.0x1.8x0.6.glb + Rack_Main_2.0x1.8x0.6.json
                  </p>
                </div>
                {selectedStore && (
                  <p className="text-xs text-muted-foreground">
                    업로드 위치: {selectedStore.store_name}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>업로드된 파일 (클릭하여 URL 복사)</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadedFiles.map((file, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{file.url}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="3D 미리보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl h-[600px]">
                        <DialogHeader>
                          <DialogTitle>{file.name}</DialogTitle>
                        </DialogHeader>
                        <Model3DPreview modelUrl={file.url} className="h-[500px]" />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(file.url)}
                      title="URL 복사"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => analyzeModel(file)}
                      title="AI 자동 매핑"
                      disabled={analyzing}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      title="새 탭에서 열기"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>자동 매핑 기능:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>업로드 시 AI가 자동으로 파일명을 분석합니다</li>
            <li>기존 온톨로지 스키마와 매칭하여 적합한 엔티티 타입을 제안합니다</li>
            <li>신뢰도와 함께 제안된 크기 정보를 제공합니다</li>
            <li>수락 시 자동으로 스키마에 3D 모델이 연결됩니다</li>
            <li>또는 <Sparkles className="inline h-3 w-3" /> 버튼을 눌러 수동으로 분석할 수 있습니다</li>
          </ul>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
