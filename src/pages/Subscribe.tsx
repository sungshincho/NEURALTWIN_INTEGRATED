import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Check, Building2, Store, Eye, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackPageView, trackFunnelStep } from "@/lib/analytics";
import type { LicenseType } from "@/types/auth";

const Subscribe = () => {
  const [searchParams] = useSearchParams();
  const licenseTypeParam = searchParams.get('type') as LicenseType | null;
  
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>(
    licenseTypeParam === 'STORE' ? 'STORE' : 'HQ_SEAT'
  );
  const [quantity, setQuantity] = useState<number | "">(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    trackPageView('Subscribe');
    trackFunnelStep(3, 'view_subscribe');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "구독하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setUserEmail(user.email || "");

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      setUserOrgId(membership.org_id);
    }
  };

  const LICENSE_PRICING = {
    HQ_SEAT: {
      name: 'HQ License',
      price: 1000,
      description: '본사 관리자 • 모든 기능',
      icon: Building2,
      features: [
        '조직 전체 관리',
        '무제한 매장 추가',
        '고급 분석 & AI',
        '멤버 초대 무제한',
        'ETL 파이프라인',
        '커스텀 리포트',
        'API 접근',
        '우선 지원'
      ]
    },
    STORE: {
      name: 'Store License',
      price: 500,
      description: '매장 관리자 • 매장 관리 + 중급 기능',
      icon: Store,
      features: [
        '1개 매장 관리',
        '매장 데이터 입력',
        '중급 분석',
        '기본 AI 추천',
        '표준 리포트',
        '일반 지원'
      ]
    }
  };

  const selectedLicenseData = LICENSE_PRICING[selectedLicense];
  const safeQuantity = typeof quantity === "number" ? quantity : 1;
  const totalCost = selectedLicenseData.price * safeQuantity;
  const monthlyCost = totalCost;

const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;

  // 1) 완전히 지운 상태("")는 그대로 허용
  if (value === "") {
    setQuantity("");
    return;
  }

  // 2) 숫자로 파싱해서 범위 체크
  const num = parseInt(value, 10);

  if (!isNaN(num)) {
    if (num < 1) {
      setQuantity(1);
    } else if (num > 999) {
      setQuantity(999);
    } else {
      setQuantity(num);
    }
  }
};

  const handleCheckout = async () => {
    if (!userOrgId) {
      toast({
        title: "오류",
        description: "조직 정보를 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // TODO: Stripe 결제 연동 (DB 마이그레이션 후 구현)
      // const { data, error } = await supabase.functions.invoke('create-checkout', {
      //   body: {
      //     org_id: userOrgId,
      //     license_type: selectedLicense,
      //     quantity: quantity,
      //     price: selectedLicenseData.price
      //   }
      // });

      // if (error) throw error;
      // if (data?.checkoutUrl) {
      //   window.location.href = data.checkoutUrl;
      // }

      // 임시: 결제 페이지 준비 중 메시지
      toast({
        title: "준비 중입니다",
        description: "결제 시스템이 곧 준비됩니다. 현재는 데모 모드로 운영됩니다.",
      });
      
      // 임시로 대시보드로 이동
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "결제 오류",
        description: error.message || "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="gradient-text">라이선스 구매</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              필요한 라이선스를 선택하고 수량을 지정하세요
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {/* License Selection */}
            <div className="md:col-span-2 space-y-6">
              {/* License Type Selection */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>1. 라이선스 타입 선택</CardTitle>
                  <CardDescription>
                    HQ 라이선스는 본사 관리자용, Store 라이선스는 매장 관리자용입니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedLicense}
                    onValueChange={(value) => setSelectedLicense(value as LicenseType)}
                    className="space-y-4"
                  >
                    {(Object.keys(LICENSE_PRICING) as LicenseType[]).map((type) => {
                      const license = LICENSE_PRICING[type];
                      const Icon = license.icon;
                      
                      return (
                        <div key={type} className="relative">
                          <RadioGroupItem
                            value={type}
                            id={type}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type}
                            className="flex cursor-pointer rounded-lg border-2 border-border p-6 hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                          >
                            <div className="flex-1 flex items-start gap-4">
                              <div className="rounded-lg p-3 bg-primary/10">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold text-lg">{license.name}</h3>
                                    <p className="text-sm text-muted-foreground">{license.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold gradient-text">
                                      ${license.price}
                                    </div>
                                    <div className="text-xs text-muted-foreground">/ 라이선스 / 월</div>
                                  </div>
                                </div>
                                <ul className="grid grid-cols-2 gap-2 text-sm mt-4">
                                  {license.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Quantity Selection */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>2. 라이선스 수량 선택</CardTitle>
                  <CardDescription>
                    구매할 라이선스 개수를 입력하세요 (나중에 추가 구매 가능)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label htmlFor="quantity" className="w-20">수량</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        max={999}
                        value={quantity === "" ? "" : quantity}
                        onChange={handleQuantityChange}
                        className="max-w-[120px]"
                      />
                      <span className="text-sm text-muted-foreground">
                        개 × ${selectedLicenseData.price} = ${totalCost}/월
                      </span>
                    </div>
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm">
                          <span className="font-semibold">{safeQuantity}개</span>의 {selectedLicenseData.name}를 구매합니다.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          라이선스는 구매 후 조직 멤버에게 할당할 수 있습니다.
                        </p>
                      </div>
      
                  </div>
                </CardContent>
              </Card>

              {/* Viewer Info */}
              <Card className="glass border-primary/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg p-3 bg-primary/10">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Viewer는 무료입니다</h3>
                      <p className="text-sm text-muted-foreground">
                        HQ 또는 Store 라이선스 보유자는 읽기 전용 Viewer를 무료로 초대할 수 있습니다.
                        Viewer는 데이터 조회만 가능하며, 수정 권한은 없습니다.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <Card className="glass sticky top-24">
                <CardHeader>
                  <CardTitle>주문 요약</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">라이선스 타입</span>
                      <span className="font-medium">{selectedLicenseData.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">단가</span>
                      <span className="font-medium">${selectedLicenseData.price}/월</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">수량</span>
                      <span className="font-medium">{safeQuantity}개</span>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">월 비용</span>
                      <span className="text-2xl font-bold gradient-text">
                        ${monthlyCost}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      매월 자동 청구됩니다
                    </p>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full glow"
                    size="lg"
                  >
                    {isLoading ? "처리 중..." : (
                      <>
                        결제하기
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>✓ 언제든지 취소 가능</p>
                    <p>✓ 라이선스 추가/제거 가능</p>
                    <p>✓ 안전한 결제 (Stripe)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enterprise Contact */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="glass text-center p-8">
              <h2 className="text-2xl font-bold mb-4">
                <span className="gradient-text">Enterprise</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                대규모 조직을 위한 맞춤형 계약 및 전담 지원이 필요하신가요?
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/contact")}
              >
                Enterprise 문의하기
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Subscribe;
