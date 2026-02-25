// ============================================================================
// Phase 9: Connector Settings Page
// ============================================================================
// API 연결 상세 설정 및 관리 페이지
// Updated: 2026-01-14 - Fixed duplicate export
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Save,
  TestTube,
  PlayCircle,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Settings,
  Database,
  Key,
  Calendar,
  AlertTriangle,
  History,
} from 'lucide-react';
import {
  useApiConnection,
  useUpdateConnection,
  useTestConnection,
  useSyncConnection,
  useDeleteConnection,
  useApiSyncLogs,
} from './hooks/useApiConnector';
import {
  ApiConnection,
  AuthType,
  DataCategory,
  FieldMapping,
  AuthConfig,
  SyncFrequency,
  ConnectionStatus,
} from './types';
import {
  PROVIDERS,
  DATA_CATEGORIES,
  AUTH_TYPES,
  SYNC_INTERVALS,
  TARGET_TABLES,
  getProviderConfig,
  getDataCategoryConfig,
  getSyncIntervalConfig,
} from './constants';
import { AuthConfigForm } from './components/AuthConfigForm';
import { FieldMappingEditor } from './components/FieldMappingEditor';
import { ConnectionTestResult } from './components/connectors/ConnectionTestResult';
import { SyncHistoryTable } from './components/connectors/SyncHistoryTable';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const variants: Record<
    ConnectionStatus,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }
  > = {
    active: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, label: '활성' },
    inactive: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: '비활성' },
    error: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: '오류' },
    testing: {
      variant: 'outline',
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: '테스트 중',
    },
  };

  const config = variants[status] || variants.inactive;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ConnectorSettingsPage() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: connection, isLoading, error } = useApiConnection(connectionId || '');
  const { data: syncLogs } = useApiSyncLogs(connectionId || '');

  // Mutations
  const updateMutation = useUpdateConnection();
  const testMutation = useTestConnection();
  const syncMutation = useSyncConnection();
  const deleteMutation = useDeleteConnection();

  // Local state for form
  const [formData, setFormData] = useState<Partial<ApiConnection>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Initialize form data when connection loads
  useEffect(() => {
    if (connection) {
      setFormData({
        name: connection.name,
        description: connection.description,
        url: connection.url,
        method: connection.method,
        provider: connection.provider,
        data_category: connection.data_category,
        auth_type: connection.auth_type,
        auth_config: connection.auth_config,
        target_table: connection.target_table,
        response_data_path: connection.response_data_path,
        field_mappings: connection.field_mappings,
        sync_frequency: connection.sync_frequency,
        sync_config: connection.sync_config,
        is_active: connection.is_active,
      });
    }
  }, [connection]);

  // Track changes
  const updateFormField = <K extends keyof ApiConnection>(field: K, value: ApiConnection[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handlers
  const handleSave = async () => {
    if (!connectionId || !hasChanges) return;

    try {
      await updateMutation.mutateAsync({
        id: connectionId,
        updates: formData,
      });
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save connection:', err);
    }
  };

  const handleTest = async () => {
    if (!connectionId) return;
    await testMutation.mutateAsync({ connectionId });
  };

  const handleSync = async () => {
    if (!connectionId) return;
    await syncMutation.mutateAsync({ connectionId, syncType: 'manual' });
  };

  const handleDelete = async () => {
    if (!connectionId) return;
    await deleteMutation.mutateAsync(connectionId);
    navigate('/data-control');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !connection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">연결을 찾을 수 없습니다</p>
        <Button variant="outline" onClick={() => navigate('/data-control')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  const providerConfig = getProviderConfig(connection.provider || '');
  const categoryConfig = getDataCategoryConfig(connection.data_category || '');
  const syncIntervalConfig = getSyncIntervalConfig(connection.sync_frequency || 'manual');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/data-control')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{connection.name}</h1>
            <p className="text-muted-foreground">
              {providerConfig?.label || connection.provider} - {categoryConfig?.label || connection.data_category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={connection.status} />

          <Button variant="outline" onClick={handleTest} disabled={testMutation.isPending}>
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            테스트
          </Button>

          <Button variant="outline" onClick={handleSync} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            동기화
          </Button>

          <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700 dark:text-yellow-300">저장되지 않은 변경 사항이 있습니다</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{connection.total_records_synced?.toLocaleString() || 0}</div>
            <p className="text-sm text-muted-foreground">총 동기화된 레코드</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {connection.last_sync
                ? formatDistanceToNow(new Date(connection.last_sync), { addSuffix: true, locale: ko })
                : '-'}
            </div>
            <p className="text-sm text-muted-foreground">마지막 동기화</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {connection.last_sync_duration_ms ? `${connection.last_sync_duration_ms}ms` : '-'}
            </div>
            <p className="text-sm text-muted-foreground">마지막 동기화 시간</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{syncIntervalConfig?.label || '수동'}</div>
            <p className="text-sm text-muted-foreground">동기화 주기</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Result */}
      {testMutation.data && (
        <ConnectionTestResult result={testMutation.data} />
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            일반
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            인증
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            매핑
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            스케줄
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            히스토리
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>기본 설정</CardTitle>
              <CardDescription>연결의 기본 정보를 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">연결 이름</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    placeholder="연결 이름"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">프로바이더</Label>
                  <Select
                    value={formData.provider || ''}
                    onValueChange={(value) => updateFormField('provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="프로바이더 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  placeholder="연결에 대한 설명"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="url">API URL</Label>
                  <Input
                    id="url"
                    value={formData.url || ''}
                    onChange={(e) => updateFormField('url', e.target.value)}
                    placeholder="https://api.example.com/data"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select
                    value={formData.method || 'GET'}
                    onValueChange={(value) => updateFormField('method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="data_category">데이터 카테고리</Label>
                  <Select
                    value={formData.data_category || ''}
                    onValueChange={(value) => updateFormField('data_category', value as DataCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response_data_path">응답 데이터 경로</Label>
                  <Input
                    id="response_data_path"
                    value={formData.response_data_path || ''}
                    onChange={(e) => updateFormField('response_data_path', e.target.value)}
                    placeholder="data.items"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>연결 활성화</Label>
                  <p className="text-sm text-muted-foreground">비활성화 시 스케줄된 동기화가 중지됩니다</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateFormField('is_active', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Tab */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>인증 설정</CardTitle>
              <CardDescription>API 인증 방식을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>인증 방식</Label>
                <Select
                  value={formData.auth_type || 'none'}
                  onValueChange={(value) => {
                    updateFormField('auth_type', value as AuthType);
                    updateFormField('auth_config', {});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label} - {a.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.auth_type && formData.auth_type !== 'none' && (
                <AuthConfigForm
                  authType={formData.auth_type}
                  authConfig={formData.auth_config || {}}
                  onChange={(config) => updateFormField('auth_config', config)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping Tab */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>필드 매핑</CardTitle>
              <CardDescription>API 응답 필드를 데이터베이스 필드에 매핑합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>대상 테이블</Label>
                  <Select
                    value={formData.target_table || ''}
                    onValueChange={(value) => updateFormField('target_table', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="테이블 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_TABLES.filter(
                        (t) => !formData.data_category || t.category === formData.data_category
                      ).map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FieldMappingEditor
                fieldMappings={formData.field_mappings || []}
                onChange={(mappings) => updateFormField('field_mappings', mappings)}
                sampleData={testMutation.data?.sample_data}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>동기화 스케줄</CardTitle>
              <CardDescription>자동 동기화 주기를 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>동기화 주기</Label>
                <Select
                  value={formData.sync_frequency || 'manual'}
                  onValueChange={(value) => updateFormField('sync_frequency', value as SyncFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNC_INTERVALS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                        {s.description && ` - ${s.description}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.sync_frequency && formData.sync_frequency !== 'manual' && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">스케줄 정보</p>
                  <p className="text-sm text-muted-foreground">
                    Cron 표현식: <code className="bg-muted px-1 rounded">{syncIntervalConfig?.cronExpression || '-'}</code>
                  </p>
                  {connection.last_sync && (
                    <p className="text-sm text-muted-foreground">
                      마지막 동기화: {format(new Date(connection.last_sync), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>동기화 모드</Label>
                  <Select
                    value={formData.sync_config?.mode || 'full'}
                    onValueChange={(value) =>
                      updateFormField('sync_config', {
                        ...formData.sync_config,
                        mode: value as 'full' | 'incremental' | 'append',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">전체 동기화 - 모든 데이터를 새로 가져옴</SelectItem>
                      <SelectItem value="incremental">증분 동기화 - 변경된 데이터만</SelectItem>
                      <SelectItem value="append">추가 전용 - 새 데이터만 추가</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.sync_config?.mode === 'incremental' && (
                  <div className="space-y-2">
                    <Label>증분 키 필드</Label>
                    <Input
                      value={formData.sync_config?.incremental_key || ''}
                      onChange={(e) =>
                        updateFormField('sync_config', {
                          ...formData.sync_config,
                          incremental_key: e.target.value,
                        })
                      }
                      placeholder="updated_at"
                    />
                    <p className="text-xs text-muted-foreground">증분 동기화에 사용할 타임스탬프 필드</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>배치 크기</Label>
                  <Input
                    type="number"
                    value={formData.sync_config?.batch_size || 100}
                    onChange={(e) =>
                      updateFormField('sync_config', {
                        ...formData.sync_config,
                        batch_size: parseInt(e.target.value) || 100,
                      })
                    }
                    min={1}
                    max={10000}
                  />
                  <p className="text-xs text-muted-foreground">한 번에 처리할 레코드 수</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {connectionId && <SyncHistoryTable connectionId={connectionId} limit={20} />}
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">위험 구역</CardTitle>
          <CardDescription>이 작업은 되돌릴 수 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                연결 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>연결을 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 연결과 관련된 모든 동기화 로그가 삭제됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
