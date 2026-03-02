import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { PricingCard, type PricingTier } from "@/components/pricing/PricingCard";
import { FeatureComparison } from "@/components/pricing/FeatureComparison";
import { useStripeCheckout, type PlanKey } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/useAuth";
import { trackPageView, trackFunnelStep, trackCTAClick } from "@/lib/analytics";

// ---------------------------------------------------------------------------
// Tier definitions
// ---------------------------------------------------------------------------

const TIERS: PricingTier[] = [
  {
    id: "trial",
    name: "Trial",
    monthlyPrice: 0,
    priceLabel: "무료",
    description: "NeuralTwin을 가볍게 체험해보세요",
    cta: "무료 시작",
    features: [
      { text: "매장 1개", included: true },
      { text: "AI 질의 10회/월", included: true },
      { text: "기본 대시보드", included: true },
      { text: "샘플 데이터 체험", included: true },
      { text: "이메일 지원", included: true },
      { text: "실시간 데이터 수집", included: false },
      { text: "PDF 리포트", included: false },
      { text: "3D 디지털 트윈", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 99_000,
    description: "소규모 매장 운영의 첫걸음",
    cta: "시작하기",
    features: [
      { text: "매장 3개", included: true },
      { text: "AI 질의 무제한", included: true },
      { text: "실시간 데이터 수집", included: true },
      { text: "고객 동선 분석", included: true },
      { text: "일일 요약 리포트", included: true },
      { text: "PDF 리포트 내보내기", included: true },
      { text: "히트맵 분석", included: false },
      { text: "3D 디지털 트윈", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 299_000,
    description: "다점포 운영과 고급 분석",
    cta: "시작하기",
    popular: true,
    features: [
      { text: "매장 50개", included: true },
      { text: "AI 질의 무제한", included: true },
      { text: "히트맵 분석", included: true },
      { text: "POS 연동", included: true },
      { text: "이상 탐지 알림", included: true },
      { text: "수요 예측 (AI)", included: true },
      { text: "주간/월간 자동 리포트", included: true },
      { text: "우선 응대 지원 (24h)", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    priceSuffix: "/월~",
    description: "대규모 유통망을 위한 맞춤 솔루션",
    cta: "문의하기",
    features: [
      { text: "매장 무제한", included: true },
      { text: "AI 질의 무제한", included: true },
      { text: "3D 디지털 트윈 & 시뮬레이션", included: true },
      { text: "전용 AI 모델 튜닝", included: true },
      { text: "API 데이터 내보내기", included: true },
      { text: "커스텀 리포트 빌더", included: true },
      { text: "전담 CSM 매니저", included: true },
      { text: "SLA 보장 (99.9%)", included: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "무료 Trial은 어떻게 시작하나요?",
    answer:
      "회원가입 후 바로 Trial 플랜이 활성화됩니다. 신용카드 등록 없이 14일간 기본 대시보드와 샘플 데이터를 체험할 수 있습니다.",
  },
  {
    question: "연간 결제 시 할인은 어떻게 적용되나요?",
    answer:
      "연간 결제를 선택하면 월 요금 대비 20% 할인된 금액이 적용됩니다. 예를 들어 Starter 플랜의 경우 월 99,000원이 79,200원으로 할인됩니다.",
  },
  {
    question: "플랜을 중간에 변경할 수 있나요?",
    answer:
      "네, 언제든지 상위 플랜으로 업그레이드할 수 있습니다. 업그레이드 시 기존 결제 금액은 일할 계산되어 차액만 청구됩니다. 다운그레이드는 현재 결제 주기 종료 후 적용됩니다.",
  },
  {
    question: "Enterprise 플랜의 가격은 어떻게 결정되나요?",
    answer:
      "Enterprise 플랜은 매장 수, 필요한 기능, 데이터 규모 등에 따라 맞춤 견적을 제공합니다. 문의 양식을 통해 요구사항을 알려주시면 영업일 1일 이내 연락드립니다.",
  },
  {
    question: "IoT 센서 하드웨어는 별도 구매인가요?",
    answer:
      "NeuralSense 센서는 플랜과 별도로 제공됩니다. Starter 이상 플랜 가입 시 초기 센서 키트를 할인된 가격으로 구매할 수 있으며, 설치 지원도 포함됩니다.",
  },
  {
    question: "데이터 보안은 어떻게 보장되나요?",
    answer:
      "모든 데이터는 AWS 서울 리전(ap-northeast-2)에서 암호화되어 저장됩니다. SOC 2 Type II 인증을 준비 중이며, 전송 구간은 TLS 1.3으로 암호화됩니다. Enterprise 플랜에서는 VPC 분리와 전용 인스턴스 옵션도 제공합니다.",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { checkout, isLoading: checkoutLoading } = useStripeCheckout();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView("Pricing");
    trackFunnelStep(1, "view_pricing");
  }, []);

  const handleCtaClick = useCallback(
    async (tier: PricingTier) => {
      trackCTAClick(`pricing_${tier.id}`, tier.id === "trial" ? "/auth" : "/checkout", 3);

      // Trial -> signup
      if (tier.id === "trial") {
        navigate("/auth");
        return;
      }

      // Enterprise -> contact
      if (tier.id === "enterprise") {
        navigate("/contact");
        return;
      }

      // Paid tiers -> Stripe checkout (auth required)
      if (!isAuthenticated || !user) {
        navigate("/auth", { state: { returnTo: "/pricing" } });
        return;
      }

      // Build the plan key
      const billingCycle = isAnnual ? "annual" : "monthly";
      const planKey: PlanKey = `${tier.id}_${billingCycle}` as PlanKey;

      setLoadingTier(tier.id);

      // For the org_id, use the user's id as a fallback.
      // In production this would come from an org selector or user context.
      await checkout({
        planKey,
        orgId: user.id,
      });

      setLoadingTier(null);
    },
    [isAnnual, isAuthenticated, user, checkout, navigate],
  );

  return (
    <div className="min-h-screen">
      <SEOHead
        title="가격"
        description="NeuralTwin의 요금제를 확인하세요. Trial부터 Enterprise까지, 매장 규모에 맞는 최적의 플랜을 제공합니다."
        path="/pricing"
      />
      <Header />

      {/* ===== Hero ===== */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold">
              <span className="gradient-text">합리적인 가격,</span>
              <br />
              <span className="gradient-text">확실한 성과</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              매장 규모에 맞는 플랜을 선택하세요.
              <br className="hidden sm:block" />
              모든 유료 플랜은 14일 무료 체험을 제공합니다.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="mb-12">
            <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
          </div>

          {/* ===== Pricing Cards ===== */}
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4 max-w-7xl mx-auto">
            {TIERS.map((tier) => (
              <PricingCard
                key={tier.id}
                tier={tier}
                isAnnual={isAnnual}
                isLoading={
                  (loadingTier === tier.id) || (checkoutLoading && loadingTier === tier.id)
                }
                onCtaClick={handleCtaClick}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Feature Comparison ===== */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <FeatureComparison />
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-bold">
            <span className="gradient-text">자주 묻는 질문</span>
          </h2>

          <Card className="glass p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_DATA.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="border-border/30"
                >
                  <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </section>

      {/* ===== Bottom CTA ===== */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Card className="glass p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">지금 시작하세요</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              14일 무료 체험으로 NeuralTwin의 강력한 기능을 직접 경험해보세요.
              <br />
              신용카드 없이 바로 시작할 수 있습니다.
            </p>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors glow"
              onClick={() => {
                trackCTAClick("pricing_bottom_cta", "/auth", 3);
                navigate("/auth");
              }}
            >
              무료로 시작하기
            </button>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
