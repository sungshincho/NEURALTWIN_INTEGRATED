// ============================================================================
// Model3DUploadWidget.tsx
// 3D 모델 파일 업로드 위젯 - Phase 3
// Digital Twin Studio용 3D 모델 관리
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Box,
  Loader2,
  Trash2,
  X,
  AlertCircle,
  FileBox,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useToast } from '@/hooks/use-toast';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// ============================================================================
// 3D 스타일 시스템
// ============================================================================

const getText3D = (isDark: boolean) => ({
  title: isDark ? {
    fontWeight: 600, fontSize: '14px', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '14px',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #2a2a2f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px',
    background: 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
    <div style={{
      borderRadius: '24px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25), 0 16px 32px rgba(0,0,0,0.2)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02), 0 16px 16px rgba(0,0,0,0.02)',
      height: '100%',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '23px', height: '100%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: dark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.08) 55%, transparent 100%)',
          borderRadius: '23px 23px 50% 50%', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 44, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)',
    flexShrink: 0,
  }}>
    {!dark && <div style={{ position: 'absolute', top: '3px', left: '15%', right: '15%', height: '35%',
      background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
      borderRadius: '40% 40% 50% 50%', pointerEvents: 'none',
    }} />}
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

// ============================================================================
// Types
// ============================================================================

interface Model3DFile {
  id: string;
  user_id: string;
  store_id: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  display_name: string;
  description: string | null;
  thumbnail_url: string | null;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  created_at: string;
}

// ============================================================================
// Constants
// ============================================================================

const SUPPORTED_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'dae'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// ============================================================================
// Component
// ============================================================================

interface Model3DUploadWidgetProps {
  onUploadComplete?: (model: Model3DFile) => void;
  className?: string;
}

export function Model3DUploadWidget({ onUploadComplete, className }: Model3DUploadWidgetProps) {
  const [models, setModels] = useState<Model3DFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();

  // 다크 모드 감지
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  // 모델 목록 로드
  const loadModels = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('model_3d_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        // 테이블이 없는 경우 빈 배열
        if (error.code === '42P01') {
          setModels([]);
          return;
        }
        throw error;
      }

      setModels((data as unknown as Model3DFile[]) || []);
    } catch (err) {
      console.error('Failed to load 3D models:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Drag & Drop 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setError(null);

    // 파일 확장자 검증
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_FORMATS.includes(extension)) {
      setError(`지원하지 않는 파일 형식입니다. 지원 포맷: ${SUPPORTED_FORMATS.join(', ').toUpperCase()}`);
      return;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      setError(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.`);
      return;
    }

    setUploadFile(file);
    setDisplayName(file.name.replace(/\.[^/.]+$/, ''));
    setShowUploadDialog(true);
  };

  // 업로드 실행
  const handleUpload = async () => {
    if (!uploadFile || !user) return;

    setIsLoading(true);
    setUploadProgress(0);
    setShowUploadDialog(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // Storage 버킷에 업로드
      const filePath = `${user.id}/${Date.now()}_${uploadFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('3d-models')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false,
        });

      setUploadProgress(70);

      if (uploadError) {
        // 버킷이 없는 경우
        if (uploadError.message?.includes('not found')) {
          throw new Error('3D 모델 스토리지가 설정되지 않았습니다. 관리자에게 문의하세요.');
        }
        throw uploadError;
      }

      setUploadProgress(90);

      // DB에 메타데이터 저장
      const modelData = {
        user_id: user.id,
        org_id: orgId,
        store_id: selectedStore?.id || null,
        file_name: uploadFile.name,
        file_path: filePath,
        file_size: uploadFile.size,
        file_type: uploadFile.name.split('.').pop()?.toLowerCase() || 'unknown',
        display_name: displayName || uploadFile.name,
        description: description || null,
        status: 'ready',
        created_at: new Date().toISOString(),
      };

      const { data: model, error: dbError } = await supabase
        .from('model_3d_files')
        .insert(modelData)
        .select()
        .single();

      if (dbError) {
        // 테이블이 없는 경우 무시 (저장만 성공으로 처리)
        if (dbError.code !== '42P01') {
          console.error('DB save error:', dbError);
        }
      }

      setUploadProgress(100);

      toast({
        title: '업로드 완료',
        description: `${uploadFile.name}이(가) 업로드되었습니다.`,
      });

      if (model) {
        onUploadComplete?.(model as unknown as Model3DFile);
        loadModels();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '업로드 실패';
      setError(message);
      toast({
        title: '업로드 실패',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
      setUploadFile(null);
      setDisplayName('');
      setDescription('');
    }
  };

  // 모델 삭제
  const handleDelete = async (model: Model3DFile) => {
    try {
      // Storage에서 삭제
      await supabase.storage.from('3d-models').remove([model.file_path]);

      // DB에서 삭제
      await supabase.from('model_3d_files').delete().eq('id', model.id);

      toast({
        title: '삭제 완료',
        description: `${model.display_name}이(가) 삭제되었습니다.`,
      });

      loadModels();
    } catch (err) {
      toast({
        title: '삭제 실패',
        description: '모델을 삭제하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={44} dark={isDark}>
              <Box className="w-5 h-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <span style={text3D.label}>DIGITALTWIN 3D MODEL UPLOAD</span>
              <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>디지털 트윈 3D 모델 업로드</h3>
            </div>
          </div>
        </div>

        <div className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
              onClick={() => setError(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.fbx,.obj,.dae"
            onChange={handleFileInputChange}
            className="hidden"
          />
          {uploadProgress !== null ? (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
              <Progress value={uploadProgress} className="max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground">업로드 중... {uploadProgress}%</p>
            </div>
          ) : (
            <>
              <FileBox className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-foreground mb-1">
                {isDragging ? '파일을 놓으세요' : '3D 모델 파일을 드래그하거나 클릭'}
              </p>
              <p className="text-xs text-muted-foreground">
                지원 포맷: GLB, GLTF, FBX, OBJ, DAE (최대 100MB)
              </p>
            </>
          )}
        </div>

        {/* Models List */}
        {models.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>모델명</TableHead>
                  <TableHead>포맷</TableHead>
                  <TableHead className="text-right">크기</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {model.display_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{model.file_type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatFileSize(model.file_size)}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(model)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>삭제</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              3D 모델 업로드
            </DialogTitle>
            <DialogDescription>
              업로드할 모델의 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {uploadFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileBox className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadFile.size)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName">표시 이름</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="모델 이름"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="모델에 대한 간단한 설명"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              취소
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || !displayName}>
              <Upload className="w-4 h-4 mr-1" />
              업로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}

export default Model3DUploadWidget;
