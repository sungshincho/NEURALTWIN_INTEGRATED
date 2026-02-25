import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download, Search, RefreshCw, FileIcon, Loader2, Eye, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useClearCache } from "@/hooks/useClearCache";
import { AutoModelMapper } from "@/features/simulation/components/digital-twin/AutoModelMapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Model3DPreview } from "@/features/simulation/components/digital-twin/Model3DPreview";

interface StorageManagerProps {
  storeId?: string;
}

interface StorageFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
  url: string;
  bucket: string;
  storeName?: string;
  storeId?: string;
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

export function StorageManager({ storeId }: StorageManagerProps) {
  const { toast } = useToast();
  const { clearAllCache, clearStoreDataCache } = useClearCache();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<ModelAnalysis | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (storeId) {
      loadAllFiles();
    }
  }, [storeId]);

  const loadAllFiles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const allFiles: StorageFile[] = [];
      
      // 매장 정보 가져오기
      const { data: stores } = await supabase
        .from('stores')
        .select('id, store_name')
        .eq('user_id', user.id);

      const storesToLoad = storeId 
        ? stores?.filter(s => s.id === storeId) || []
        : stores || [];

      // 각 매장별로 파일 조회
      for (const store of storesToLoad) {
        const basePath = `${user.id}/${store.id}`;
        
        // store-data 버킷
        const { data: dataFiles } = await supabase.storage
          .from('store-data')
          .list(basePath, {
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (dataFiles) {
          for (const file of dataFiles) {
            if (!file.id) continue;
            
            const filePath = `${basePath}/${file.name}`;
            const { data: { publicUrl } } = supabase.storage
              .from('store-data')
              .getPublicUrl(filePath);

            allFiles.push({
              name: file.name,
              path: filePath,
              size: file.metadata?.size || 0,
              created_at: file.created_at,
              url: publicUrl,
              bucket: 'store-data',
              storeName: store.store_name,
              storeId: store.id
            });
          }
        }

        // 3d-models 버킷 (루트 레벨)
        const { data: modelRootFiles } = await supabase.storage
          .from('3d-models')
          .list(basePath, {
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (modelRootFiles) {
          for (const file of modelRootFiles) {
            if (file.id && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
              const filePath = `${basePath}/${file.name}`;
              const { data: { publicUrl } } = supabase.storage
                .from('3d-models')
                .getPublicUrl(filePath);

              allFiles.push({
                name: file.name,
                path: filePath,
                size: file.metadata?.size || 0,
                created_at: file.created_at,
                url: publicUrl,
                bucket: '3d-models',
                storeName: store.store_name,
                storeId: store.id
              });
            }
          }
        }
      }

      setFiles(allFiles);
      console.log('✅ StorageManager loaded files:', allFiles.length, '파일 from', storesToLoad.length, '매장');
    } catch (error: any) {
      console.error('❌ StorageManager error:', error);
      toast({
        title: "파일 로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (bucket: string, path: string, name: string) => {
    if (!confirm(`"${name}" 파일 및 관련 데이터를 삭제하시겠습니까?`)) return;

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log('🗑️ Deleting file:', { bucket, path, name });

      // 스토리지 파일 삭제
      let deleteError = null;

      if (bucket === '3d-models') {
        // 경로 문제가 있을 수 있어 전체 경로와 파일명 두 가지 방식으로 모두 시도
        const { error: primaryError } = await supabase.storage
          .from('3d-models')
          .remove([path]);

        if (primaryError) {
          const { error: secondaryError } = await supabase.storage
            .from('3d-models')
            .remove([name]);

          deleteError = secondaryError;
        }
      } else {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([path]);
        deleteError = error;
      }

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        throw new Error(`스토리지 삭제 실패: ${deleteError.message}`);
      }

      console.log('✅ Storage delete success:', { bucket, path });

      // user_data_imports 삭제 (파일명 기준)
      const { error: dbError } = await (supabase as any)
        .from('user_data_imports')
        .delete()
        .eq('user_id', user.id)
        .eq('file_name', name);

      if (dbError) {
        console.error('DB delete error:', dbError);
        // DB 삭제 실패는 경고만 하고 계속 진행
      }

      toast({
        title: "삭제 완료",
        description: `${name}이(가) 삭제되었습니다`,
      });

      await loadAllFiles();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "삭제 실패",
        description: error.message || "파일 삭제 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) {
      console.log('❌ No files selected');
      return;
    }
    
    console.log('🗑️ handleBulkDelete called, selected files:', selectedFiles.size);
    
    if (!confirm(`선택한 ${selectedFiles.size}개 파일 및 관련 데이터를 삭제하시겠습니까?`)) {
      console.log('❌ User cancelled deletion');
      return;
    }

    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "인증 오류",
        description: "로그인이 필요합니다",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const filePaths = Array.from(selectedFiles);
    let deletedCount = 0;
    let failedCount = 0;

    console.log('🗑️ Starting bulk delete for paths:', filePaths);

    for (const path of filePaths) {
      const file = files.find(f => f.path === path);
      if (!file) {
        console.warn(`❌ File not found in state: ${path}`);
        failedCount++;
        continue;
      }

      console.log(`🗑️ Attempting to delete: ${file.bucket}/${path}`);

      try {
        // 스토리지 파일 삭제 - 실제 경로로 직접 삭제
        const { data: deleteData, error: deleteError } = await supabase.storage
          .from(file.bucket)
          .remove([path]);

        console.log(`Storage delete result for ${path}:`, { deleteData, deleteError });

        if (deleteError) {
          console.error(`❌ Storage delete failed for ${path}:`, deleteError);
          failedCount++;
          continue;
        }

        console.log(`✅ Successfully deleted from storage: ${path}`);

        // user_data_imports 삭제 (파일명 기준)
        const { error: dbError } = await supabase
          .from('user_data_imports')
          .delete()
          .eq('user_id', user.id)
          .eq('file_name', file.name);

        if (dbError) {
          console.warn(`⚠️ DB delete warning for ${file.name}:`, dbError);
        }

        deletedCount++;
      } catch (err) {
        console.error(`❌ Exception while deleting ${path}:`, err);
        failedCount++;
      }
    }

    console.log(`✅ Bulk delete complete: ${deletedCount} deleted, ${failedCount} failed`);

    if (failedCount > 0) {
      toast({
        title: "일부 파일 삭제 실패",
        description: `${deletedCount}개 성공, ${failedCount}개 실패`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "일괄 삭제 완료",
        description: `${deletedCount}개 파일이 삭제되었습니다`,
      });
    }

    if (storeId) {
      clearStoreDataCache(storeId);
    } else {
      clearStoreDataCache();
    }

    setSelectedFiles(new Set());
    await loadAllFiles();
    setLoading(false);
  };

  const handleDeleteAllData = async () => {
    if (!confirm("⚠️ 모든 데이터를 삭제하시겠습니까?\n\n삭제 항목:\n- 스토리지 파일 (CSV, 3D 모델)\n- 데이터베이스 엔티티 및 관계\n- 3D 씬\n- 업로드 기록\n\n이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let deletedFiles = 0;

      // 현재 사용자의 모든 파일 삭제
      for (const file of files) {
        try {
          await supabase.storage
            .from(file.bucket)
            .remove([file.path]);
          deletedFiles++;
        } catch (err) {
          console.error(`Failed to delete ${file.path}:`, err);
        }
      }

      // user_data_imports 삭제
      await (supabase as any)
        .from('user_data_imports')
        .delete()
        .eq('user_id', user.id);

      // graph_entities 및 relations 삭제
      const { data: entities } = await (supabase as any)
        .from('graph_entities')
        .select('id')
        .eq('user_id', user.id);

      if (entities && entities.length > 0) {
        const entityIds = entities.map((e: any) => e.id);
        
        await (supabase as any)
          .from('graph_relations')
          .delete()
          .or(`source_entity_id.in.(${entityIds.join(',')}),target_entity_id.in.(${entityIds.join(',')})`);
        
        await (supabase as any)
          .from('graph_entities')
          .delete()
          .in('id', entityIds);
      }

      // store_scenes 삭제
      await (supabase as any)
        .from('store_scenes')
        .delete()
        .eq('user_id', user.id);

      toast({
        title: "전체 데이터 초기화 완료",
        description: `${deletedFiles}개 파일 및 관련 데이터가 삭제되었습니다`,
      });

      if (storeId) {
        clearStoreDataCache(storeId);
      } else {
        clearAllCache();
      }

      setSelectedFiles(new Set());
      await loadAllFiles();
    } catch (error: any) {
      console.error('Delete all error:', error);
      toast({
        title: "초기화 실패",
        description: error.message || "데이터 초기화 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "다운로드 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleFileSelection = (path: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(path)) {
      newSelection.delete(path);
    } else {
      newSelection.add(path);
    }
    setSelectedFiles(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.path)));
    }
  };

  const analyzeModel = async (file: StorageFile) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-3d-model', {
        body: {
          fileName: file.name,
          fileUrl: file.url
        }
      });

      if (error) throw error;

      setPendingAnalysis(data);
      toast({
        title: "AI 분석 완료",
        description: "자동 매핑 제안을 검토해주세요",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "분석 실패",
        description: error instanceof Error ? error.message : "AI 분석에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const batchAutoMap3DModels = async () => {
    const modelFiles = filteredFiles.filter(f => is3DModel(f.name) && f.bucket === '3d-models');
    
    if (modelFiles.length === 0) {
      toast({
        title: "3D 모델 없음",
        description: "자동 매핑할 3D 모델 파일이 없습니다",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`${modelFiles.length}개의 3D 모델을 자동으로 AI 분석 및 온톨로지 매핑하시겠습니까?`)) {
      return;
    }

    setBatchProcessing(true);
    setProcessedCount(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("인증 필요");

      // auto-process-3d-models 호출
      const fileData = modelFiles.map(f => ({
        fileName: f.name,
        publicUrl: f.url
      }));

      toast({
        title: "일괄 처리 시작",
        description: `${modelFiles.length}개 파일 처리 중...`,
      });

      const { data, error } = await supabase.functions.invoke('auto-process-3d-models', {
        body: {
          files: fileData,
          storeId: storeId
        }
      });

      if (error) throw error;

      // 성공 카운트 계산 (fileName이 있으면 성공)
      const successCount = data?.results?.length || 0;
      const failCount = modelFiles.length - successCount;

      toast({
        title: "일괄 처리 완료",
        description: `성공: ${successCount}개, 실패: ${failCount}개`,
      });

      loadAllFiles();
    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "일괄 처리 실패",
        description: error instanceof Error ? error.message : "처리 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setBatchProcessing(false);
      setProcessedCount(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const is3DModel = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.glb') || fileName.toLowerCase().endsWith('.gltf');
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>스토리지 파일 관리</CardTitle>
        <CardDescription>
          모든 업로드된 파일을 한 곳에서 관리하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI 분석 결과 */}
        {pendingAnalysis && (
          <AutoModelMapper
            analysis={pendingAnalysis}
            onAccept={() => {
              setPendingAnalysis(null);
              loadAllFiles();
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
        {/* 검색 및 액션 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="파일명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllFiles}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={batchAutoMap3DModels}
            disabled={batchProcessing || loading}
          >
            {batchProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 자동 매핑 ({processedCount}/{filteredFiles.filter(f => is3DModel(f.name)).length})
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                3D 일괄 자동 매핑
              </>
            )}
          </Button>
          {selectedFiles.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제 ({selectedFiles.size})
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAllData}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            전체 초기화
          </Button>
        </div>

        {/* 통계 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>총 {filteredFiles.length}개 파일 · {formatFileSize(totalSize)}</span>
        </div>

        {/* 파일 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? '검색 결과가 없습니다' : '업로드된 파일이 없습니다'}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedFiles.size === filteredFiles.length}
                      onCheckedChange={toggleAllSelection}
                    />
                  </TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead>매장</TableHead>
                  <TableHead>버킷</TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>업로드 일시</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.path}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.has(file.path)}
                        onCheckedChange={() => toggleFileSelection(file.path)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-primary" />
                        <span className="truncate max-w-xs" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded font-medium">
                        {file.storeName || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {file.bucket}
                      </span>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      {new Date(file.created_at).toLocaleString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {is3DModel(file.name) && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="3D 미리보기"
                                >
                                  <Eye className="w-4 h-4" />
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
                              onClick={() => analyzeModel(file)}
                              title="AI 자동 매핑"
                              disabled={analyzing}
                            >
                              <Sparkles className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.url, file.name)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.bucket, file.path, file.name)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
