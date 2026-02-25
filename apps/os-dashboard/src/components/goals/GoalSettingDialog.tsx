/**
 * GoalSettingDialog.tsx
 *
 * 목표 설정 다이얼로그
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
  Loader2,
} from 'lucide-react';
import { useCreateGoal, GoalFormData, GoalType, PeriodType, GOAL_TYPES } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

const iconMap = {
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
};

interface GoalSettingDialogProps {
  trigger?: React.ReactNode;
}

export function GoalSettingDialog({ trigger }: GoalSettingDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<GoalFormData>({
    goalType: 'revenue',
    periodType: 'monthly',
    targetValue: 0,
  });

  const createGoal = useCreateGoal();

  // AI 어시스턴트에서 open_modal 이벤트로 다이얼로그 열기
  const handleAssistantOpenModal = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.modalId === 'goal-settings') {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('assistant:open-modal', handleAssistantOpenModal);
    return () => {
      window.removeEventListener('assistant:open-modal', handleAssistantOpenModal);
    };
  }, [handleAssistantOpenModal]);

  const handleSubmit = async () => {
    if (!form.targetValue) return;

    await createGoal.mutateAsync(form);
    setOpen(false);
    setForm({ goalType: 'revenue', periodType: 'monthly', targetValue: 0 });
  };

  const selectedGoalType = GOAL_TYPES.find(t => t.value === form.goalType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Target className="h-4 w-4" />
            목표 설정
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            목표 설정
          </DialogTitle>
          <DialogDescription>
            이번 기간의 목표를 설정하세요. 달성률을 실시간으로 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 목표 유형 */}
          <div className="space-y-3">
            <Label>목표 유형</Label>
            <RadioGroup
              value={form.goalType}
              onValueChange={(v) => setForm({ ...form, goalType: v as GoalType })}
              className="grid grid-cols-2 gap-3"
            >
              {GOAL_TYPES.map((type) => {
                const Icon = iconMap[type.icon as keyof typeof iconMap];
                return (
                  <Label
                    key={type.value}
                    className={cn(
                      'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                      form.goalType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value={type.value} className="sr-only" />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* 기간 */}
          <div className="space-y-2">
            <Label>기간</Label>
            <Select
              value={form.periodType}
              onValueChange={(v) => setForm({ ...form, periodType: v as PeriodType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">일간</SelectItem>
                <SelectItem value="weekly">주간</SelectItem>
                <SelectItem value="monthly">월간</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {form.periodType === 'daily' && '오늘 하루 동안의 목표'}
              {form.periodType === 'weekly' && '이번 주 (월~일) 목표'}
              {form.periodType === 'monthly' && '이번 달 목표'}
            </p>
          </div>

          {/* 목표 값 */}
          <div className="space-y-2">
            <Label>목표 값</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={form.targetValue || ''}
                onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })}
                placeholder={selectedGoalType?.placeholder}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {selectedGoalType?.unit}
              </span>
            </div>
            {form.goalType === 'revenue' && form.targetValue > 0 && (
              <p className="text-xs text-muted-foreground">
                = {(form.targetValue / 10000).toLocaleString()}만원
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createGoal.isPending || !form.targetValue}
          >
            {createGoal.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
