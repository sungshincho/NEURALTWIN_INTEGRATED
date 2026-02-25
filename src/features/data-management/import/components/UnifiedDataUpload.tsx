import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { Upload, FileSpreadsheet, Box, Wifi, Loader2, CheckCircle2, XCircle, AlertCircle, Pause, Play, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import { useSchemaMetadata } from "@/hooks/useSchemaMetadata";
import { DataValidationPreview } from "./DataValidationPreview";

interface UnifiedDataUploadProps {
  storeId?: string;
  onUploadSuccess?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  type: 'csv' | 'excel' | '3d-model' | 'wifi' | 'json' | 'unknown';
  status: 'pending' | 'uploading' | 'processing' | 'mapping' | 'success' | 'error' | 'cancelled' | 'paused';
  progress: number;
  error?: string;
  mappingResult?: any;
  isRestored?: boolean; // localStorage에서 복원된 항목
}

interface StoredUploadFile {
  id: string;
  fileName: string;
  fileSize: number;
  type: UploadFile['type'];
  status: UploadFile['status'];
  progress: number;
  error?: string;
  mappingResult?: any;
  isRestored?: boolean;
}

const STORAGE_KEY_PREFIX = 'upload-history-';

export function UnifiedDataUpload({ storeId, onUploadSuccess }: UnifiedDataUploadProps) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const cancelFlagsRef = useRef<Map<string, boolean>>(new Map());
  
  // 스키마 메타데이터 로드
  const { data: schema, isLoading: isLoadingSchema } = useSchemaMetadata();
  
  // 검증 결과 상태
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // localStorage에서 업로드 내역 복원
  useEffect(() => {
    if (!storeId) return;
    
    try {
      const storageKey = STORAGE_KEY_PREFIX + storeId;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const storedFiles: StoredUploadFile[] = JSON.parse(storedData);
        
        // File 객체는 복원 불가능하므로 빈 File 객체로 대체
        const restoredFiles: UploadFile[] = storedFiles.map(stored => {
          // 진행 중이던 업로드는 상태 그대로 유지 (백그라운드 진행 추적)
          let status = stored.status;
          
          // 빈 File 객체 생성 (UI 표시용)
          const dummyFile = new File([], stored.fileName, { type: 'application/octet-stream' });
          Object.defineProperty(dummyFile, 'size', { value: stored.fileSize });
          
          return {
            file: dummyFile,
            id: stored.id,
            type: stored.type,
            status,
            progress: stored.progress,
            error: stored.error,
            mappingResult: stored.mappingResult,
            isRestored: true, // 복원된 항목 표시
          };
        });
        
        setFiles(restoredFiles);
        console.log(`📋 Restored ${restoredFiles.length} upload records from localStorage`);
        
        // 진행 중인 업로드의 실제 상태 확인
        checkBackgroundUploads(restoredFiles);
      }
    } catch (error) {
      console.error('Failed to restore upload history:', error);
    }
  }, [storeId]);

  // files 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (!storeId || files.length === 0) return;
    
    try {
      const storageKey = STORAGE_KEY_PREFIX + storeId;
      
      // File 객체를 제외한 정보만 저장
      const filesToStore: StoredUploadFile[] = files.map(file => ({
        id: file.id,
        fileName: file.file.name,
        fileSize: file.file.size,
        type: file.type,
        status: file.status,
        progress: file.progress,
        error: file.error,
        mappingResult: file.mappingResult,
      }));
      
      localStorage.setItem(storageKey, JSON.stringify(filesToStore));
    } catch (error) {
      console.error('Failed to save upload history:', error);
    }
  }, [files, storeId]);

  // 백그라운드 업로드 상태 확인
  const checkBackgroundUploads = async (restoredFiles: UploadFile[]) => {
    const processingFiles = restoredFiles.filter(f => 
      ['uploading', 'processing', 'mapping'].includes(f.status)
    );
    
    if (processingFiles.length === 0) return;
    
    console.log(`🔍 Checking ${processingFiles.length} background uploads...`);
    
    for (const file of processingFiles) {
      try {
        // user_data_imports 테이블에서 실제 상태 확인
        const { data: importRecord } = await supabase
          .from('user_data_imports')
          .select('data_type, raw_data')
          .eq('file_name', file.file.name)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (importRecord) {
          const dataType = importRecord.data_type;
          
          if (dataType === 'completed') {
            // 완료됨
            const rawData = importRecord.raw_data as any;
            updateFileStatus(file.id, 'success', undefined, 100, rawData?.pipeline_result);
            console.log(`✅ Background upload completed: ${file.file.name}`);
          } else if (dataType === 'failed') {
            // 실패
            const rawData = importRecord.raw_data as any;
            const errorMsg = rawData?.error || '백그라운드 처리 실패';
            updateFileStatus(file.id, 'error', errorMsg);
            console.log(`❌ Background upload failed: ${file.file.name}`);
          } else if (dataType === 'processing_pipeline') {
            // 여전히 진행 중
            console.log(`⏳ Background upload still processing: ${file.file.name}`);
            // 상태 유지, 5초 후 다시 확인
            setTimeout(() => checkBackgroundUploads([file]), 5000);
          }
        }
      } catch (error) {
        console.error(`Failed to check background upload for ${file.file.name}:`, error);
      }
    }
  };

  // 파일 타입 자동 감지
  const detectFileType = (file: File): UploadFile['type'] => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') return 'csv';
    if (ext === 'xlsx' || ext === 'xls') return 'excel';
    if (ext === 'glb' || ext === 'gltf') return '3d-model';
    if (file.name.includes('wifi') || file.name.includes('tracking') || file.name.includes('sensor')) {
      return 'wifi';
    }
    if (ext === 'json') {
      if (file.name.includes('wifi')) return 'wifi';
      if (file.name.includes('metadata') || file.name.includes('3d')) return 'json';
      return 'json';
    }
    
    return 'unknown';
  };

  // 파일 선택/드롭 처리
  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const uploadFiles: UploadFile[] = fileArray.map(file => {
      const fileName = file.name.toLowerCase();
      
      // 파생 데이터 파일 감지 및 경고
      if (fileName.includes('dashboard_kpi') || fileName.includes('ai_recommendation')) {
        toast({
          title: '⚠️ 자동 생성 데이터',
          description: `${file.name}는 백엔드에서 자동 생성되는 파일입니다. 원천 데이터를 업로드하면 자동으로 집계됩니다.`,
          variant: 'destructive',
        });
      }
      
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        type: detectFileType(file),
        status: 'pending' as const,
        progress: 0,
      };
    });

    setFiles(prev => [...prev, ...uploadFiles]);
    
    // 파일 추가 후 자동 검증 실행
    if (schema && uploadFiles.length > 0) {
      validateFiles(uploadFiles);
    }
  }, [toast, storeId, schema]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // CSV/Excel/JSON 파싱
  const parseDataFile = async (file: File): Promise<any[]> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(firstSheet);
    } else if (ext === 'json') {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      // JSON이 배열이면 그대로, 객체면 배열로 감싸기
      return Array.isArray(jsonData) ? jsonData : [jsonData];
    }
    
    return [];
  };

  // 자동 매핑 실행
  const runAutoMapping = async (uploadFile: UploadFile, rawData: any[], filePath?: string) => {
    if (rawData.length === 0) return null;

    try {
      const columns = Object.keys(rawData[0]);
      const dataSample = rawData.slice(0, 5);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증되지 않은 사용자');

      const { data: importRecord } = await supabase
        .from('user_data_imports')
        .insert({
          file_name: uploadFile.file.name,
          data_type: 'auto-detected',
          raw_data: {
            data: rawData,
            filePath: filePath || null // raw_data 내부에 저장
          } as any,
          row_count: rawData.length,
          store_id: storeId || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (!importRecord) return null;

      const { data: mappingResult, error: mappingError } = await supabase.functions.invoke('auto-map-etl', {
        body: {
          import_id: importRecord.id,
          data_sample: dataSample,
          columns: columns,
        }
      });

      if (mappingError) throw mappingError;
      return { importId: importRecord.id, ...mappingResult };
    } catch (error) {
      console.error('Auto mapping error:', error);
      return null;
    }
  };

  // 배치 검증 실행
  const validateFiles = async (filesToValidate: UploadFile[]) => {
    if (!schema || filesToValidate.length === 0) return;
    
    // 데이터 파일만 검증 (CSV, Excel만 해당)
    const dataFilesToValidate = filesToValidate.filter(f => 
      f.type === 'csv' || f.type === 'excel'
    );
    
    if (dataFilesToValidate.length === 0) {
      console.log('No data files to validate');
      return;
    }
    
    setIsValidating(true);
    try {
      // 파일별로 데이터 파싱 및 테이블명 추출
      const filesData = await Promise.all(
        dataFilesToValidate.map(async (file) => {
          try {
            const rawData = await parseDataFile(file.file);
            const tableName = inferTableName(file.file.name);
            const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
            const sampleRows = rawData.slice(0, 5);
            
            return {
              fileName: file.file.name,
              tableName,
              headers,
              sampleRows
            };
          } catch (error) {
            console.error(`Error parsing file ${file.file.name}:`, error);
            return null;
          }
        })
      );
      
      const validFilesData = filesData.filter(f => f !== null);
      
      if (validFilesData.length === 0) {
        toast({
          title: "검증 실패",
          description: "파일을 파싱할 수 없습니다",
          variant: "destructive"
        });
        return;
      }
      
      // Edge Function 호출
      const { data, error } = await supabase.functions.invoke('validate-batch-files', {
        body: {
          files: validFilesData,
          schema: schema
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        setValidationResults(data);
        toast({
          title: "검증 완료",
          description: `${data.summary.valid}개 파일 정상, ${data.summary.invalid}개 파일 오류 발견`
        });
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "검증 오류",
        description: error.message || "파일 검증 중 오류가 발생했습니다",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  // 파일명에서 테이블명 추론 (개선된 버전)
  const inferTableName = (fileName: string): string => {
    const name = fileName.toLowerCase()
      .replace(/\.(csv|xlsx?|json)$/i, '')
      .replace(/[-\s]/g, '_'); // 하이픈과 공백을 언더스코어로 변환
    
    // 포괄적인 테이블명 매핑 (우선순위 순)
    const tableMap: Record<string, string> = {
      // 고객 관련
      'customer': 'customers',
      'customers': 'customers',
      '고객': 'customers',
      
      // 상품 관련
      'product': 'products',
      'products': 'products',
      '상품': 'products',
      '제품': 'products',
      
      // 구매 관련
      'purchase': 'purchases',
      'purchases': 'purchases',
      'order': 'purchases',
      'orders': 'purchases',
      '구매': 'purchases',
      '주문': 'purchases',
      
      // 방문 관련
      'visit': 'visits',
      'visits': 'visits',
      '방문': 'visits',
      
      // 직원 관련
      'staff': 'staff',
      'employee': 'staff',
      'employees': 'staff',
      '직원': 'staff',
      
      // 매장 관련
      'store': 'stores',
      'stores': 'stores',
      'shop': 'stores',
      '매장': 'stores',
      
      // WiFi 관련
      'wifi_tracking': 'wifi_tracking',
      'wifi_track': 'wifi_tracking',
      'wifi': 'wifi_tracking',
      
      // Zone 관련
      'wifi_zone': 'wifi_zones',
      'wifi_zones': 'wifi_zones',
      'zone': 'wifi_zones',
      'zones': 'wifi_zones',
      'sensor': 'wifi_zones'
    };
    
    // 정확히 매칭되는 키 우선 검색
    if (tableMap[name]) {
      return tableMap[name];
    }
    
    // 부분 매칭 검색 (긴 키부터 검색하여 더 정확한 매칭)
    const sortedKeys = Object.keys(tableMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (name.includes(key)) {
        return tableMap[key];
      }
    }
    
    // 매칭 실패 시 원래 이름 반환
    return name;
  };

  // 파일명 sanitize (특수문자 제거)
  const sanitizeFileName = (fileName: string): string => {
    // 확장자 분리
    const lastDot = fileName.lastIndexOf('.');
    const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    const ext = lastDot > 0 ? fileName.substring(lastDot) : '';
    
    // 안전한 문자만 허용 (영문, 숫자, 언더스코어, 하이픈, 점)
    // 한글, 공백, 괄호 등을 언더스코어로 변환
    const safeName = name
      .replace(/[^\w\-\.]/g, '_')  // 특수문자를 _로 변환
      .replace(/_{2,}/g, '_')       // 연속된 _를 하나로
      .replace(/^_+|_+$/g, '');     // 앞뒤 _제거
    
    return safeName + ext;
  };

  // 업로드 취소
  const cancelUpload = (fileId: string) => {
    cancelFlagsRef.current.set(fileId, true);
    updateFileStatus(fileId, 'cancelled', '사용자가 취소함');
    toast({
      title: "업로드 취소됨",
      description: "파일 업로드가 취소되었습니다",
    });
  };

  // 전체 일시중지
  const pauseAll = () => {
    setIsPaused(true);
    files.forEach(file => {
      if (file.status === 'uploading' || file.status === 'processing' || file.status === 'mapping') {
        updateFileStatus(file.id, 'paused');
      }
    });
    toast({
      title: "업로드 일시중지",
      description: "모든 업로드가 일시중지되었습니다",
    });
  };

  // 전체 재개
  const resumeAll = () => {
    setIsPaused(false);
    const pausedFiles = files.filter(f => f.status === 'paused');
    pausedFiles.forEach(file => {
      updateFileStatus(file.id, 'pending');
    });
    toast({
      title: "업로드 재개",
      description: "일시중지된 업로드를 재개합니다",
    });
    // 재개 후 자동으로 업로드 시작
    setTimeout(() => {
      pausedFiles.forEach(file => uploadFile(file));
    }, 100);
  };

  // 모든 업로드 취소
  const cancelAll = () => {
    files.forEach(file => {
      if (file.status === 'pending' || file.status === 'uploading' || 
          file.status === 'processing' || file.status === 'mapping' || file.status === 'paused') {
        cancelFlagsRef.current.set(file.id, true);
        updateFileStatus(file.id, 'cancelled', '전체 취소됨');
      }
    });
    setIsPaused(false);
    toast({
      title: "전체 취소됨",
      description: "모든 업로드가 취소되었습니다",
      variant: "destructive",
    });
  };

  // 개별 파일 업로드 처리
  const uploadFile = async (uploadFile: UploadFile) => {
    if (!storeId) {
      updateFileStatus(uploadFile.id, 'error', 'Store ID가 필요합니다');
      return;
    }

    // 취소 플래그 초기화
    cancelFlagsRef.current.set(uploadFile.id, false);

    try {
      // 일시중지 체크
      const checkPauseAndCancel = () => {
        if (cancelFlagsRef.current.get(uploadFile.id)) {
          throw new Error('CANCELLED');
        }
        if (isPaused) {
          updateFileStatus(uploadFile.id, 'paused');
          throw new Error('PAUSED');
        }
      };
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증되지 않은 사용자');

      checkPauseAndCancel();
      updateFileStatus(uploadFile.id, 'uploading', undefined, 10);

      // 파일명 sanitize
      const safeFileName = sanitizeFileName(uploadFile.file.name);

      // 파일 타입별 업로드
      if (uploadFile.type === '3d-model') {
        // === 완전 자동화 3D 모델 파이프라인 ===
        checkPauseAndCancel();
        const filePath = `${user.id}/${storeId}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('3d-models')
          .upload(filePath, uploadFile.file, { upsert: true });

        if (uploadError) throw uploadError;
        checkPauseAndCancel();
        
        // 업로드된 URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('3d-models')
          .getPublicUrl(filePath);
        
        // Step 1: 3D 모델 AI 분석 및 엔티티 타입 자동 생성
        checkPauseAndCancel();
        updateFileStatus(uploadFile.id, 'processing', 'AI 분석 중...', 40);
        
        try {
          checkPauseAndCancel();
          const { data: processResult, error: processError } = await supabase.functions.invoke('auto-process-3d-models', {
            body: {
              files: [{
                fileName: safeFileName,
                publicUrl: publicUrl
              }],
              storeId: storeId
            }
          });
          
          if (processError) {
            console.error('❌ Edge Function invoke error:', processError);
            throw new Error(`Edge Function 호출 실패: ${processError.message || JSON.stringify(processError)}`);
          }
          
          if (!processResult) {
            throw new Error('Edge Function에서 응답이 없습니다');
          }
          
          if (processResult?.success && processResult.results?.[0]) {
            const result = processResult.results[0];
            
            // Step 2: user_data_imports에 기록 추가
            updateFileStatus(uploadFile.id, 'processing', '데이터 기록 중...', 60);
            await supabase.from('user_data_imports').insert({
              user_id: user.id,
              store_id: storeId,
              file_name: safeFileName,
              data_type: '3d-model',
              row_count: 1,
              raw_data: {
                entityType: result?.entityType,
                instanceLabel: result?.instanceLabel,
                position: result?.position,
                publicUrl: publicUrl,
                filePath: filePath // raw_data 내부에 저장
              }
            });
            
            // Step 3: 기존 엔티티에 3D 모델 자동 매핑
            updateFileStatus(uploadFile.id, 'processing', '기존 엔티티에 매핑 중...', 75);
            
            // AI가 생성한 엔티티 타입 이름으로 기존 엔티티 찾기
            const { data: entityType } = await supabase
              .from('ontology_entity_types')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', result.entityType)
              .single();

            let mappedCount = 0;
            if (entityType) {
              // 해당 타입의 엔티티 중 3D 모델이 없는 엔티티 찾기 (최대 10개)
              const { data: entitiesToMap } = await supabase
                .from('graph_entities')
                .select('id')
                .eq('user_id', user.id)
                .eq('store_id', storeId)
                .eq('entity_type_id', entityType.id)
                .is('model_3d_position', null)
                .limit(10);

              if (entitiesToMap && entitiesToMap.length > 0) {
                console.log(`🔗 Auto-mapping 3D model to ${entitiesToMap.length} entities...`);
                
                // 그리드 형태로 자동 배치
                const updates = entitiesToMap.map((entity, idx) => 
                  supabase
                    .from('graph_entities')
                    .update({
                      model_3d_position: { x: idx * 2, y: 0, z: 0 },
                      model_3d_scale: { x: 1, y: 1, z: 1 },
                      model_3d_rotation: { x: 0, y: 0, z: 0 }
                    })
                    .eq('id', entity.id)
                );
                
                await Promise.all(updates);
                mappedCount = entitiesToMap.length;
                console.log(`✅ 3D models auto-mapped to ${mappedCount} entities`);
              }
            }
            
            updateFileStatus(uploadFile.id, 'success', undefined, 100, {
              autoMapped: true,
              entityType: result?.entityType || '자동 생성됨',
              instanceLabel: result?.instanceLabel,
              position: result?.position,
              entitiesMapped: mappedCount,
              linkedToOntology: true
            });
          } else {
            throw new Error(processResult?.error || '자동 처리 실패');
          }
        } catch (err: any) {
          console.error('❌ 3D model processing failed:', err);
          updateFileStatus(uploadFile.id, 'error', err.message || '자동 처리 실패');
        }
        
      } else if (uploadFile.type === 'csv' || uploadFile.type === 'excel') {
        // === 완전 자동화 CSV/Excel 파이프라인 ===
        checkPauseAndCancel();
        updateFileStatus(uploadFile.id, 'processing', '파일 업로드 중...', 15);
        
        const filePath = `${user.id}/${storeId}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('store-data')
          .upload(filePath, uploadFile.file, { upsert: true });

        if (uploadError) throw uploadError;
        checkPauseAndCancel();
        
        // Step 1: 데이터 샘플만 파싱 (전체 파일은 Edge Function에서 처리)
        checkPauseAndCancel();
        updateFileStatus(uploadFile.id, 'processing', '데이터 샘플 추출 중...', 25);
        const sampleData = await parseDataFile(uploadFile.file);
        const dataSample = sampleData.slice(0, 5); // 처음 5개 행만
        
        // Step 2: user_data_imports에 메타데이터만 저장
        checkPauseAndCancel();
        updateFileStatus(uploadFile.id, 'processing', '메타데이터 저장 중...', 35);
        const { data: importRecord, error: importError } = await supabase
          .from('user_data_imports')
          .insert({
            file_name: safeFileName,
            data_type: 'auto-detected',
            raw_data: {
              sample: dataSample,
              filePath: filePath // raw_data 내부에 저장
            } as any,
            row_count: sampleData.length,
            store_id: storeId || null,
            user_id: user.id,
          })
          .select()
          .single();

        if (importError || !importRecord) {
          throw new Error(`Import record creation failed: ${importError?.message}`);
        }

        // === 🤖 AI 기반 완전 자동화 파이프라인 ===
        checkPauseAndCancel();
        console.log('🚀 Starting AI-powered automated pipeline...');
        updateFileStatus(uploadFile.id, 'processing', 'AI가 데이터를 분석하고 있습니다...', 45);
        
        try {
          checkPauseAndCancel();
          // 통합 파이프라인 한 번 호출로 모든 작업 자동 처리
          const { data: pipelineResult, error: pipelineError } = await supabase.functions.invoke('integrated-data-pipeline', {
            body: {
              import_id: importRecord.id,
              store_id: storeId,
              auto_fix: true,
              skip_validation: false,
              filePath: filePath,
              fileType: uploadFile.type,
            },
          });

          if (pipelineError) {
            throw new Error(`Pipeline failed: ${pipelineError.message}`);
          }

          // 백그라운드 처리 감지
          if (pipelineResult?.processing_in_background) {
            console.log('⏰ Large dataset - processing in background');
            updateFileStatus(uploadFile.id, 'processing', '대용량 데이터 백그라운드 처리 중...', 50);
            
            // 폴링으로 상태 확인 (최대 5분)
            const maxAttempts = 60; // 60 x 5초 = 5분
            let attempt = 0;
            
            const pollStatus = async (): Promise<boolean> => {
              attempt++;
              checkPauseAndCancel();
              
              const { data: importStatus } = await supabase
                .from('user_data_imports')
                .select('data_type, raw_data')
                .eq('id', importRecord.id)
                .single();
              
              if (importStatus?.data_type === 'completed') {
                const result = (importStatus.raw_data as any)?.pipeline_result;
                if (result) {
                  console.log('✅ Background processing completed:', result);
                  
                  updateFileStatus(uploadFile.id, 'success', 'AI 완전 자동화 완료!', 100, {
                    validation: result.validation || {},
                    mapping: result.mapping || {},
                    etl: result.etl || {},
                    dataQualityScore: result.validation?.data_quality_score,
                    entitiesCreated: result.etl?.entities_created || 0,
                    entitiesReused: result.etl?.entities_reused || 0,
                    relationsCreated: result.etl?.relations_created || 0,
                    aiPowered: true,
                    fullyAutomated: true,
                    backgroundProcessed: true,
                    filePath
                  });
                  
                  toast({ 
                    title: `✅ ${safeFileName} 완전 자동화 완료!`,
                    description: `대용량 데이터 처리 완료` 
                  });
                  
                  return true;
                }
              } else if (importStatus?.data_type === 'failed') {
                const error = (importStatus.raw_data as any)?.error;
                throw new Error(`Background processing failed: ${error || 'Unknown error'}`);
              }
              
              // 아직 처리 중
              if (attempt >= maxAttempts) {
                throw new Error('Background processing timeout (5 minutes)');
              }
              
              updateFileStatus(uploadFile.id, 'processing', `백그라운드 처리 중... (${attempt}/${maxAttempts})`, 50 + (attempt / maxAttempts) * 35);
              
              // 5초 대기 후 재시도
              await new Promise(resolve => setTimeout(resolve, 5000));
              return await pollStatus();
            };
            
            await pollStatus();
            
            // 백그라운드 KPI 작업
            (async () => {
              try {
                console.log('📊 Background: KPI aggregation...');
                await supabase.functions.invoke('aggregate-all-kpis', {
                  body: { store_id: storeId, user_id: user.id },
                });
                
                console.log('🤖 Background: AI recommendations...');
                await supabase.functions.invoke('generate-ai-recommendations', {
                  body: { store_id: storeId },
                });
              } catch (bgError) {
                console.warn('⚠️ Background tasks failed (non-critical):', bgError);
              }
            })();
            
            return; // 여기서 종료
          }

          if (!pipelineResult?.success) {
            throw new Error(pipelineResult?.error || 'Pipeline failed');
          }

          console.log('✅ AI Pipeline completed:', pipelineResult);
          
          const validation = pipelineResult.validation || {};
          const mapping = pipelineResult.mapping || {};
          const etl = pipelineResult.etl || {};

          updateFileStatus(uploadFile.id, 'processing', 'KPI 집계 및 AI 분석 중...', 85);
          
          // Step 6: 백그라운드 작업 (KPI 집계 + AI 추천)
          (async () => {
            try {
              console.log('📊 Background: KPI aggregation...');
              await supabase.functions.invoke('aggregate-all-kpis', {
                body: { store_id: storeId, user_id: user.id },
              });
              
              console.log('🤖 Background: AI recommendations...');
              await supabase.functions.invoke('generate-ai-recommendations', {
                body: { store_id: storeId },
              });
              
              console.log('✅ Background tasks completed');
            } catch (bgError) {
              console.warn('⚠️ Background processing failed (non-critical):', bgError);
            }
          })();
          
          updateFileStatus(uploadFile.id, 'success', 'AI 완전 자동화 완료!', 100, {
            validation,
            mapping,
            etl,
            dataQualityScore: validation.data_quality_score,
            entitiesCreated: etl.entities_created || 0,
            entitiesReused: etl.entities_reused || 0,
            relationsCreated: etl.relations_created || 0,
            aiPowered: true,
            fullyAutomated: true,
            filePath
          });
          
          console.log('🎉 AI 완전 자동화 파이프라인 완료!');
          toast({ 
            title: `✅ ${safeFileName} 완전 자동화 완료!`,
            description: `데이터 품질: ${validation.data_quality_score}/100, 엔티티: ${etl.entities_created}, 관계: ${etl.relations_created}` 
          });
          
          // Activity logging
          logActivity('data_upload', {
            file_name: safeFileName,
            file_type: uploadFile.type,
            data_quality_score: validation.data_quality_score,
            entities_created: etl.entities_created,
            relations_created: etl.relations_created,
            store_id: storeId,
            ai_powered: true,
            timestamp: new Date().toISOString()
          });
          
        } catch (pipelineError: any) {
          console.error('❌ AI Pipeline error:', pipelineError);
          updateFileStatus(uploadFile.id, 'error', pipelineError.message || 'AI 자동화 실패');
          
          toast({
            title: '❌ 자동화 처리 실패',
            description: pipelineError.message,
            variant: 'destructive'
          });
        }
        
      } else if (uploadFile.type === 'wifi') {
        // WiFi 데이터는 store-data 버킷에 업로드
        const filePath = `${user.id}/${storeId}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('store-data')
          .upload(filePath, uploadFile.file, { upsert: true });

        if (uploadError) throw uploadError;
        
        updateFileStatus(uploadFile.id, 'processing', undefined, 50);
        
        // WiFi 데이터 자동 처리
        const { data: processResult, error: processError } = await supabase.functions.invoke('process-wifi-data', {
          body: {
            filePath,
            storeId
          }
        });

        if (processError) throw processError;

        if (processResult?.success) {
          updateFileStatus(uploadFile.id, 'success', undefined, 100, {
            processedCount: processResult.processedCount,
            metadataGenerated: !!processResult.metadata
          });
          
          // Activity logging
          logActivity('data_upload', {
            file_name: safeFileName,
            file_type: 'wifi',
            processed_count: processResult.processedCount,
            store_id: storeId,
            timestamp: new Date().toISOString()
          });
        } else {
          throw new Error(processResult?.error || 'WiFi 데이터 처리 실패');
        }
        
      } else if (uploadFile.type === 'json') {
        // JSON 메타데이터는 store-data 버킷에 업로드
        updateFileStatus(uploadFile.id, 'processing', '파일 업로드 중...', 20);
        
        const filePath = `${user.id}/${storeId}/metadata/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('store-data')
          .upload(filePath, uploadFile.file, { upsert: true });

        if (uploadError) throw uploadError;
        
        updateFileStatus(uploadFile.id, 'processing', '데이터 파싱 중...', 50);
        const rawData = await parseDataFile(uploadFile.file);
        
        // user_data_imports에 기록
        const { data: importData, error: importError } = await supabase
          .from('user_data_imports')
          .insert({
            user_id: user.id,
            store_id: storeId,
            file_name: safeFileName,
            data_type: 'metadata',
            row_count: rawData.length,
            raw_data: {
              data: rawData,
              filePath: filePath // raw_data 내부에 저장
            }
          })
          .select()
          .single();

        if (importError) throw importError;
        
        updateFileStatus(uploadFile.id, 'success', undefined, 100, {
          importId: importData.id,
          recordCount: rawData.length,
          filePath
        });
        
        // Activity logging
        logActivity('data_upload', {
          file_name: safeFileName,
          file_type: 'json',
          record_count: rawData.length,
          store_id: storeId,
          timestamp: new Date().toISOString()
        });
        
      } else {
        throw new Error('지원하지 않는 파일 타입');
      }

      toast({
        title: "업로드 완료",
        description: `${uploadFile.file.name}이 성공적으로 업로드되었습니다`,
      });

    } catch (error: any) {
      // 취소나 일시중지는 에러로 표시하지 않음
      if (error.message === 'CANCELLED') {
        // 이미 cancelled 상태로 설정됨
        return;
      }
      if (error.message === 'PAUSED') {
        // 이미 paused 상태로 설정됨
        return;
      }
      
      updateFileStatus(uploadFile.id, 'error', error.message);
      toast({
        title: "업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      cancelFlagsRef.current.delete(uploadFile.id);
    }
  };

  const updateFileStatus = (
    id: string, 
    status: UploadFile['status'], 
    error?: string, 
    progress?: number,
    mappingResult?: any
  ) => {
    setFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status, error, progress: progress ?? f.progress, mappingResult } 
        : f
    ));
  };

  const uploadAllFiles = async () => {
    // 복원된 파일이 아닌, 실제 파일만 업로드
    const pendingFiles = files.filter(f => f.status === 'pending' && !f.isRestored);
    if (pendingFiles.length === 0) {
      toast({
        title: "업로드할 파일 없음",
        description: "대기 중인 파일이 없습니다",
      });
      return;
    }
    
    // 검증 결과에 권장 업로드 순서가 있으면 순서대로 업로드
    if (validationResults && validationResults.uploadOrder && validationResults.uploadOrder.length > 0) {
      toast({
        title: "순서대로 업로드 시작",
        description: `${validationResults.uploadOrder.length}단계로 나누어 업로드합니다`,
      });
      
      // 각 레벨별로 순차 업로드
      for (let levelIndex = 0; levelIndex < validationResults.uploadOrder.length; levelIndex++) {
        const levelFileNames = validationResults.uploadOrder[levelIndex];
        
        toast({
          title: `단계 ${levelIndex + 1}/${validationResults.uploadOrder.length} 업로드 중`,
          description: `${levelFileNames.length}개 파일 업로드 중...`,
        });
        
        // 해당 레벨의 파일들 찾기 (파일명으로 매칭)
        const levelFiles = pendingFiles.filter(file => 
          levelFileNames.includes(file.file.name)
        );
        
        // 레벨 내 파일들을 순차 업로드
        for (const file of levelFiles) {
          if (isPaused) {
            toast({
              title: "업로드 일시중지",
              description: "일시중지되었습니다. 재개 버튼을 눌러주세요.",
            });
            return;
          }
          await uploadFile(file);
        }
        
        // 레벨 완료 후 잠시 대기 (다음 레벨 시작 전)
        if (levelIndex < validationResults.uploadOrder.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      toast({
        title: "순서대로 업로드 완료",
        description: "모든 파일이 권장 순서대로 업로드되었습니다",
      });
    } else {
      // 검증 순서가 없으면 기존 방식대로 순차 업로드
      for (const file of pendingFiles) {
        if (isPaused) break;
        await uploadFile(file);
      }
    }
    
    onUploadSuccess?.();
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== id);
      
      // localStorage도 동기화
      if (storeId) {
        try {
          const storageKey = STORAGE_KEY_PREFIX + storeId;
          const toStore: StoredUploadFile[] = updatedFiles.map(file => ({
            id: file.id,
            fileName: file.file.name,
            fileSize: file.file.size,
            type: file.type,
            status: file.status,
            progress: file.progress,
            error: file.error,
            mappingResult: file.mappingResult,
            isRestored: file.isRestored,
          }));
          localStorage.setItem(storageKey, JSON.stringify(toStore));
        } catch (error) {
          console.error('Failed to update localStorage:', error);
        }
      }
      
      return updatedFiles;
    });
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success' && f.status !== 'cancelled'));
    // localStorage에서도 제거
    if (storeId) {
      try {
        const storageKey = STORAGE_KEY_PREFIX + storeId;
        const remaining = files.filter(f => f.status !== 'success' && f.status !== 'cancelled');
        const toStore: StoredUploadFile[] = remaining.map(file => ({
          id: file.id,
          fileName: file.file.name,
          fileSize: file.file.size,
          type: file.type,
          status: file.status,
          progress: file.progress,
          error: file.error,
          mappingResult: file.mappingResult,
          isRestored: file.isRestored,
        }));
        localStorage.setItem(storageKey, JSON.stringify(toStore));
      } catch (error) {
        console.error('Failed to update localStorage:', error);
      }
    }
  };

  const getFileTypeIcon = (type: UploadFile['type']) => {
    switch (type) {
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5" />;
      case '3d-model':
        return <Box className="w-5 h-5" />;
      case 'wifi':
        return <Wifi className="w-5 h-5" />;
      case 'json':
        return <FileSpreadsheet className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getFileTypeBadge = (type: UploadFile['type']) => {
    const variants: Record<UploadFile['type'], string> = {
      'csv': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'excel': 'bg-green-500/10 text-green-500 border-green-500/20',
      '3d-model': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'wifi': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'json': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      'unknown': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };

    const labels: Record<UploadFile['type'], string> = {
      'csv': 'CSV',
      'excel': 'Excel',
      '3d-model': '3D 모델',
      'wifi': 'WiFi',
      'json': 'JSON',
      'unknown': '알 수 없음',
    };

    return (
      <Badge variant="outline" className={variants[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
      case 'mapping':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      default:
        return null;
    }
  };

  const getStatusText = (uploadFile: UploadFile) => {
    if (uploadFile.status === 'success' && uploadFile.mappingResult) {
      if (uploadFile.type === '3d-model') {
        if (uploadFile.mappingResult.autoMapped) {
          const instanceInfo = uploadFile.mappingResult.instanceLabel 
            ? ` → ${uploadFile.mappingResult.instanceLabel}` 
            : '';
          return `자동 매핑 완료: ${uploadFile.mappingResult.entityType}${instanceInfo}`;
        } else {
          return uploadFile.mappingResult.message || '업로드 완료';
        }
      } else if (uploadFile.mappingResult.importId) {
        return `자동 매핑 완료 (Import ID: ${uploadFile.mappingResult.importId})`;
      }
    }
    
    const statusMap = {
      pending: '대기 중',
      uploading: '업로드 중...',
      processing: '처리 중...',
      mapping: '자동 매핑 중...',
      success: '완료',
      error: uploadFile.error || '실패',
      cancelled: '취소됨',
      paused: '일시중지됨'
    };
    return statusMap[uploadFile.status];
  };

  const hasActiveUploads = files.some(f => 
    f.status === 'uploading' || f.status === 'processing' || f.status === 'mapping'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>통합 데이터 업로드</CardTitle>
        <CardDescription>
          모든 타입의 데이터를 한 번에 업로드하고 자동으로 인식/매핑합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!storeId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              매장을 먼저 선택해주세요
            </AlertDescription>
          </Alert>
        )}
        
        {/* 데이터 임포트 순서 가이드 */}
        <Alert className="border-primary/50 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="space-y-3">
            <div className="font-semibold text-primary text-base">📋 데이터 임포트 가이드</div>
            
            <div className="space-y-3 text-sm">
              {/* 1단계: 필수 기본 데이터 */}
              <div className="space-y-2">
                <div className="font-semibold text-foreground">✅ 1단계: 필수 기본 데이터 (반드시 이 순서로 업로드)</div>
                <div className="space-y-1.5 ml-4">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded min-w-[28px] text-center">1</span>
                    <div className="flex-1">
                      <span className="font-semibold">매장 정보</span>
                      <span className="text-muted-foreground ml-2">stores.csv, 매장.xlsx</span>
                      <div className="text-xs text-muted-foreground mt-0.5">매장명, 주소, 면적, 매장코드 등</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded min-w-[28px] text-center">2</span>
                    <div className="flex-1">
                      <span className="font-semibold">고객 정보</span>
                      <span className="text-muted-foreground ml-2">customers.csv, 회원.xlsx</span>
                      <div className="text-xs text-muted-foreground mt-0.5">고객명, 연락처, 이메일, 세그먼트 등</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded min-w-[28px] text-center">3</span>
                    <div className="flex-1">
                      <span className="font-semibold">상품 정보</span>
                      <span className="text-muted-foreground ml-2">products.csv, 제품.xlsx</span>
                      <div className="text-xs text-muted-foreground mt-0.5">상품명, 가격, 카테고리, SKU, 브랜드 등</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded min-w-[28px] text-center">4</span>
                    <div className="flex-1">
                      <span className="font-semibold">방문 기록</span>
                      <span className="text-muted-foreground ml-2">visits.csv, 방문.xlsx</span>
                      <div className="text-xs text-muted-foreground mt-0.5">고객별 매장 방문 일시, 체류시간 등</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded min-w-[28px] text-center">5</span>
                    <div className="flex-1">
                      <span className="font-semibold">구매/판매 데이터</span>
                      <span className="text-muted-foreground ml-2">purchases.csv, 주문.xlsx, transactions.csv</span>
                      <div className="text-xs text-muted-foreground mt-0.5">거래일시, 구매상품, 수량, 금액 등</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2단계: 선택적 운영 데이터 */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="font-semibold text-foreground">⚙️ 2단계: 선택적 운영 데이터 (있으면 더 정확한 분석)</div>
                <div className="space-y-1.5 ml-4">
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <div className="flex-1">
                      <span className="font-semibold">재고 데이터</span>
                      <span className="text-muted-foreground ml-2">inventory.csv, 재고.xlsx</span>
                      <div className="text-xs text-muted-foreground mt-0.5">상품별 재고수량, 안전재고, 입출고 이력</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <div className="flex-1">
                      <span className="font-semibold">직원 정보</span>
                      <span className="text-muted-foreground ml-2">staff.csv, 직원.xlsx</span>
                      <div className="text-xs text-muted-foreground mt-0.5">직원명, 근무시간, 배치 매장 등</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <div className="flex-1">
                      <span className="font-semibold">WiFi 추적 데이터</span>
                      <span className="text-muted-foreground ml-2">wifi_tracking.csv, sensor_data.csv</span>
                      <div className="text-xs text-muted-foreground mt-0.5">고객 동선, 구역별 체류시간 (IoT 센서)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <div className="flex-1">
                      <span className="font-semibold">3D 매장 모델</span>
                      <span className="text-muted-foreground ml-2">.glb, .gltf 파일</span>
                      <div className="text-xs text-muted-foreground mt-0.5">디지털 트윈 시뮬레이션용 3D 매장 모델</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 주의사항 */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span>💡</span>
                  <div className="flex-1 space-y-1">
                    <p><strong>자동 검증:</strong> 파일을 추가하면 데이터 구조를 자동으로 검증하고 최적의 업로드 순서를 제안합니다.</p>
                    <p><strong>파일명 자동 인식:</strong> 파일명(customers, 고객, products, 상품 등)으로 자동 분류되므로 알기 쉬운 이름을 사용하세요.</p>
                    <p><strong>자동 생성 데이터:</strong> dashboard_kpi, ai_recommendation 등은 시스템이 자동 생성하므로 업로드하지 마세요.</p>
                  </div>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        {/* 스키마 로딩 중 */}
        {isLoadingSchema && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              데이터베이스 스키마를 로드하는 중...
            </AlertDescription>
          </Alert>
        )}
        
        {/* 검증 결과 프리뷰 */}
        {validationResults && (
          <div className="mb-6">
            <DataValidationPreview
              results={validationResults.results}
              uploadOrder={validationResults.uploadOrder}
              summary={validationResults.summary}
            />
          </div>
        )}
        
        {/* 검증 중 */}
        {isValidating && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              파일 검증 중... FK 의존성 및 스키마 매칭을 확인하고 있습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 드래그 앤 드롭 영역 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            파일을 여기에 드롭하거나 클릭하여 선택
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            CSV, Excel, 3D 모델(.glb/.gltf), WiFi 데이터 지원
          </p>
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".csv,.xlsx,.xls,.glb,.gltf,.json"
            onChange={handleFileInput}
            className="hidden"
            disabled={!storeId}
          />
          <Button asChild disabled={!storeId}>
            <label htmlFor="file-upload" className="cursor-pointer">
              파일 선택
            </label>
          </Button>
        </div>

        {/* 업로드 파일 목록 */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                파일 목록 ({files.length})
                {hasActiveUploads && (
                  <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                    업로드 중
                  </Badge>
                )}
              </h3>
              <div className="flex gap-2">
                {hasActiveUploads && (
                  <>
                    {isPaused ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resumeAll}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        재개
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={pauseAll}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        일시중지
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={cancelAll}
                    >
                      <X className="w-4 h-4 mr-2" />
                      전체 취소
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={!files.some(f => f.status === 'success' || f.status === 'cancelled')}
                >
                  완료/취소 항목 제거
                </Button>
                <Button
                  onClick={uploadAllFiles}
                  disabled={!files.some(f => f.status === 'pending') || isPaused}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {validationResults ? '권장 순서로 업로드' : '모두 업로드'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getFileTypeIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{file.file.name}</p>
                          {getFileTypeBadge(file.type)}
                          {file.isRestored && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                              이전 기록
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(file.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      {(file.status === 'uploading' || file.status === 'processing' || 
                        file.status === 'mapping' || file.status === 'paused') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelUpload(file.id)}
                          title="취소"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      {(file.status === 'pending' || file.status === 'success' || 
                        file.status === 'error' || file.status === 'cancelled') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          title="제거"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {file.status !== 'pending' && file.status !== 'success' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {getStatusText(file)}
                        </span>
                        <span className="font-medium">{file.progress}%</span>
                      </div>
                      <Progress value={file.progress} />
                    </div>
                  )}

                  {file.status === 'success' && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {getStatusText(file)}
                    </div>
                  )}

                  {file.status === 'cancelled' && (
                    <div className="text-sm text-muted-foreground">
                      {getStatusText(file)}
                    </div>
                  )}

                  {file.status === 'paused' && (
                    <div className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
                      <Pause className="w-4 h-4" />
                      {getStatusText(file)}
                    </div>
                  )}

                  {file.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{file.error}</AlertDescription>
                    </Alert>
                  )}

                  {file.mappingResult && file.mappingResult.entity_mappings && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        자동 매핑 완료: {file.mappingResult.entity_mappings?.length || 0}개 엔티티, {' '}
                        {file.mappingResult.relation_mappings?.length || 0}개 관계
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
