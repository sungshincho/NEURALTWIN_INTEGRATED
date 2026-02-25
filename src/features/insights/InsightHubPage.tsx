/**
 * InsightHubPage.tsx
 *
 * 통합 인사이트 허브 - 3D Glassmorphism Design
 * 대시보드 + 분석 + AI 추천 + 예측
 * 
 * 수정: 탭 아이콘 색상 + 다크모드 지원
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalDateFilter } from '@/components/common/GlobalDateFilter';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  Boxes,
  TrendingUp,
  Sparkles,
  BarChart3,
} from 'lucide-react';

// Data Provider (통합 데이터소스)
import { InsightDataProvider, InsightTabType, useInsightData } from '@/features/insights/context/InsightDataContext';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// Tab Components
import { OverviewTab } from '@/features/insights/tabs/OverviewTab';
import { StoreTab } from '@/features/insights/tabs/StoreTab';
import { CustomerTab } from '@/features/insights/tabs/CustomerTab';
import { ProductTab } from '@/features/insights/tabs/ProductTab';
import { InventoryTab } from '@/features/insights/tabs/InventoryTab';
import { PredictionTab } from '@/features/insights/tabs/PredictionTab';
import { AIRecommendationTab } from '@/features/insights/tabs/AIRecommendationTab';

// Data Quality Banner (데이터 컨트롤타워 연동)
import { DataQualityBanner } from '@/features/insights/components/DataQualityBanner';

const tabs = [
  { value: 'overview', label: '개요', icon: LayoutDashboard },
  { value: 'store', label: '매장', icon: Store },
  { value: 'customer', label: '고객', icon: Users },
  { value: 'product', label: '상품', icon: Package },
  { value: 'inventory', label: '재고', icon: Boxes },
  { value: 'prediction', label: '예측', icon: TrendingUp },
  { value: 'ai', label: 'AI추천', icon: Sparkles },
];

// 내부 컴포넌트 (Provider 내에서 사용)
function InsightHubContent({ activeTab, setActiveTab }: {
  activeTab: InsightTabType;
  setActiveTab: (tab: InsightTabType) => void;
}) {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    // MutationObserver로 class 변경 감지
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(145deg, #2f2f38 0%, #1c1c22 35%, #282830 65%, #1e1e26 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Chrome highlight */}
              <div
                className="absolute"
                style={{
                  top: '2px',
                  left: '18%',
                  right: '18%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                }}
              />
              <BarChart3
                className="h-5 w-5"
                style={{
                  color: '#ffffff',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                }}
              />
            </div>

            {/* Title */}
            <div>
              <h1
                className="text-2xl"
                style={{
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  ...(isDark ? {
                    color: '#ffffff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  } : {
                    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
                  }),
                }}
              >
                인사이트 허브
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.6)' : '#515158',
                  textShadow: isDark ? 'none' : '0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                실시간 대시보드 + 분석 + AI 추천
              </p>
            </div>
          </div>

          <GlobalDateFilter />
        </div>

      {/* Data Quality Banner */}
      <DataQualityBanner className="mb-2" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InsightTabType)} className="space-y-6">
          {/* Glass Tab List */}
          <div
            className="inline-block rounded-2xl p-[1.5px]"
            style={{
              background: isDark
                ? 'linear-gradient(145deg, rgba(75,75,85,0.8) 0%, rgba(50,50,60,0.6) 50%, rgba(65,65,75,0.8) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.04)',
            }}
          >
            <TabsList
              className="h-auto p-1.5 gap-1"
              style={{
                background: isDark
                  ? 'linear-gradient(165deg, rgba(40,40,50,0.95) 0%, rgba(30,30,40,0.9) 100%)'
                  : 'linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(250,250,254,0.85) 50%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(40px)',
                borderRadius: '15px',
              }}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 data-[state=inactive]:bg-transparent"
                    style={
                      isActive
                        ? {
                            background: 'linear-gradient(145deg, #222228 0%, #2c2c34 45%, #1c1c24 100%)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.14), inset 0 1px 1px rgba(255,255,255,0.1)',
                          }
                        : {
                            background: 'transparent',
                            border: '1px solid transparent',
                          }
                    }
                  >
                    {/* 아이콘 - 단순 color 사용 (gradient 제거) */}
                    <tab.icon
                      className="h-4 w-4"
                      style={{
                        color: isActive 
                          ? '#ffffff' 
                          : (isDark ? 'rgba(255,255,255,0.5)' : '#515158'),
                      }}
                    />
                    {/* 텍스트 - 단순 color 사용 (gradient 제거) */}
                    <span
                      className="hidden sm:inline text-xs font-medium"
                      style={{
                        color: isActive 
                          ? '#ffffff' 
                          : (isDark ? 'rgba(255,255,255,0.5)' : '#515158'),
                        textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                      }}
                    >
                      {tab.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 mt-0">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="store" className="space-y-6 mt-0">
            <StoreTab />
          </TabsContent>

          <TabsContent value="customer" className="space-y-6 mt-0">
            <CustomerTab />
          </TabsContent>

          <TabsContent value="product" className="space-y-6 mt-0">
            <ProductTab />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6 mt-0">
            <InventoryTab />
          </TabsContent>

          <TabsContent value="prediction" className="space-y-6 mt-0">
            <PredictionTab />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-0">
            <AIRecommendationTab />
          </TabsContent>
        </Tabs>
      </div>
  );
}

// 메인 컴포넌트 - Provider로 감싸기
export default function InsightHubPage() {
  const [activeTab, setActiveTab] = useState<InsightTabType>('overview');
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as InsightTabType | null;

  // URL 쿼리 파라미터로 탭 전환 (AI 어시스턴트 연동)
  // 'ai-recommendation' → 'ai' 정규화 (백엔드 호환)
  useEffect(() => {
    if (!tabFromUrl) return;
    const normalizedTab = (tabFromUrl as string) === 'ai-recommendation' ? 'ai' : tabFromUrl;
    if (['overview', 'store', 'customer', 'product', 'inventory', 'prediction', 'ai'].includes(normalizedTab)) {
      setActiveTab(normalizedTab as InsightTabType);
    }
  }, [tabFromUrl]);

  return (
    <DashboardLayout>
      <InsightDataProvider initialTab={activeTab}>
        <InsightHubContentWrapper activeTab={activeTab} setActiveTab={setActiveTab} />
      </InsightDataProvider>
    </DashboardLayout>
  );
}

// Provider와 activeTab 동기화를 위한 래퍼
function InsightHubContentWrapper({ activeTab, setActiveTab }: {
  activeTab: InsightTabType;
  setActiveTab: (tab: InsightTabType) => void;
}) {
  const { setActiveTab: setProviderActiveTab } = useInsightData();

  // activeTab 변경 시 Provider에도 전달
  useEffect(() => {
    setProviderActiveTab(activeTab);
  }, [activeTab, setProviderActiveTab]);

  return <InsightHubContent activeTab={activeTab} setActiveTab={setActiveTab} />;
}
