/**
 * SettingsPage.tsx
 * 3D Glassmorphism + Monochrome Design
 * 탭 디자인: InsightHubPage와 동일
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Store, Database, Users, Settings, CreditCard, Plus, Mail, Building2, Upload, Link, Eye, Edit, MapPin, Network, Boxes, Plug } from 'lucide-react';
import { ApiConnectionsList, AddConnectorDialog } from '@/features/data-control/components';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useDarkMode } from '@/hooks/useDarkMode';
import { OntologyGraph3D } from '@/features/data-management/ontology/components/OntologyGraph3D';
import { MasterSchemaSync } from '@/features/data-management/ontology/components/MasterSchemaSync';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? { fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.4)' } as React.CSSProperties : { fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } as React.CSSProperties,
  number: isDark ? { fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' } as React.CSSProperties : { fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c' } as React.CSSProperties,
  body: isDark ? { fontWeight: 500, color: 'rgba(255,255,255,0.6)' } as React.CSSProperties : { fontWeight: 500, color: '#515158' } as React.CSSProperties,
});

const Badge3D = ({ children, variant = 'default', dark = false }: { children: React.ReactNode; variant?: 'default' | 'outline' | 'secondary'; dark?: boolean }) => {
  const getStyle = () => {
    if (variant === 'outline') return { background: 'transparent', border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)' };
    if (variant === 'secondary') return { background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)' };
    return { background: dark ? 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)' : 'linear-gradient(145deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 100%)', border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)' };
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: dark ? '#fff' : '#1a1a1f', boxShadow: dark ? 'inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,1)', ...getStyle() }}>{children}</span>;
};

const Button3D = ({ children, onClick, disabled, variant = 'default', size = 'default', dark = false, style = {} }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'default' | 'outline' | 'ghost'; size?: 'default' | 'sm' | 'icon'; dark?: boolean; style?: React.CSSProperties }) => {
  const getVariantStyle = () => {
    if (variant === 'ghost') return { background: 'transparent', border: 'none' };
    if (variant === 'outline') return { background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)' };
    return { background: dark ? 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)' : 'linear-gradient(145deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.88) 100%)', border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)', color: '#fff' };
  };
  const getSizeStyle = () => { if (size === 'icon') return { padding: '8px', minWidth: '32px', height: '32px' }; if (size === 'sm') return { padding: '6px 12px', fontSize: '12px' }; return { padding: '10px 16px', fontSize: '13px' }; };
  return <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.2s', color: dark ? '#fff' : (variant === 'default' ? '#fff' : '#1a1a1f'), boxShadow: variant === 'ghost' ? 'none' : (dark ? 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.08)'), ...getVariantStyle(), ...getSizeStyle(), ...style }}>{children}</button>;
};

const tabs = [
  { value: 'stores', label: '매장 관리', icon: Store },
  { value: 'data', label: '데이터', icon: Database },
  { value: 'users', label: '사용자', icon: Users },
  { value: 'system', label: '시스템', icon: Building2 },
  { value: 'license', label: '플랜', icon: CreditCard },
];

export default function SettingsPage() {
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, orgId, orgName, role, isOrgHQ, isOrgStore } = useAuth();
  const { stores, loading: storesLoading, refreshStores } = useSelectedStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stores');
  const [searchParams] = useSearchParams();
  const isDark = useDarkMode();

  // URL 쿼리 파라미터로 탭 전환 (AI 어시스턴트 연동)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (!tabFromUrl) return;
    const validTabs = ['stores', 'data', 'users', 'system', 'license'];
    if (validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // AI 어시스턴트 모달 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const { modalId } = (e as CustomEvent).detail;
      if (modalId === 'add-store') {
        setActiveTab('stores');
        setStoreDialogOpen(true);
      }
      if (modalId === 'invite-user') {
        setActiveTab('users');
        setInviteDialogOpen(true);
      }
    };
    window.addEventListener('assistant:open-modal', handleOpenModal);
    return () => window.removeEventListener('assistant:open-modal', handleOpenModal);
  }, []);
  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  useEffect(() => { logActivity('page_view', { page: location.pathname, page_name: 'Settings', timestamp: new Date().toISOString() }); }, [location.pathname]);

  const [orgSettings, setOrgSettings] = useState({ timezone: 'Asia/Seoul', currency: 'KRW', logoUrl: '', brandColor: '#1B6BFF' });
  const [notificationSettings, setNotificationSettings] = useState({ emailEnabled: true, slackEnabled: false, slackWebhookUrl: '', notificationTypes: ['stockout', 'anomaly', 'milestone'] });
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [newStore, setNewStore] = useState({ store_name: '', store_code: '', address: '', manager_name: '', manager_email: '' });
  const [importStatus, setImportStatus] = useState({ lastSync: null as any, pendingRows: 0, totalEntities: 0, totalRelations: 0 });
  const [showAddConnector, setShowAddConnector] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      if (!user || !orgId) return;
      const { data: orgSettingsData } = await supabase.from('organization_settings').select('*').eq('org_id', orgId).single();
      if (orgSettingsData) setOrgSettings({ timezone: orgSettingsData.timezone || 'Asia/Seoul', currency: orgSettingsData.currency || 'KRW', logoUrl: orgSettingsData.logo_url || '', brandColor: orgSettingsData.brand_color || '#1B6BFF' });
      const { data: notifData } = await supabase.from('notification_settings').select('*').eq('user_id', user.id).single();
      if (notifData) setNotificationSettings({ emailEnabled: notifData.email_enabled, slackEnabled: notifData.slack_enabled, slackWebhookUrl: notifData.slack_webhook_url || '', notificationTypes: Array.isArray(notifData.notification_types) ? notifData.notification_types.filter((item: any): item is string => typeof item === 'string') : ['stockout', 'anomaly', 'milestone'] });
      const { data: subscriptionData } = await supabase.from('subscriptions').select('*').eq('org_id', orgId).single();
      if (subscriptionData) setSubscriptionInfo(subscriptionData);
      const { data: licensesData } = await supabase.from('licenses').select('*').eq('org_id', orgId).order('created_at', { ascending: false });
      if (licensesData) setLicenses(licensesData);
      const { data: membersData } = await supabase.from('organization_members').select('*, licenses (license_type, status, monthly_price, effective_date, expiry_date)').eq('org_id', orgId).order('created_at', { ascending: false });
      if (membersData) setOrgMembers(membersData);
      const { count: entityCount } = await supabase.from('graph_entities').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: relationCount } = await supabase.from('graph_relations').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setImportStatus({ lastSync: null, pendingRows: 0, totalEntities: entityCount || 0, totalRelations: relationCount || 0 });
    } catch (error) { console.error('Error fetching settings:', error); }
  };

  const saveOrgSettings = async () => { setLoading(true); try { if (!orgId) throw new Error('Organization not found'); const { error } = await supabase.from('organization_settings').upsert({ org_id: orgId, timezone: orgSettings.timezone, currency: orgSettings.currency, logo_url: orgSettings.logoUrl, brand_color: orgSettings.brandColor }); if (error) throw error; toast.success('조직 설정 저장 완료', { description: '조직 설정이 저장되었습니다.' }); } catch (error: any) { toast.error('저장 실패', { description: error.message }); } finally { setLoading(false); } };
  const saveNotificationSettings = async () => { setLoading(true); try { if (!user) throw new Error('User not found'); const { error } = await supabase.from('notification_settings').upsert({ user_id: user.id, email_enabled: notificationSettings.emailEnabled, slack_enabled: notificationSettings.slackEnabled, slack_webhook_url: notificationSettings.slackWebhookUrl, notification_types: notificationSettings.notificationTypes }); if (error) throw error; toast.success('알림 설정 저장 완료', { description: '알림 설정이 저장되었습니다.' }); } catch (error: any) { toast.error('저장 실패', { description: error.message }); } finally { setLoading(false); } };
  const createStore = async () => { setLoading(true); try { if (!orgId || !user) throw new Error('Organization not found'); const { error } = await supabase.from('stores').insert({ store_name: newStore.store_name, store_code: newStore.store_code, address: newStore.address, manager_name: newStore.manager_name, manager_email: newStore.manager_email, user_id: user.id }); if (error) throw error; toast.success('매장 생성 완료', { description: `${newStore.store_name} 매장이 생성되었습니다.` }); setStoreDialogOpen(false); setNewStore({ store_name: '', store_code: '', address: '', manager_name: '', manager_email: '' }); refreshStores(); } catch (error: any) { toast.error('매장 생성 실패', { description: error.message }); } finally { setLoading(false); } };
  const sendViewerInvitation = async () => { if (!inviteEmail || !orgId || !user) return; setLoading(true); try { const token = Math.random().toString(36).substring(2, 15); const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7); const { error } = await supabase.from('invitations').insert({ org_id: orgId, email: inviteEmail, role: 'ORG_VIEWER', invited_by: user.id, token: token, expires_at: expiresAt.toISOString(), status: 'pending' }); if (error) throw error; toast.success('초대 전송 완료', { description: `${inviteEmail}에게 초대가 전송되었습니다.` }); setInviteEmail(''); setInviteDialogOpen(false); } catch (error: any) { toast.error('초대 전송 실패', { description: error.message }); } finally { setLoading(false); } };
  const toggleNotificationType = (type: string) => { const types = [...notificationSettings.notificationTypes]; const index = types.indexOf(type); if (index > -1) { types.splice(index, 1); } else { types.push(type); } setNotificationSettings({ ...notificationSettings, notificationTypes: types }); };

  const getRoleBadge = (roleType: string) => { const labels: Record<string, string> = { NEURALTWIN_MASTER: '마스터', ORG_HQ: '본사', ORG_STORE: '매장', ORG_VIEWER: '뷰어' }; return <Badge3D dark={isDark}>{labels[roleType] || roleType}</Badge3D>; };
  const getLicenseTypeBadge = (type: string) => { const labels: Record<string, string> = { HQ_SEAT: 'HQ', STORE: 'Store' }; return <Badge3D dark={isDark}>{labels[type] || type}</Badge3D>; };
  const getStatusBadge = (status: string) => { const labels: Record<string, string> = { active: '활성', assigned: '할당됨', suspended: '정지', expired: '만료' }; return <Badge3D variant={status === 'active' ? 'default' : 'secondary'} dark={isDark}>{labels[status] || status}</Badge3D>; };

  return (
    <div className="space-y-6">
        {/* Header - InsightHub 스타일과 동일 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Logo - InsightHub와 동일한 3D 스타일 */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(145deg, #2f2f38 0%, #1c1c22 35%, #282830 65%, #1e1e26 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
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
              <Settings
                className="w-6 h-6"
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
                설정 & 관리
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.6)' : '#515158',
                  textShadow: isDark ? 'none' : '0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                시스템 설정, 매장 관리, 사용자 권한
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - InsightHub와 동일한 디자인 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Glass Tab List - InsightHub와 동일 */}
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
                    <tab.icon
                      className="h-4 w-4"
                      style={{
                        color: isActive 
                          ? '#ffffff' 
                          : (isDark ? 'rgba(255,255,255,0.5)' : '#515158'),
                      }}
                    />
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

          <TabsContent value="stores" className="space-y-4 mt-0">
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div><h3 style={{ fontSize: '16px', margin: 0, ...text3D.number }}>매장 목록</h3><p style={{ fontSize: '12px', margin: '4px 0 0 0', ...text3D.body }}>조직에 속한 모든 매장</p></div>
                <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}><DialogTrigger asChild><Button3D size="sm" dark={isDark}><Plus className="w-4 h-4" /> 매장 추가</Button3D></DialogTrigger><DialogContent><DialogHeader><DialogTitle>새 매장 추가</DialogTitle><DialogDescription>새로운 매장 정보를 입력하세요</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>매장명</Label><Input value={newStore.store_name} onChange={(e) => setNewStore({ ...newStore, store_name: e.target.value })} placeholder="강남점" /></div><div className="space-y-2"><Label>매장 코드</Label><Input value={newStore.store_code} onChange={(e) => setNewStore({ ...newStore, store_code: e.target.value })} placeholder="GN001" /></div></div><div className="space-y-2"><Label>주소</Label><Input value={newStore.address} onChange={(e) => setNewStore({ ...newStore, address: e.target.value })} placeholder="서울시 강남구..." /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>매니저 이름</Label><Input value={newStore.manager_name} onChange={(e) => setNewStore({ ...newStore, manager_name: e.target.value })} placeholder="홍길동" /></div><div className="space-y-2"><Label>매니저 이메일</Label><Input value={newStore.manager_email} onChange={(e) => setNewStore({ ...newStore, manager_email: e.target.value })} placeholder="manager@example.com" /></div></div><Button onClick={createStore} disabled={loading} className="w-full">{loading ? '생성 중...' : '매장 생성'}</Button></div></DialogContent></Dialog>
              </div>
              {storesLoading ? <div style={{ textAlign: 'center', padding: '32px 0', ...text3D.body }}>로딩 중...</div> : stores && stores.length > 0 ? (
                <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}><thead><tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)' }}><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>매장명</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>코드</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>주소</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>매니저</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>상태</th><th style={{ padding: '12px 8px' }}></th></tr></thead><tbody>{stores.map((store) => (<tr key={store.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)' }}><td style={{ padding: '12px 8px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{store.store_name}</td><td style={{ padding: '12px 8px' }}><Badge3D variant="outline" dark={isDark}>{store.store_code}</Badge3D></td><td style={{ padding: '12px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...text3D.body }}>{store.address || '-'}</td><td style={{ padding: '12px 8px', ...text3D.body }}>{store.manager_name || '-'}</td><td style={{ padding: '12px 8px' }}><Badge3D variant={(store as any).status === 'active' ? 'default' : 'secondary'} dark={isDark}>{(store as any).status === 'active' ? '운영중' : '비활성'}</Badge3D></td><td style={{ padding: '12px 8px' }}><div style={{ display: 'flex', gap: '4px' }}><Button3D variant="ghost" size="icon" dark={isDark}><Eye className="w-4 h-4" style={{ color: iconColor }} /></Button3D><Button3D variant="ghost" size="icon" dark={isDark}><Edit className="w-4 h-4" style={{ color: iconColor }} /></Button3D></div></td></tr>))}</tbody></table></div>
              ) : <div style={{ textAlign: 'center', padding: '48px 0' }}><MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} /><p style={{ ...text3D.body }}>등록된 매장이 없습니다</p><p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>매장을 추가하여 시작하세요</p></div>}
            </div></GlassCard>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-0">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <GlassCard dark={isDark}><div style={{ padding: '20px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Icon3D size={28} dark={isDark}><Boxes className="w-3.5 h-3.5" style={{ color: iconColor }} /></Icon3D><span style={{ fontSize: '12px', ...text3D.body }}>그래프 엔티티</span></div><p style={{ fontSize: '28px', margin: '0 0 4px 0', ...text3D.heroNumber }}>{importStatus.totalEntities}</p><p style={{ fontSize: '11px', ...text3D.body }}>데이터베이스 저장 엔티티</p></div></GlassCard>
              <GlassCard dark={isDark}><div style={{ padding: '20px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Icon3D size={28} dark={isDark}><Network className="w-3.5 h-3.5" style={{ color: iconColor }} /></Icon3D><span style={{ fontSize: '12px', ...text3D.body }}>그래프 관계</span></div><p style={{ fontSize: '28px', margin: '0 0 4px 0', ...text3D.heroNumber }}>{importStatus.totalRelations}</p><p style={{ fontSize: '11px', ...text3D.body }}>엔티티 간 연결</p></div></GlassCard>
              <GlassCard dark={isDark}><div style={{ padding: '20px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Icon3D size={28} dark={isDark}><Database className="w-3.5 h-3.5" style={{ color: iconColor }} /></Icon3D><span style={{ fontSize: '12px', ...text3D.body }}>데이터 가져오기</span></div><div style={{ border: isDark ? '2px dashed rgba(255,255,255,0.15)' : '2px dashed rgba(0,0,0,0.1)', borderRadius: '10px', padding: '16px', textAlign: 'center', marginBottom: '12px' }}><Upload className="w-6 h-6 mx-auto mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} /><p style={{ fontSize: '11px', ...text3D.body }}>CSV, XLSX 지원</p></div><Button3D variant="outline" size="sm" dark={isDark} style={{ width: '100%' }}>파일 선택</Button3D></div></GlassCard>
            </div>
            <MasterSchemaSync />
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Icon3D size={32} dark={isDark}><Network className="w-4 h-4" style={{ color: iconColor }} /></Icon3D><div><h3 style={{ fontSize: '16px', margin: 0, ...text3D.number }}>온톨로지 스키마 뷰어</h3><p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>리테일 비즈니스 도메인의 엔티티와 관계를 3D 그래프로 시각화</p></div></div><Badge3D variant="outline" dark={isDark}>리테일 전문</Badge3D></div><div style={{ width: '100%', height: '70vh', minHeight: '600px', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)', borderRadius: '12px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)' }}><OntologyGraph3D /></div></div></GlassCard>
            {/* API 연동 - 실제 ApiConnectionsList 컴포넌트 연결 */}
            <GlassCard dark={isDark}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon3D size={32} dark={isDark}><Plug className="w-4 h-4" style={{ color: iconColor }} /></Icon3D>
                    <div>
                      <h3 style={{ fontSize: '16px', margin: 0, ...text3D.number }}>API 연동</h3>
                      <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>외부 시스템 API를 연결하여 데이터를 자동으로 동기화합니다</p>
                    </div>
                  </div>
                  <Button3D size="sm" dark={isDark} onClick={() => setShowAddConnector(true)}>
                    <Plus className="w-4 h-4" /> 커넥터 추가
                  </Button3D>
                </div>
                <ApiConnectionsList
                  orgId={orgId}
                  storeId={stores?.[0]?.id}
                  onAdd={() => setShowAddConnector(true)}
                  onEdit={(id) => navigate(`/data/connectors/${id}`)}
                />
              </div>
            </GlassCard>

            {/* Add Connector Dialog */}
            <AddConnectorDialog
              open={showAddConnector}
              onOpenChange={setShowAddConnector}
              orgId={orgId}
              storeId={stores?.[0]?.id}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-0">
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}><div><h3 style={{ fontSize: '16px', margin: 0, ...text3D.number }}>조직 멤버</h3><p style={{ fontSize: '12px', margin: '4px 0 0 0', ...text3D.body }}>사용자 및 역할 관리</p></div>{(isOrgHQ() || isOrgStore()) && (<Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}><DialogTrigger asChild><Button3D size="sm" dark={isDark}><Mail className="w-4 h-4" /> 사용자 초대</Button3D></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Viewer 초대</DialogTitle><DialogDescription>읽기 전용 권한을 가진 사용자를 초대합니다</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>이메일</Label><Input type="email" placeholder="viewer@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div><Button onClick={sendViewerInvitation} disabled={loading || !inviteEmail} className="w-full">{loading ? '전송 중...' : '초대 전송'}</Button></div></DialogContent></Dialog>)}</div><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}><thead><tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)' }}><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>사용자 ID</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>역할</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>라이선스</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>가입일</th></tr></thead><tbody>{orgMembers.map((member) => (<tr key={member.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)' }}><td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>{member.user_id.substring(0, 8)}...</td><td style={{ padding: '12px 8px' }}>{getRoleBadge(member.role)}</td><td style={{ padding: '12px 8px' }}>{member.licenses ? getLicenseTypeBadge(member.licenses.license_type) : <Badge3D variant="secondary" dark={isDark}>없음</Badge3D>}</td><td style={{ padding: '12px 8px', ...text3D.body }}>{new Date(member.joined_at).toLocaleDateString('ko-KR')}</td></tr>))}</tbody></table></div></div></GlassCard>
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}><h3 style={{ fontSize: '16px', margin: '0 0 16px 0', ...text3D.number }}>역할 설명</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{[{ role: 'ORG_HQ', desc: '조직 관리, 모든 매장 접근 (HQ 라이선스 필요)' }, { role: 'ORG_STORE', desc: '매장 관리 및 데이터 분석 (Store 라이선스 필요)' }, { role: 'ORG_VIEWER', desc: '읽기 전용 권한 (무료)' }].map((item) => (<div key={item.role} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{getRoleBadge(item.role)}<span style={{ fontSize: '13px', ...text3D.body }}>{item.desc}</span></div>))}</div></div></GlassCard>
          </TabsContent>

          <TabsContent value="system" className="space-y-4 mt-0">
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}><h3 style={{ fontSize: '16px', margin: '0 0 4px 0', ...text3D.number }}>조직 정보</h3><p style={{ fontSize: '12px', margin: '0 0 20px 0', ...text3D.body }}>기본 조직 정보</p><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div><Label style={{ fontSize: '12px', ...text3D.body }}>조직 이름</Label><p style={{ fontWeight: 600, margin: '4px 0 0 0', color: isDark ? '#fff' : '#1a1a1f' }}>{orgName || '-'}</p></div><div><Label style={{ fontSize: '12px', ...text3D.body }}>내 역할</Label><div style={{ marginTop: '4px' }}>{getRoleBadge(role || '')}</div></div></div></div></GlassCard>
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}><h3 style={{ fontSize: '16px', margin: '0 0 4px 0', ...text3D.number }}>조직 설정</h3><p style={{ fontSize: '12px', margin: '0 0 20px 0', ...text3D.body }}>타임존, 통화, 브랜딩</p><div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div><Label style={{ fontSize: '12px', marginBottom: '6px', display: 'block', ...text3D.body }}>타임존</Label><Select value={orgSettings.timezone} onValueChange={(v) => setOrgSettings({ ...orgSettings, timezone: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Seoul">Asia/Seoul (KST)</SelectItem><SelectItem value="America/New_York">America/New_York (EST)</SelectItem><SelectItem value="Europe/London">Europe/London (GMT)</SelectItem></SelectContent></Select></div><div><Label style={{ fontSize: '12px', marginBottom: '6px', display: 'block', ...text3D.body }}>통화</Label><Select value={orgSettings.currency} onValueChange={(v) => setOrgSettings({ ...orgSettings, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="KRW">KRW (₩)</SelectItem><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem></SelectContent></Select></div></div><div><Label style={{ fontSize: '12px', marginBottom: '6px', display: 'block', ...text3D.body }}>브랜드 컬러</Label><div style={{ display: 'flex', gap: '8px' }}><Input type="color" value={orgSettings.brandColor} onChange={(e) => setOrgSettings({ ...orgSettings, brandColor: e.target.value })} style={{ width: '64px', height: '40px' }} /><Input value={orgSettings.brandColor} onChange={(e) => setOrgSettings({ ...orgSettings, brandColor: e.target.value })} /></div></div><Button3D onClick={saveOrgSettings} disabled={loading} dark={isDark}>{loading ? '저장 중...' : '변경사항 저장'}</Button3D></div></div></GlassCard>
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}><h3 style={{ fontSize: '16px', margin: '0 0 4px 0', ...text3D.number }}>알림 설정</h3><p style={{ fontSize: '12px', margin: '0 0 20px 0', ...text3D.body }}>이메일/슬랙 알림</p><div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><Label style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>이메일 알림</Label><p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>이메일로 알림을 받습니다</p></div><Switch checked={notificationSettings.emailEnabled} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailEnabled: checked })} /></div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><Label style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>슬랙 알림</Label><p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>슬랙으로 알림을 받습니다</p></div><Switch checked={notificationSettings.slackEnabled} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, slackEnabled: checked })} /></div><div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} /><div><Label style={{ fontSize: '12px', marginBottom: '8px', display: 'block', ...text3D.body }}>알림 유형</Label><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[{ type: 'stockout', label: '재고 부족' }, { type: 'anomaly', label: '이상 탐지' }, { type: 'milestone', label: '목표 달성' }].map((item) => (<div key={item.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Label style={{ fontWeight: 400, color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>{item.label}</Label><Switch checked={notificationSettings.notificationTypes.includes(item.type)} onCheckedChange={() => toggleNotificationType(item.type)} /></div>))}</div></div><Button3D onClick={saveNotificationSettings} disabled={loading} dark={isDark}>{loading ? '저장 중...' : '알림 설정 저장'}</Button3D></div></div></GlassCard>
          </TabsContent>

          <TabsContent value="license" className="space-y-4 mt-0">
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}><h3 style={{ fontSize: '16px', margin: '0 0 4px 0', ...text3D.number }}>구독 정보</h3><p style={{ fontSize: '12px', margin: '0 0 20px 0', ...text3D.body }}>현재 플랜 및 라이선스</p>{subscriptionInfo ? (<><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>{[{ value: subscriptionInfo.hq_license_count || 0, label: 'HQ 라이선스', price: '$500/월' }, { value: subscriptionInfo.store_license_count || 0, label: 'Store 라이선스', price: '$250/월' }, { value: subscriptionInfo.viewer_count || 0, label: 'Viewer', price: '무료' }].map((item) => (<div key={item.label} style={{ textAlign: 'center', padding: '20px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}><p style={{ fontSize: '32px', margin: '0 0 4px 0', ...text3D.heroNumber }}>{item.value}</p><p style={{ fontSize: '12px', margin: 0, ...text3D.body }}>{item.label}</p><p style={{ fontSize: '11px', marginTop: '2px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>{item.price}</p></div>))}</div><div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', margin: '16px 0' }} /><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}><Label style={{ ...text3D.body }}>월 비용</Label><span style={{ fontSize: '24px', ...text3D.heroNumber }}>${subscriptionInfo.monthly_cost?.toLocaleString() || 0}</span></div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Label style={{ ...text3D.body }}>구독 상태</Label>{getStatusBadge(subscriptionInfo.status || 'active')}</div></>) : <div style={{ textAlign: 'center', padding: '32px 0', ...text3D.body }}>구독 정보 없음</div>}</div></GlassCard>
            <GlassCard dark={isDark}><div style={{ padding: '24px' }}><h3 style={{ fontSize: '16px', margin: '0 0 16px 0', ...text3D.number }}>라이선스 목록</h3><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}><thead><tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)' }}><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>라이선스 키</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>타입</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>상태</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>월 비용</th><th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>유효기간</th></tr></thead><tbody>{licenses.map((license) => (<tr key={license.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)' }}><td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>{license.license_key || 'N/A'}</td><td style={{ padding: '12px 8px' }}>{getLicenseTypeBadge(license.license_type)}</td><td style={{ padding: '12px 8px' }}>{getStatusBadge(license.status)}</td><td style={{ padding: '12px 8px', color: isDark ? '#fff' : '#1a1a1f' }}>${license.monthly_price || 0}</td><td style={{ padding: '12px 8px', ...text3D.body }}>{license.expiry_date ? new Date(license.expiry_date).toLocaleDateString('ko-KR') : '무제한'}</td></tr>))}</tbody></table></div>{licenses.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', ...text3D.body }}>발급된 라이선스가 없습니다</div>}</div></GlassCard>
          </TabsContent>
        </Tabs>
      </div>
  );
}
