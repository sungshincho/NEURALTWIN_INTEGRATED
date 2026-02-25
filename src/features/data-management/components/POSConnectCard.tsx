/**
 * POSConnectCard.tsx
 * 
 * POS 연결 관리 UI 컴포넌트
 * - POS 제공자 선택 및 연결
 * - 연결 상태 표시
 * - 동기화 트리거
 */

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Link2,
  Link2Off,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Loader2,
  Plug,
  ShoppingBag,
  Store,
  Coffee,
  CreditCard,
} from 'lucide-react';

import {
  usePOSIntegrations,
  useConnectPOS,
  useDisconnectPOS,
  useTriggerSync,
  useToggleSyncPause,
  formatSyncTime,
  getIntegrationStatusColor,
  POS_PROVIDERS,
  STATUS_LABELS,
  type POSIntegration,
  type POSProvider,
} from '@/hooks/usePOSIntegration';
import { useSelectedStore } from '@/hooks/useSelectedStore';

// ============================================================================
// POS 아이콘 매핑
// ============================================================================

const POS_ICONS: Record<POSProvider, React.ElementType> = {
  square: CreditCard,
  shopify: ShoppingBag,
  toast: Coffee,
  lightspeed: Store,
  clover: CreditCard,
  custom: Plug,
};

// ============================================================================
// Props
// ============================================================================

interface POSConnectCardProps {
  storeId?: string;
  compact?: boolean;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function POSConnectCard({ storeId, compact = false }: POSConnectCardProps) {
  const { selectedStore } = useSelectedStore();
  const effectiveStoreId = storeId || selectedStore?.id;
  
  const { data: integrations = [], isLoading } = usePOSIntegrations(effectiveStoreId);
  const connectPOS = useConnectPOS();
  const disconnectPOS = useDisconnectPOS();
  const triggerSync = useTriggerSync();
  const togglePause = useToggleSyncPause();
  
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<POSIntegration | null>(null);

  // disconnected 상태가 아닌 연동만 표시
  const visibleIntegrations = integrations.filter(i => i.status !== 'disconnected');
  const activeIntegrations = visibleIntegrations.filter(i => i.status === 'active');
  const hasIntegrations = visibleIntegrations.length > 0;

  // ============================================================================
  // 핸들러
  // ============================================================================

  const handleConnect = async (provider: POSProvider) => {
    if (!effectiveStoreId) return;
    
    await connectPOS.mutateAsync({
      storeId: effectiveStoreId,
      provider,
    });
    setShowConnectDialog(false);
  };

  const handleDisconnect = async () => {
    if (!selectedIntegration) return;
    
    await disconnectPOS.mutateAsync(selectedIntegration.id);
    setShowDisconnectDialog(false);
    setSelectedIntegration(null);
  };

  const handleSync = (integrationId: string) => {
    triggerSync.mutate(integrationId);
  };

  const handleTogglePause = (integration: POSIntegration) => {
    togglePause.mutate({
      integrationId: integration.id,
      pause: integration.status === 'active',
    });
  };

  // ============================================================================
  // Compact 버전 (사이드바용)
  // ============================================================================

  if (compact) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">POS 연동</span>
          </div>
          <Badge variant={activeIntegrations.length > 0 ? 'default' : 'secondary'}>
            {activeIntegrations.length}개 연결
          </Badge>
        </div>
        
        {activeIntegrations.length > 0 ? (
          <div className="space-y-2">
            {activeIntegrations.slice(0, 2).map((integration) => {
              const Icon = POS_ICONS[integration.provider];
              return (
                <div key={integration.id} className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" />
                  <span>{POS_PROVIDERS[integration.provider].name}</span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    {formatSyncTime(integration.last_sync_at)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setShowConnectDialog(true)}
          >
            <Plug className="h-4 w-4 mr-2" />
            POS 연결하기
          </Button>
        )}
        
        {/* 연결 다이얼로그 */}
        <POSConnectDialog
          open={showConnectDialog}
          onOpenChange={setShowConnectDialog}
          onConnect={handleConnect}
          isConnecting={connectPOS.isPending}
          existingProviders={visibleIntegrations.map(i => i.provider)}
        />
      </div>
    );
  }

  // ============================================================================
  // Full 버전
  // ============================================================================

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                POS 연동
              </CardTitle>
              <CardDescription>
                POS 시스템을 연결하여 실시간 데이터를 동기화하세요
              </CardDescription>
            </div>
            <Button onClick={() => setShowConnectDialog(true)}>
              <Plug className="h-4 w-4 mr-2" />
              새 POS 연결
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
              ))}
            </div>
          ) : hasIntegrations ? (
            <div className="space-y-3">
              {visibleIntegrations.map((integration) => (
                <POSIntegrationItem
                  key={integration.id}
                  integration={integration}
                  onSync={() => handleSync(integration.id)}
                  onTogglePause={() => handleTogglePause(integration)}
                  onDisconnect={() => {
                    setSelectedIntegration(integration);
                    setShowDisconnectDialog(true);
                  }}
                  isSyncing={triggerSync.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState onConnect={() => setShowConnectDialog(true)} />
          )}
        </CardContent>
      </Card>

      {/* 연결 다이얼로그 */}
      <POSConnectDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onConnect={handleConnect}
        isConnecting={connectPOS.isPending}
        existingProviders={visibleIntegrations.map(i => i.provider)}
      />

      {/* 연결 해제 확인 다이얼로그 */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>POS 연결 해제</DialogTitle>
            <DialogDescription>
              {selectedIntegration && (
                <>
                  <strong>{POS_PROVIDERS[selectedIntegration.provider].name}</strong> 연동을 해제하시겠습니까?
                  <br />
                  연동 해제 후에도 이전에 동기화된 데이터는 유지됩니다.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={disconnectPOS.isPending}
            >
              {disconnectPOS.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '연결 해제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// POS 연동 아이템
// ============================================================================

interface POSIntegrationItemProps {
  integration: POSIntegration & { stores?: { store_name: string } | null };
  onSync: () => void;
  onTogglePause: () => void;
  onDisconnect: () => void;
  isSyncing: boolean;
}

function POSIntegrationItem({
  integration,
  onSync,
  onTogglePause,
  onDisconnect,
  isSyncing,
}: POSIntegrationItemProps) {
  const provider = POS_PROVIDERS[integration.provider];
  const Icon = POS_ICONS[integration.provider];
  const status = STATUS_LABELS[integration.status];
  const isActive = integration.status === 'active';
  const isPaused = integration.status === 'paused';

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{provider.name}</span>
              <Badge className={getIntegrationStatusColor(integration.status)}>
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {provider.description}
            </p>
            {integration.last_sync_at && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                마지막 동기화: {formatSyncTime(integration.last_sync_at)}
                {integration.last_sync_status === 'success' && (
                  <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                )}
                {integration.last_sync_status === 'failed' && (
                  <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 동기화 버튼 */}
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  동기화
                </>
              )}
            </Button>
          )}

          {/* 더보기 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(isActive || isPaused) && (
                <DropdownMenuItem onClick={onTogglePause}>
                  {isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      동기화 일시 정지
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      동기화 재개
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={onDisconnect}
                className="text-red-600"
              >
                <Link2Off className="h-4 w-4 mr-2" />
                연결 해제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 에러 메시지 */}
      {integration.last_sync_error && (
        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{integration.last_sync_error}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 빈 상태
// ============================================================================

interface EmptyStateProps {
  onConnect: () => void;
}

function EmptyState({ onConnect }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Link2Off className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium mb-1">연결된 POS가 없습니다</h3>
      <p className="text-sm text-muted-foreground mb-4">
        POS를 연결하면 실시간 매출, 재고 데이터를<br />
        자동으로 동기화할 수 있습니다.
      </p>
      <Button onClick={onConnect}>
        <Plug className="h-4 w-4 mr-2" />
        POS 연결하기
      </Button>
    </div>
  );
}

// ============================================================================
// POS 연결 다이얼로그
// ============================================================================

interface POSConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (provider: POSProvider) => void;
  isConnecting: boolean;
  existingProviders: POSProvider[];
}

function POSConnectDialog({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
  existingProviders,
}: POSConnectDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<POSProvider | null>(null);

  const availableProviders = (Object.keys(POS_PROVIDERS) as POSProvider[])
    .filter(p => !existingProviders.includes(p));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>POS 연결</DialogTitle>
          <DialogDescription>
            사용 중인 POS 시스템을 선택하세요
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {availableProviders.map((provider) => {
            const info = POS_PROVIDERS[provider];
            const Icon = POS_ICONS[provider];
            const isSelected = selectedProvider === provider;

            return (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : ''}`} />
                  </div>
                  <span className="font-medium">{info.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{info.description}</p>
              </button>
            );
          })}
        </div>

        {availableProviders.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            모든 POS가 이미 연결되어 있습니다.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={() => selectedProvider && onConnect(selectedProvider)}
            disabled={!selectedProvider || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                연결 중...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                연결하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default POSConnectCard;
