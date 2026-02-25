/**
 * NotificationCenter.tsx
 *
 * 알림 센터 컴포넌트
 */

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Package,
  TrendingDown,
  Trophy,
  Sparkles,
  BarChart3,
  X,
  Check,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import {
  useAlerts,
  useUnreadAlertCount,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  useDismissAlert,
  AlertType,
  AlertSeverity,
  UserAlert,
} from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const alertIcons: Record<AlertType, any> = {
  inventory: Package,
  conversion: TrendingDown,
  goal: Trophy,
  recommendation: Sparkles,
  roi: BarChart3,
};

const severityStyles: Record<AlertSeverity, string> = {
  critical: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
  success: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
};

const severityIconColors: Record<AlertSeverity, string> = {
  critical: 'text-red-600',
  warning: 'text-yellow-600',
  success: 'text-green-600',
  info: 'text-blue-600',
};

interface AlertCardProps {
  alert: UserAlert;
  onRead: () => void;
  onDismiss: () => void;
  onAction: () => void;
}

function AlertCard({ alert, onRead, onDismiss, onAction }: AlertCardProps) {
  const Icon = alertIcons[alert.alert_type] || Bell;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all relative group',
        severityStyles[alert.severity],
        !alert.is_read && 'ring-2 ring-primary/20'
      )}
    >
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        <X className="h-3 w-3" />
      </Button>

      <div className="flex gap-3">
        <div className={cn('mt-0.5', severityIconColors[alert.severity])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight pr-6">{alert.title}</h4>
          </div>
          {alert.message && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {alert.message}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(alert.created_at), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
            <div className="flex items-center gap-1">
              {!alert.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead();
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  읽음
                </Button>
              )}
              {alert.action_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction();
                  }}
                >
                  {alert.action_label || '확인'}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const { data: alerts = [], isLoading } = useAlerts();
  const unreadCount = useUnreadAlertCount();
  const markAsRead = useMarkAlertRead();
  const markAllAsRead = useMarkAllAlertsRead();
  const dismissAlert = useDismissAlert();
  const navigate = useNavigate();

  const handleAction = (alert: UserAlert) => {
    if (alert.action_url) {
      navigate(alert.action_url);
      setOpen(false);
    }
    if (!alert.is_read) {
      markAsRead.mutate(alert.id);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}개 새 알림</Badge>
            )}
          </SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-4 w-4" />
              모두 읽음
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-3 pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-3 rounded-lg border">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">새로운 알림이 없습니다</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onRead={() => markAsRead.mutate(alert.id)}
                  onDismiss={() => dismissAlert.mutate(alert.id)}
                  onAction={() => handleAction(alert)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
