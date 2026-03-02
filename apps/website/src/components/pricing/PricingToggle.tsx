import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: (annual: boolean) => void;
}

export const PricingToggle = ({ isAnnual, onToggle }: PricingToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          !isAnnual ? "text-foreground" : "text-muted-foreground",
        )}
      >
        월간 결제
      </span>

      <Switch
        checked={isAnnual}
        onCheckedChange={onToggle}
        aria-label="연간 결제 토글"
      />

      <span
        className={cn(
          "text-sm font-medium transition-colors",
          isAnnual ? "text-foreground" : "text-muted-foreground",
        )}
      >
        연간 결제
      </span>

      {/* Discount badge */}
      <span
        className={cn(
          "ml-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all",
          isAnnual
            ? "bg-primary/20 text-primary scale-100"
            : "bg-muted text-muted-foreground scale-95 opacity-60",
        )}
      >
        20% 할인
      </span>
    </div>
  );
};
