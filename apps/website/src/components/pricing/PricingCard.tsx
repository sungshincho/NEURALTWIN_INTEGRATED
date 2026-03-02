import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingTier {
  /** Internal tier id used for analytics / plan-key construction */
  id: "trial" | "starter" | "growth" | "enterprise";
  name: string;
  /** Monthly price in KRW — null means "custom / 문의" */
  monthlyPrice: number | null;
  /** Optional label override (e.g. "무료", "문의") */
  priceLabel?: string;
  /** Suffix displayed next to the price (e.g. "/월") */
  priceSuffix?: string;
  description: string;
  features: PricingFeature[];
  cta: string;
  popular?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
  isAnnual: boolean;
  isLoading?: boolean;
  onCtaClick: (tier: PricingTier) => void;
}

/** Format KRW price to a readable string with commas */
const formatPrice = (price: number) =>
  new Intl.NumberFormat("ko-KR").format(price);

export const PricingCard = ({
  tier,
  isAnnual,
  isLoading = false,
  onCtaClick,
}: PricingCardProps) => {
  const displayPrice =
    tier.monthlyPrice !== null
      ? isAnnual
        ? Math.round(tier.monthlyPrice * 0.8) // 20% discount
        : tier.monthlyPrice
      : null;

  return (
    <Card
      className={cn(
        "glass relative flex flex-col p-8 transition-all duration-300 hover:scale-[1.02]",
        tier.popular && "border-2 border-primary glow",
      )}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
          인기
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold">{tier.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
      </div>

      {/* Price */}
      <div className="mb-8">
        {tier.priceLabel ? (
          <span className="text-5xl font-bold gradient-text">
            {tier.priceLabel}
          </span>
        ) : displayPrice !== null ? (
          <>
            <span className="text-lg font-medium text-muted-foreground">
              &#8361;
            </span>
            <span className="text-5xl font-bold gradient-text">
              {formatPrice(displayPrice)}
            </span>
            <span className="text-muted-foreground ml-1">
              {tier.priceSuffix ?? "/월"}
            </span>

            {isAnnual && tier.monthlyPrice !== null && (
              <div className="mt-1 text-xs text-muted-foreground">
                <span className="line-through">
                  &#8361;{formatPrice(tier.monthlyPrice)}/월
                </span>
                <span className="ml-2 text-primary font-semibold">연 20% 절약</span>
              </div>
            )}
          </>
        ) : (
          <span className="text-4xl font-bold text-muted-foreground">문의</span>
        )}
      </div>

      {/* Features */}
      <ul className="mb-8 flex-grow space-y-3">
        {tier.features.map((feat, idx) => (
          <li key={idx} className="flex items-start gap-3">
            {feat.included ? (
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            ) : (
              <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground/40" />
            )}
            <span
              className={cn(
                "text-sm",
                !feat.included && "text-muted-foreground/60",
              )}
            >
              {feat.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        className={cn("w-full", tier.popular && "glow")}
        variant={tier.popular ? "default" : "outline"}
        size="lg"
        disabled={isLoading}
        onClick={() => onCtaClick(tier)}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            처리 중...
          </>
        ) : (
          tier.cta
        )}
      </Button>
    </Card>
  );
};
