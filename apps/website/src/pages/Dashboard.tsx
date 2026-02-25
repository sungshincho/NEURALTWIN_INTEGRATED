import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, Store, Box } from "lucide-react";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);

      // Load organization info
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('org_id, role, organizations(id, org_name)')
        .eq('user_id', session.user.id)
        .single();

      if (orgMember && orgMember.organizations) {
        setOrganization({
          ...orgMember.organizations,
          role: orgMember.role
        });

        // Load subscription info
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('org_id', orgMember.org_id)
          .single();

        if (subData) {
          setSubscription(subData);
        }
      }

      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleOpenDashboard = async () => {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No active session');
        return;
      }

      // Open dashboard with token
      const dashboardUrl = `https://neuraltwintest.app?token=${session.access_token}`;
      window.open(dashboardUrl, '_blank');
    } catch (error) {
      console.error('Error opening dashboard:', error);
    }
  };

  const isSubscriptionActive = subscription?.status === 'active';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {t("welcome")}, {user?.user_metadata?.name || user?.email?.split("@")[0]}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {organization?.org_name} · {organization?.role === 'ORG_OWNER' ? '소유자' : organization?.role === 'ORG_ADMIN' ? '관리자' : '멤버'}
            </p>
          </div>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                {isSubscriptionActive && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    활성
                  </span>
                )}
              </div>
              <CardTitle className="mt-4">고객 대시보드</CardTitle>
              <CardDescription>실시간 매장 분석 및 고객 동선 추적</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={handleOpenDashboard}
                disabled={!isSubscriptionActive}
              >
                대시보드 열기
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
              {!isSubscriptionActive && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  구독이 필요합니다
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>구독 정보</CardTitle>
              <CardDescription>
                {subscription ? (
                  subscription.status === 'active' ? '활성 구독을 사용 중입니다' : '구독이 활성화되지 않았습니다'
                ) : (
                  '구독 정보를 불러오는 중...'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">구독 상태</p>
                      <p className="font-medium capitalize">{subscription.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">월 비용</p>
                      <p className="font-medium">${subscription.monthly_cost?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">다음 결제일</p>
                      <p className="font-medium">
                        {new Date(subscription.current_period_end).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/profile", { state: { tab: "subscription" } })}>
                      구독 관리
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
