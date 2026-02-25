// ============================================================================
// Phase 7: Add Connector Dialog Component
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plug,
  TestTube,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import {
  useCreateConnection,
  useTestConnection,
  useApplyTemplate,
  useApiMappingTemplates,
} from '../hooks/useApiConnector';
import {
  AuthType,
  DataCategory,
  FieldMapping,
  AuthConfig,
  API_PROVIDERS,
  DATA_CATEGORIES,
  AUTH_TYPES,
  TARGET_TABLES,
} from '../types';
import { AuthConfigForm } from './AuthConfigForm';
import { FieldMappingEditor } from './FieldMappingEditor';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// Props & State Types
// ============================================================================

interface AddConnectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId?: string;
  storeId?: string;
}

type Step = 'provider' | 'config' | 'auth' | 'mapping' | 'test';

interface FormData {
  name: string;
  description: string;
  provider: string;
  dataCategory: DataCategory;
  url: string;
  method: string;
  authType: AuthType;
  authConfig: AuthConfig;
  responseDataPath: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
}

const initialFormData: FormData = {
  name: '',
  description: '',
  provider: '',
  dataCategory: 'pos',
  url: '',
  method: 'GET',
  authType: 'none',
  authConfig: {},
  responseDataPath: 'data',
  targetTable: '',
  fieldMappings: [],
};

// ============================================================================
// Add Connector Dialog Component
// ============================================================================

export function AddConnectorDialog({
  open,
  onOpenChange,
  orgId,
  storeId,
}: AddConnectorDialogProps) {
  const [step, setStep] = useState<Step>('provider');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [testResult, setTestResult] = useState<any>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const { toast } = useToast();

  const createMutation = useCreateConnection();
  const testMutation = useTestConnection();
  const applyTemplateMutation = useApplyTemplate();
  const { data: templates } = useApiMappingTemplates({
    provider: formData.provider,
    dataCategory: formData.dataCategory,
  });

  // 다이얼로그 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setStep('provider');
      setFormData(initialFormData);
      setTestResult(null);
      setCreateError(null);
    }
  }, [open]);

  // Provider 선택 시 템플릿 적용
  const handleProviderSelect = async (provider: string) => {
    setFormData(prev => ({ ...prev, provider }));

    if (provider !== 'custom') {
      try {
        const result = await applyTemplateMutation.mutateAsync({
          provider,
          dataCategory: formData.dataCategory,
        });

        if (result.success && result.template) {
          const template = result.template;
          setFormData(prev => ({
            ...prev,
            url: template.default_endpoint || prev.url,
            method: template.default_method || 'GET',
            responseDataPath: template.response_data_path || 'data',
            targetTable: template.target_table || prev.targetTable,
            fieldMappings: template.field_mappings || [],
            authType: template.suggested_auth_type || 'api_key',
          }));
        }
      } catch (error) {
        console.error('템플릿 적용 실패:', error);
      }
    }
  };

  // 연결 테스트
  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync({
        connectionConfig: {
          url: formData.url,
          method: formData.method,
          authType: formData.authType,
          authConfig: formData.authConfig,
          responseDataPath: formData.responseDataPath,
        },
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: (error as Error).message });
    }
  };

  // 연결 생성
  const handleCreate = async () => {
    setCreateError(null);
    try {
      console.log('Creating connection with data:', {
        orgId,
        storeId,
        name: formData.name,
        provider: formData.provider,
        dataCategory: formData.dataCategory,
        url: formData.url,
        authType: formData.authType,
        authConfig: formData.authConfig,
        fieldMappings: formData.fieldMappings,
        targetTable: formData.targetTable,
        responseDataPath: formData.responseDataPath,
      });

      const result = await createMutation.mutateAsync({
        orgId,
        storeId,
        name: formData.name,
        provider: formData.provider,
        dataCategory: formData.dataCategory,
        url: formData.url,
        authType: formData.authType,
        authConfig: formData.authConfig,
        fieldMappings: formData.fieldMappings,
        targetTable: formData.targetTable,
        responseDataPath: formData.responseDataPath,
      });

      console.log('Connection created:', result);

      // RPC 함수가 success: false를 반환할 수 있음
      if (result && !result.success) {
        const errorMsg = (result as any).error || '연결 생성에 실패했습니다.';
        setCreateError(errorMsg);
        toast({
          variant: 'destructive',
          title: '연결 생성 실패',
          description: errorMsg,
        });
        return;
      }

      toast({
        title: '연결 생성 완료',
        description: `${formData.name} 연결이 성공적으로 생성되었습니다.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('연결 생성 실패:', error);
      const errorMessage = error?.message || '연결 생성 중 오류가 발생했습니다.';
      setCreateError(errorMessage);
      toast({
        variant: 'destructive',
        title: '연결 생성 실패',
        description: errorMessage,
      });
    }
  };

  // 다음 단계로 이동
  const nextStep = () => {
    const steps: Step[] = ['provider', 'config', 'auth', 'mapping', 'test'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  // 이전 단계로 이동
  const prevStep = () => {
    const steps: Step[] = ['provider', 'config', 'auth', 'mapping', 'test'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  // 현재 단계가 유효한지 확인
  const isStepValid = () => {
    switch (step) {
      case 'provider':
        return formData.provider && formData.dataCategory && formData.name;
      case 'config':
        return formData.url && formData.targetTable;
      case 'auth':
        return true; // 인증 없음도 허용
      case 'mapping':
        return formData.fieldMappings.length > 0;
      case 'test':
        return testResult?.success;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            새 API 연결 추가
          </DialogTitle>
          <DialogDescription>
            외부 시스템의 API를 연결하여 데이터를 자동으로 동기화합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 진행 상태 표시 */}
        <div className="flex items-center gap-2 px-1 py-2 border-b">
          {['provider', 'config', 'auth', 'mapping', 'test'].map((s, i) => (
            <React.Fragment key={s}>
              <Badge
                variant={step === s ? 'default' : s < step ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {i + 1}. {s === 'provider' ? '공급자' : s === 'config' ? '설정' : s === 'auth' ? '인증' : s === 'mapping' ? '매핑' : '테스트'}
              </Badge>
              {i < 4 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4">
          {/* Step 1: Provider 선택 */}
          {step === 'provider' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">연결 이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: Toast POS 매출 데이터"
                />
              </div>

              <div className="space-y-2">
                <Label>데이터 카테고리 *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DATA_CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={formData.dataCategory === cat.value ? 'default' : 'outline'}
                      className="flex flex-col h-auto py-3"
                      onClick={() => setFormData(prev => ({ ...prev, dataCategory: cat.value as DataCategory }))}
                    >
                      <span className="text-xs">{cat.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>공급자 *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {API_PROVIDERS.map((provider) => (
                    <Button
                      key={provider.value}
                      variant={formData.provider === provider.value ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => handleProviderSelect(provider.value)}
                    >
                      {provider.label}
                      {applyTemplateMutation.isPending && formData.provider === provider.value && (
                        <Loader2 className="h-4 w-4 ml-auto animate-spin" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="이 연결에 대한 설명을 입력하세요"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Config */}
          {step === 'config' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">API URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.example.com/v1/data"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">HTTP 메서드</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseDataPath">응답 데이터 경로</Label>
                  <Input
                    id="responseDataPath"
                    value={formData.responseDataPath}
                    onChange={(e) => setFormData(prev => ({ ...prev, responseDataPath: e.target.value }))}
                    placeholder="data"
                  />
                  <p className="text-xs text-muted-foreground">
                    응답에서 데이터 배열이 위치한 경로 (예: data, results, data.items)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetTable">대상 테이블 *</Label>
                <Select
                  value={formData.targetTable}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetTable: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="동기화할 테이블 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_TABLES.map((table) => (
                      <SelectItem key={table.value} value={table.value}>
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Auth */}
          {step === 'auth' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>인증 방식</Label>
                <Select
                  value={formData.authType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, authType: value as AuthType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPES.map((auth) => (
                      <SelectItem key={auth.value} value={auth.value}>
                        {auth.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.authType !== 'none' && (
                <AuthConfigForm
                  authType={formData.authType}
                  authConfig={formData.authConfig}
                  onChange={(authConfig) => setFormData(prev => ({ ...prev, authConfig }))}
                />
              )}
            </div>
          )}

          {/* Step 4: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4 py-4">
              <FieldMappingEditor
                fieldMappings={formData.fieldMappings}
                onChange={(fieldMappings) => setFormData(prev => ({ ...prev, fieldMappings }))}
                targetTable={formData.targetTable}
                sampleData={testResult?.sample_data}
              />
            </div>
          )}

          {/* Step 5: Test */}
          {step === 'test' && (
            <div className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">연결 테스트</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleTest}
                    disabled={testMutation.isPending}
                    className="w-full"
                  >
                    {testMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        테스트 중...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        연결 테스트
                      </>
                    )}
                  </Button>

                  {testResult && (
                    <div className={`p-4 rounded-lg ${
                      testResult.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {testResult.success ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800">테스트 성공</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-800">테스트 실패</span>
                          </>
                        )}
                      </div>
                      {testResult.success ? (
                        <div className="text-sm text-green-700 space-y-1">
                          <p>응답 시간: {testResult.response_time_ms}ms</p>
                          <p>HTTP 상태: {testResult.status_code}</p>
                          {testResult.record_count && (
                            <p>레코드 수: {testResult.record_count}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-red-700">
                          {testResult.error || testResult.message}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 설정 요약 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">설정 요약</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>이름:</strong> {formData.name}</p>
                  <p><strong>공급자:</strong> {formData.provider}</p>
                  <p><strong>URL:</strong> {formData.url}</p>
                  <p><strong>인증:</strong> {AUTH_TYPES.find(a => a.value === formData.authType)?.label}</p>
                  <p><strong>대상 테이블:</strong> {formData.targetTable}</p>
                  <p><strong>필드 매핑:</strong> {formData.fieldMappings.length}개</p>
                </CardContent>
              </Card>

              {/* 생성 에러 표시 */}
              {createError && (
                <div className="p-4 bg-red-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">연결 생성 실패</span>
                  </div>
                  <p className="text-sm text-red-700">{createError}</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div>
            {step !== 'provider' && (
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                이전
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            {step !== 'test' ? (
              <Button onClick={nextStep} disabled={!isStepValid()}>
                다음
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!testResult?.success || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    연결 생성
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddConnectorDialog;
