import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Brain,
  TrendingUp,
  Zap,
  LineChart,
  ArrowRight,
  Database,
  Clock,
  Layers,
  Network,
  Shield,
  Box,
} from "lucide-react";
import { FootfallVisualizer3D } from "@/components/features/FootfallVisualizer3D";
import { LayoutSimulator3D } from "@/components/features/LayoutSimulator3D";
import { TrafficHeatmap3D } from "@/components/features/TrafficHeatmap3D";
import { DemandForecast } from "@/components/features/DemandForecast";
import { HQStoreSync } from "@/components/features/HQStoreSync";
import { ConversionFunnel } from "@/components/features/ConversionFunnel";
import { ProductPerformance } from "@/components/features/ProductPerformance";
import { InventoryOptimizer } from "@/components/features/InventoryOptimizer";
import { StaffEfficiency } from "@/components/features/StaffEfficiency";
import { useEffect } from "react";
import { trackPageView, trackMiniFeature, trackFunnelStep } from "@/lib/analytics";
import { useTranslation } from "react-i18next";

import dashboardStoreImage from "@/assets/dashboard-store-license.png";
import dashboardHQImage from "@/assets/dashboard-hq-license.png";
import dashboardEnterpriseImage from "@/assets/dashboard-enterprise-license.png";
import iotSensorImage from "@/assets/iot-sensor-device.png";
import storeDataIntegrationImage from "@/assets/dashboard-store-multi-data.png";
import store3DImage from "@/assets/store-3d-overview.png";
import hqDataIntegrationImage from "@/assets/hq-data-integration.png";
import storeAnalyticsImage from "@/assets/dashboard-store-analytics.png";

const Product = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // Track page view with funnel step 2 (mini-features)
    trackPageView("Product", 2);
    trackFunnelStep(2, "view_product");
  }, []);

  // Handle state-based or hash-based scrolling (instant, no animation)
  useEffect(() => {
    const scrollTarget = location.state?.scrollTo || (location.hash ? location.hash.replace("#", "") : null);
    if (scrollTarget) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const element = document.getElementById(scrollTarget);
        if (element) {
          element.scrollIntoView({ behavior: "instant" });
        }
      });
    }
  }, [location.state, location.hash]);

  const handleFeatureInteraction = (featureId: string) => {
    trackMiniFeature(featureId, "interact");
  };

  const pillars = [
    { icon: BarChart3, titleKey: "analyze", descKey: "analyze" },
    { icon: Brain, titleKey: "predict", descKey: "predict" },
    { icon: TrendingUp, titleKey: "forecast", descKey: "forecast" },
    { icon: Zap, titleKey: "simulate", descKey: "simulate" },
    { icon: LineChart, titleKey: "optimize", descKey: "optimize" },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-12 animate-fade-in-up">
            <div className="text-center space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="gradient-text">{t("product.hero.title")}</span>
              </h1>

              {/* Summary */}
              <Card className="glass p-8 max-w-4xl mx-auto">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-semibold">NEURALTWIN</span>
                  {t("product.hero.subtitle")}
                  <br />
                  <br />
                  {t("product.hero.description")}
                  <span className="gradient-text font-semibold"> {t("product.hero.description2")}</span>
                  {t("product.hero.description3")}
                </p>
              </Card>
            </div>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <Card className="glass p-8 text-center hover:scale-105 transition-smooth">
                <div className="text-4xl font-bold gradient-text mb-3">{t("product.hero.benefits.sales.value")}</div>
                <h3 className="text-lg font-semibold mb-2">{t("product.hero.benefits.sales.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("product.hero.benefits.sales.description")}</p>
              </Card>
              <Card className="glass p-8 text-center hover:scale-105 transition-smooth">
                <div className="text-4xl font-bold gradient-text mb-3">{t("product.hero.benefits.realtime.value")}</div>
                <h3 className="text-lg font-semibold mb-2">{t("product.hero.benefits.realtime.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("product.hero.benefits.realtime.description")}</p>
              </Card>
              <Card className="glass p-8 text-center hover:scale-105 transition-smooth">
                <div className="text-4xl font-bold gradient-text mb-3">
                  {t("product.hero.benefits.visibility.value")}
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("product.hero.benefits.visibility.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("product.hero.benefits.visibility.description")}</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Pillars */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t("product.pillars.analyze")} · {t("product.pillars.predict")} · {t("product.pillars.forecast")} · {t("product.pillars.simulate")} · {t("product.pillars.optimize")}
          </h2>
          <div className="grid md:grid-cols-5 gap-6">
            {pillars.map((pillar, index) => (
              <Card
                key={index}
                className="glass p-6 text-center hover:scale-105 transition-smooth animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <pillar.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{t(`product.pillars.${pillar.titleKey}`)}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* License Dashboard Features Section */}
      <section id="license-features" className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Features Section */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                <span className="gradient-text">{t("product.licenses.dashboardFeatures.title")}</span>
              </h3>
              <p className="text-muted-foreground">{t("product.licenses.dashboardFeatures.subtitle")}</p>
            </div>

            {/* Store License Content */}
            <div className="space-y-16">
              {/* 1. 데이터수집 */}
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-1 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                    <span className="text-primary font-bold text-base">01</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">데이터수집</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    매장 내 IoT 센서를 통해 실시간으로
                    <br />
                    고객 동선,체류 시간,상품관심도등의 데이터를 수집합니다.
                    <br />
                    정확한 데이터 수집이 모든 분석의 시작입니다.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">실시간 고객 동선 추적</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">상품별 관심도 측정</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">체류 시간 분석</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-2 glass p-3 rounded-2xl">
                  <img src={iotSensorImage} alt="IoT 센서 데이터 수집" className="w-full rounded-lg" />
                </div>
              </div>

              {/* 2. 데이터 통합 관리 */}
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                <div className="order-2 lg:order-1 lg:col-span-2 glass p-3 rounded-2xl">
                  <img src={storeDataIntegrationImage} alt="데이터 통합 관리" className="w-full rounded-lg" />
                </div>
                <div className="order-1 lg:order-2 lg:col-span-1 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                    <span className="text-primary font-bold text-base">02</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">데이터 통합 관리</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    수집된 매장 데이터를 실시간으로
                    <br />
                    통합하여 대시보드에 시각화합니다.
                    <br />
                    단일 매장 운영에 최적화된 인사이트를 제공합니다.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">실시간 매장 데이터 통합</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">직관적인 대시보드</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">기본 분석 리포트</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 3. 매장 현황 분석 */}
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-1 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                    <span className="text-primary font-bold text-base">03</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">매장 현황 분석</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    매장의 현재 상황을 정확하게 파악합니다.
                    <br />
                    일일 매출, 고객 행동, 재고 현황 등
                    <br />
                    매장 운영에 필요한 핵심지표를 분석합니다.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">일일 매출 추이 분석</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">고객 행동 패턴 파악</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">재고 현황 모니터링</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-2 glass p-3 rounded-2xl">
                  <img src={storeAnalyticsImage} alt="매장 현황 분석 대시보드" className="w-full rounded-lg" />
                </div>
              </div>

              {/* 4. 시뮬레이션을 통한 사전 검증 */}
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                <div className="order-2 lg:order-1 lg:col-span-2 glass p-3 rounded-2xl">
                  <img src={store3DImage} alt="시뮬레이션을 통한 사전 검증" className="w-full rounded-lg" />
                </div>
                <div className="order-1 lg:order-2 lg:col-span-1 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                    <span className="text-primary font-bold text-base">04</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">시뮬레이션을 통한 사전 검증</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    매장 레이아웃 변경이나 상품 배치 최적화를
                    <br />
                    사전에 시뮬레이션합니다.
                    <br />
                    실제 적용 전 효과를 미리 확인할 수 있습니다.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">기본 레이아웃 시뮬레이션</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">상품 배치 최적화</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm text-muted-foreground">매출 변화 예측</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center mt-12">
              <Button size="lg" asChild className="group">
                <Link to="/contact">
                  {t("product.licenses.consultCta")}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mini-Features */}
      <section id="mini" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("product.miniFeatures.title")}</h2>
            <p className="text-xl text-muted-foreground">{t("product.miniFeatures.subtitle")}</p>
          </div>

          {/* 3D Space Analytics */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                <span className="gradient-text">{t("product.miniFeatures.sections.spatial.title")}</span>
              </h3>
              <p className="text-lg text-muted-foreground">{t("product.miniFeatures.sections.spatial.subtitle")}</p>
            </div>

            <div className="glass p-4 sm:p-8 rounded-3xl">
              <Tabs defaultValue="footfall" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 items-center h-auto gap-1">
                  <TabsTrigger
                    value="footfall"
                    className="self-center text-xs sm:text-sm px-2 py-2 whitespace-normal h-auto leading-tight"
                    onClick={() => handleFeatureInteraction("footfall-visualizer")}
                  >
                    {t("product.miniFeatures.tabs.footfall.title")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="layout"
                    className="self-center text-xs sm:text-sm px-2 py-2 whitespace-normal h-auto leading-tight"
                    onClick={() => handleFeatureInteraction("layout-simulator")}
                  >
                    {t("product.miniFeatures.tabs.layout.title")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="heatmap"
                    className="self-center text-xs sm:text-sm px-2 py-2 whitespace-normal h-auto leading-tight"
                    onClick={() => handleFeatureInteraction("traffic-heatmap")}
                  >
                    {t("product.miniFeatures.tabs.heatmap.title")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="footfall" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.footfall.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.footfall.description")}</p>
                  </div>
                  <FootfallVisualizer3D />
                </TabsContent>

                <TabsContent value="layout" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.layout.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.layout.description")}</p>
                  </div>
                  <LayoutSimulator3D />
                </TabsContent>

                <TabsContent value="heatmap" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.heatmap.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.heatmap.description")}</p>
                  </div>
                  <TrafficHeatmap3D />
                </TabsContent>
              </Tabs>

              <div className="flex justify-center mt-8">
                <Button asChild size="lg">
                  <Link to="/contact">
                    {t("product.miniFeatures.sections.spatial.cta")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* 2D Data Analytics */}
          <div>
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                <span className="gradient-text">{t("product.miniFeatures.sections.analytics.title")}</span>
              </h3>
              <p className="text-lg text-muted-foreground">{t("product.miniFeatures.sections.analytics.subtitle")}</p>
            </div>

            <div className="glass p-8 rounded-3xl">
              <Tabs defaultValue="demand" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8 items-center">
                  <TabsTrigger
                    value="demand"
                    className="self-center"
                    onClick={() => handleFeatureInteraction("demand-forecast")}
                  >
                    {t("product.miniFeatures.tabs.demand.title")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="funnel"
                    className="self-center"
                    onClick={() => handleFeatureInteraction("conversion-funnel")}
                  >
                    {t("product.miniFeatures.tabs.funnel.title")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="product"
                    className="self-center"
                    onClick={() => handleFeatureInteraction("product-performance")}
                  >
                    {t("product.miniFeatures.tabs.product.title")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="inventory"
                    className="self-center"
                    onClick={() => handleFeatureInteraction("inventory-optimizer")}
                  >
                    {t("product.miniFeatures.tabs.inventory.title")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="staff"
                    className="self-center"
                    onClick={() => handleFeatureInteraction("staff-efficiency")}
                  >
                    {t("product.miniFeatures.tabs.staff.title")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="hq"
                    className="self-center"
                    onClick={() => handleFeatureInteraction("hq-store-sync")}
                  >
                    {t("product.miniFeatures.tabs.hq.title")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="demand" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.demand.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.demand.description")}</p>
                  </div>
                  <DemandForecast />
                </TabsContent>

                <TabsContent value="funnel" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.funnel.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.funnel.description")}</p>
                  </div>
                  <ConversionFunnel />
                </TabsContent>

                <TabsContent value="product" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.product.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.product.description")}</p>
                  </div>
                  <ProductPerformance />
                </TabsContent>

                <TabsContent value="inventory" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.inventory.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.inventory.description")}</p>
                  </div>
                  <InventoryOptimizer />
                </TabsContent>

                <TabsContent value="staff" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.staff.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.staff.description")}</p>
                  </div>
                  <StaffEfficiency />
                </TabsContent>

                <TabsContent value="hq" className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{t("product.miniFeatures.tabs.hq.title")}</h4>
                    <p className="text-muted-foreground mb-6">{t("product.miniFeatures.tabs.hq.description")}</p>
                  </div>
                  <HQStoreSync />
                </TabsContent>
              </Tabs>

              <div className="flex justify-center mt-8">
                <Button asChild size="lg">
                  <Link to="/contact">
                    {t("product.licenses.cta")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="technology-pipeline" className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">{t("product.technology.title")}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto whitespace-pre-line">
              {t("product.technology.subtitle")}
            </p>
          </div>

          {/* Technology Pipeline */}
          <div className="max-w-7xl mx-auto space-y-12">
            {/* NEURALSENSE */}
            <Card className="glass p-10 hover:scale-[1.02] transition-smooth group border-primary/20">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="lg:w-1/3">
                  <div className="w-24 h-24 mx-auto lg:mx-0 rounded-3xl bg-gradient-to-br from-gray-700/30 to-gray-800/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow">
                    <Layers className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                    {t("product.technology.neuralsense.title")}
                  </h3>
                  <p className="text-lg text-gray-600/90 font-semibold mb-4">
                    {t("product.technology.neuralsense.subtitle")}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("product.technology.neuralsense.description")}
                  </p>
                </div>

                <div className="lg:w-2/3 grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <Database className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuralsense.features.b2b.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuralsense.features.b2b.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <Network className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuralsense.features.iot.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuralsense.features.iot.description")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <Clock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuralsense.features.external.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuralsense.features.external.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <Shield className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuralsense.features.realtime.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuralsense.features.realtime.description")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Arrow Connector */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-1 h-12 bg-gradient-to-b from-primary/50 to-primary animate-pulse"></div>
                <ArrowRight className="w-8 h-8 text-primary rotate-90" />
              </div>
            </div>

            {/* NEURALMIND */}
            <Card className="glass p-10 hover:scale-[1.02] transition-smooth group border-primary/40 glow">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="lg:w-1/3">
                  <div className="w-24 h-24 mx-auto lg:mx-0 rounded-3xl bg-gradient-to-br from-gray-700/40 to-gray-800/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow">
                    <Brain className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                    {t("product.technology.neuralmind.title")}
                  </h3>
                  <p className="text-lg text-gray-600/90 font-semibold mb-4">
                    {t("product.technology.neuralmind.subtitle")}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("product.technology.neuralmind.description")}
                  </p>
                </div>

                <div className="lg:w-2/3 grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <TrendingUp className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuralmind.features.demand.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuralmind.features.demand.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <BarChart3 className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuralmind.features.behavior.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuralmind.features.behavior.description")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <Zap className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuralmind.features.optimization.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuralmind.features.optimization.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <Brain className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuralmind.features.anomaly.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuralmind.features.anomaly.description")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Arrow Connector */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-1 h-12 bg-gradient-to-b from-primary/50 to-primary animate-pulse"></div>
                <ArrowRight className="w-8 h-8 text-primary rotate-90" />
              </div>
            </div>

            {/* NEURALTWIN */}
            <Card className="glass p-10 hover:scale-[1.02] transition-smooth group border-primary/20">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="lg:w-1/3">
                  <div className="w-24 h-24 mx-auto lg:mx-0 rounded-3xl bg-gradient-to-br from-gray-700/30 to-gray-800/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow">
                    <Zap className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                    {t("product.technology.neuraltwin.title")}
                  </h3>
                  <p className="text-lg text-gray-600/90 font-semibold mb-4">
                    {t("product.technology.neuraltwin.subtitle")}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("product.technology.neuraltwin.description")}
                  </p>
                </div>

                <div className="lg:w-2/3 grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <BarChart3 className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuraltwin.features.scenario.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuraltwin.features.scenario.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <Layers className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuraltwin.features.simulation.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuraltwin.features.simulation.description")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <Network className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuraltwin.features.enterprise.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuraltwin.features.enterprise.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/5 border border-gray-700/10">
                      <LineChart className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          {t("product.technology.neuraltwin.features.report.title")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("product.technology.neuraltwin.features.report.description")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Product;
