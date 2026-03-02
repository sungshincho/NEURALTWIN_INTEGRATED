import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** Valid plan keys matching the stripe-checkout Edge Function */
export type PlanKey =
  | "starter_monthly"
  | "starter_annual"
  | "growth_monthly"
  | "growth_annual"
  | "enterprise_monthly"
  | "enterprise_annual";

interface CheckoutOptions {
  planKey: PlanKey;
  orgId: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CheckoutResult {
  url: string;
  session_id: string;
}

/**
 * Hook wrapping the stripe-checkout Supabase Edge Function.
 *
 * Requires an authenticated session — the EF reads the JWT from the
 * Authorization header automatically via `supabase.functions.invoke`.
 */
export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkout = useCallback(
    async ({ planKey, orgId, successUrl, cancelUrl }: CheckoutOptions) => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke<CheckoutResult>(
          "stripe-checkout",
          {
            body: {
              plan_key: planKey,
              org_id: orgId,
              success_url:
                successUrl ?? `${window.location.origin}/dashboard?checkout=success`,
              cancel_url:
                cancelUrl ?? `${window.location.origin}/pricing?checkout=cancelled`,
            },
          },
        );

        if (error) {
          throw new Error(error.message ?? "결제 세션 생성에 실패했습니다.");
        }

        if (!data?.url) {
          throw new Error("Stripe 결제 URL을 받지 못했습니다.");
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다.";

        toast({
          variant: "destructive",
          title: "결제 오류",
          description: message,
        });

        console.error("[useStripeCheckout]", err);
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  return { checkout, isLoading };
};
