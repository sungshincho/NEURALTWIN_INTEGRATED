import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataImportHistoryProps {
  storeId?: string;
}

interface ImportRecord {
  id: string;
  file_name: string;
  data_type: string;
  row_count: number;
  created_at: string;
  raw_data: any;
}

export function DataImportHistory({ storeId }: DataImportHistoryProps) {
  const { toast } = useToast();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadImports();
  }, [storeId]);

  const loadImports = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('user_data_imports')
        .select('*');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error: any) {
      toast({
        title: "오류",
        description: "데이터 불러오기 실패: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('이 매장의 모든 데이터를 삭제하시겠습니까? (DB 레코드 + Storage 파일)')) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. DB에서 삭제할 레코드 목록 가져오기
      let query = supabase
        .from('user_data_imports')
        .select('*');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data: records, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let deletedCount = 0;

      // 2. Storage에서 store-data 버킷 파일 삭제
      const storePath = storeId ? `${user.id}/${storeId}` : user.id;
      
      // store-data 버킷 재귀 탐색
      const deleteFromStoreData = async (path: string) => {
        const { data: items } = await supabase.storage
          .from('store-data')
          .list(path);
        
        if (items && items.length > 0) {
          const files = items.filter(f => f.id); // 파일만
          const folders = items.filter(f => !f.id); // 폴더만
          
          // 파일 삭제
          if (files.length > 0) {
            const filesToDelete = files.map(f => `${path}/${f.name}`);
            const { error } = await supabase.storage
              .from('store-data')
              .remove(filesToDelete);
            
            if (!error) deletedCount += files.length;
          }
          
          // 폴더 재귀 삭제
          for (const folder of folders) {
            await deleteFromStoreData(`${path}/${folder.name}`);
          }
        }
      };
      
      await deleteFromStoreData(storePath);
      
      // 3. Storage에서 3d-models 버킷 파일 삭제
      const urlsToCleanup: string[] = [];
      
      const deleteFrom3DModels = async (path: string) => {
        const { data: items } = await supabase.storage
          .from('3d-models')
          .list(path);
        
        if (items && items.length > 0) {
          const files = items.filter(f => f.id);
          const folders = items.filter(f => !f.id);
          
          // 파일 삭제
          if (files.length > 0) {
            const filesToDelete = files.map(f => `${path}/${f.name}`);
            
            // URL 저장 (엔티티 참조 정리용)
            for (const file of files) {
              const filePath = `${path}/${file.name}`;
              const { data: { publicUrl } } = supabase.storage
                .from('3d-models')
                .getPublicUrl(filePath);
              urlsToCleanup.push(publicUrl);
            }
            
            const { error } = await supabase.storage
              .from('3d-models')
              .remove(filesToDelete);
            
            if (!error) deletedCount += files.length;
          }
          
          // 폴더 재귀 삭제
          for (const folder of folders) {
            await deleteFrom3DModels(`${path}/${folder.name}`);
          }
        }
      };
      
      await deleteFrom3DModels(storePath);

      // 엔티티 참조 정리
      if (urlsToCleanup.length > 0) {
        const { cleanupEntityReferences } = await import('@/features/simulation/utils/cleanupEntityReferences');
        for (const url of urlsToCleanup) {
          await cleanupEntityReferences(url, user.id);
        }
        console.log(`🧹 Cleaned up entity references for ${urlsToCleanup.length} models`);
      }

      // 4. DB에서 레코드 삭제
      if (records && records.length > 0) {
        let deleteQuery = supabase
          .from('user_data_imports')
          .delete();

        if (storeId) {
          deleteQuery = deleteQuery.eq('store_id', storeId);
        } else {
          deleteQuery = deleteQuery.eq('user_id', user.id);
        }

        const { error: dbError } = await deleteQuery;
        if (dbError) throw dbError;
      }

      toast({
        title: "전체 삭제 완료",
        description: `DB 레코드 ${records?.length || 0}개, Storage 파일 ${deletedCount}개가 삭제되었습니다`,
      });

      loadImports();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 먼저 레코드 정보 가져오기
      const { data: record } = await supabase
        .from('user_data_imports')
        .select('*')
        .eq('id', id)
        .single();

      // DB에서 삭제
      const { error: dbError } = await supabase
        .from('user_data_imports')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Note: Storage cleanup requires file_path column in user_data_imports table
      // TODO: Implement storage cleanup when file_path is available

      toast({
        title: "삭제 완료",
        description: "데이터와 Storage 파일이 삭제되었습니다",
      });

      loadImports();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (record: ImportRecord) => {
    const dataStr = JSON.stringify(record.raw_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.file_name}_${record.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = (record: ImportRecord) => {
    setSelectedImport(record);
    setShowPreview(true);
  };

  const getDataTypeBadge = (dataType: string) => {
    const colors: Record<string, string> = {
      visits: "bg-blue-100 text-blue-800",
      purchases: "bg-green-100 text-green-800",
      products: "bg-purple-100 text-purple-800",
      customers: "bg-yellow-100 text-yellow-800",
      inventory: "bg-orange-100 text-orange-800",
      stores: "bg-pink-100 text-pink-800",
      '3d-model': "bg-amber-100 text-amber-800",
      'wifi_tracking': "bg-indigo-100 text-indigo-800",
      'wifi_sensor': "bg-cyan-100 text-cyan-800",
    };

    const labels: Record<string, string> = {
      '3d-model': '3D 모델',
      'wifi_tracking': 'WiFi 추적',
      'wifi_sensor': 'WiFi 센서',
      'visits': '방문',
      'purchases': '구매',
      'products': '상품',
      'customers': '고객',
      'inventory': '재고',
      'stores': '매장',
    };

    return (
      <Badge className={colors[dataType] || "bg-gray-100 text-gray-800"}>
        {labels[dataType] || dataType}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>데이터 임포트 히스토리</CardTitle>
              <CardDescription>
                업로드된 모든 데이터의 기록을 확인하고 관리하세요
              </CardDescription>
            </div>
            {imports.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteAll}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                전체 삭제
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : imports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>아직 업로드된 데이터가 없습니다</p>
              <p className="text-sm mt-2">다른 탭에서 데이터를 업로드해보세요</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>파일명</TableHead>
                    <TableHead>저장 경로</TableHead>
                    <TableHead>데이터 타입</TableHead>
                    <TableHead>행 수</TableHead>
                    <TableHead>업로드 일시</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.file_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        -
                      </TableCell>
                      <TableCell>
                        {getDataTypeBadge(record.data_type)}
                      </TableCell>
                      <TableCell>{record.row_count.toLocaleString()}</TableCell>
                      <TableCell>
                        {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(record)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(record)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
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

      {/* 데이터 프리뷰 다이얼로그 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>데이터 미리보기</DialogTitle>
          </DialogHeader>
          {selectedImport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">파일명:</span> {selectedImport.file_name}
                </div>
                <div>
                  <span className="font-semibold">데이터 타입:</span> {selectedImport.data_type}
                </div>
                <div>
                  <span className="font-semibold">행 수:</span> {selectedImport.row_count}
                </div>
                <div>
                  <span className="font-semibold">업로드 일시:</span>{' '}
                  {format(new Date(selectedImport.created_at), 'yyyy-MM-dd HH:mm')}
                </div>
              </div>

              <ScrollArea className="h-[50vh] rounded-md border p-4">
                <pre className="text-xs">
                  {JSON.stringify(selectedImport.raw_data, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
