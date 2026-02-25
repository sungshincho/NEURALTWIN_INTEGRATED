import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, CreditCard, Shield } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"];
const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    display_name: "",
    avatar_url: ""
  });
  const [organization, setOrganization] = useState<any>(null);
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"account" | "subscription" | "notifications" | "security">((() => {
    const tabFromState = (location.state as any)?.tab;
    if (tabFromState === "subscription" || tabFromState === "notifications" || tabFromState === "security" || tabFromState === "account") {
      return tabFromState;
    }
    return "account";
  })());
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      setUserMetadata(user.user_metadata);

      // Get profile
      const {
        data: profileData
      } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (profileData) {
        setProfile({
          display_name: profileData.display_name || user.user_metadata?.display_name || user.user_metadata?.name || "",
          avatar_url: profileData.avatar_url || ""
        });
      } else {
        setProfile({
          display_name: user.user_metadata?.display_name || user.user_metadata?.name || "",
          avatar_url: ""
        });
      }

      // Get organization with subscription info
      const {
        data: orgMember
      } = await supabase.from("organization_members").select(`
          org_id, 
          role, 
          license_id,
          organizations(id, org_name, metadata),
          licenses(license_type, status, monthly_price)
        `).eq("user_id", user.id).maybeSingle();
      if (orgMember && orgMember.organizations) {
        const orgData: any = typeof orgMember.organizations === 'object' ? orgMember.organizations : {};
        setOrganization({
          ...orgData,
          role: orgMember.role,
          license_id: orgMember.license_id,
          license: orgMember.licenses
        });

        // Fetch subscription for organization
        if (orgData.id) {
          const {
            data: subData
          } = await supabase.from('subscriptions').select('*').eq('org_id', orgData.id).maybeSingle();
          if (subData) {
            setSubscription(subData);

            // Fetch all licenses for this subscription
            const {
              data: licenseData
            } = await supabase.from('licenses').select('*').eq('subscription_id', subData.id).order('created_at', {
              ascending: false
            });
            if (licenseData) {
              setLicenses(licenseData);
            }
          }
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "JPG, PNG 또는 GIF 파일만 업로드 가능합니다.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "파일 크기 초과",
        description: "파일 크기는 2MB 이하여야 합니다.",
        variant: "destructive"
      });
      return;
    }
    setSelectedFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
  };
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      let avatarUrl = profile.avatar_url;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        const {
          error: uploadError
        } = await supabase.storage.from('avatars').upload(filePath, selectedFile);
        if (uploadError) {
          throw new Error(`파일 업로드 실패: ${uploadError.message}`);
        }
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }
      const {
        error
      } = await supabase.from("profiles").update({
        display_name: profile.display_name,
        avatar_url: avatarUrl
      }).eq("id", user.id);
      if (error) throw error;

      // Update local state
      setProfile({
        ...profile,
        avatar_url: avatarUrl
      });
      setSelectedFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview(null);
      }
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다."
      });
    } catch (error: any) {
      toast({
        title: "업데이트 실패",
        description: error.message || "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePasswordChange = async () => {
    if (!user?.email) return;
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      toast({
        title: "비밀번호 변경 이메일 전송",
        description: "비밀번호 재설정 링크가 이메일로 전송되었습니다."
      });
    } catch (error: any) {
      toast({
        title: "전송 실패",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다."
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "로그아웃 실패",
        description: error.message || "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>;
  }
  return <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">내 계정 관리</span>
            </h1>
            
          </div>

          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "account" | "subscription" | "notifications" | "security")} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                계정
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                구독
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                알림
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                보안
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              {/* Account Info */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>계정 정보</CardTitle>
                  <CardDescription>
                    회원가입 시 입력한 정보입니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>이메일</Label>
                    <Input value={user?.email || ""} disabled className="mt-2" />
                  </div>
                  <div>
                    <Label>이름</Label>
                    <Input value={userMetadata?.name || userMetadata?.display_name || ""} disabled className="mt-2" />
                  </div>
                  {userMetadata?.company && <div>
                      <Label>회사명</Label>
                      <Input value={userMetadata.company} disabled className="mt-2" />
                    </div>}
                  {userMetadata?.phone && <div>
                      <Label>전화번호</Label>
                      <Input value={userMetadata.phone} disabled className="mt-2" />
                    </div>}
                  {userMetadata?.roleType && <div>
                      <Label>선택한 라이선스 타입</Label>
                      <Input value={userMetadata.roleType === 'HQ' ? 'HQ 라이선스' : 'Store 라이선스'} disabled className="mt-2" />
                    </div>}
                  <div>
                    <Label>가입일</Label>
                    <Input value={user?.created_at ? new Date(user.created_at).toLocaleDateString("ko-KR") : ""} disabled className="mt-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Profile Info */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>프로필 정보</CardTitle>
                  <CardDescription>
                    공개 프로필 정보를 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={filePreview || profile.avatar_url} />
                      <AvatarFallback className="text-2xl">
                        {profile.display_name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".jpg,.jpeg,.png,.gif" className="hidden" />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        사진 변경
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG 또는 GIF (최대 2MB)
                      </p>
                      {selectedFile && <p className="text-sm text-primary">
                          선택됨: {selectedFile.name}
                        </p>}
                    </div>
                  </div>

                  <Separator />

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">표시 이름</Label>
                      <Input id="display_name" value={profile.display_name} onChange={e => setProfile({
                      ...profile,
                      display_name: e.target.value
                    })} placeholder="이름을 입력하세요" />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "저장 중..." : "변경사항 저장"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Organization Info */}
              {organization && <Card className="glass">
                  <CardHeader>
                    <CardTitle>조직 정보</CardTitle>
                    <CardDescription>
                      소속된 조직의 정보입니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>조직명</Label>
                      <Input value={organization.org_name || ""} disabled className="mt-2" />
                    </div>
                    <div>
                      <Label>역할</Label>
                      <Input value={organization.role === 'ORG_HQ' ? 'HQ 관리자' : organization.role === 'ORG_STORE' ? 'Store 관리자' : organization.role === 'ORG_VIEWER' ? 'Viewer' : organization.role === 'NEURALTWIN_MASTER' ? 'NEURALTWIN Master' : organization.role} disabled className="mt-2" />
                    </div>
                    {organization.license && <>
                        <div>
                          <Label>라이선스 타입</Label>
                          <Input value={organization.license.license_type === 'HQ_SEAT' ? 'HQ 라이선스' : 'Store 라이선스'} disabled className="mt-2" />
                        </div>
                        <div>
                          <Label>라이선스 상태</Label>
                          <Input value={organization.license.status === 'active' ? '활성' : organization.license.status === 'assigned' ? '할당됨' : organization.license.status === 'suspended' ? '일시정지' : organization.license.status === 'expired' ? '만료' : organization.license.status} disabled className="mt-2" />
                        </div>
                        {organization.license.monthly_price && <div>
                            <Label>월 요금</Label>
                            <Input value={`$${organization.license.monthly_price}`} disabled className="mt-2" />
                          </div>}
                      </>}
                    {organization.metadata?.country && <div>
                        <Label>국가</Label>
                        <Input value={organization.metadata.country} disabled className="mt-2" />
                      </div>}
                  </CardContent>
                </Card>}

              <Separator />

              {/* Actions */}
              <div className="flex gap-4">
                
                
              </div>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              {subscription ? <>
                  <Card>
                    <CardHeader>
                      <CardTitle>구독 정보</CardTitle>
                      <CardDescription>
                        현재 구독 플랜 및 결제 정보
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {subscription.subscription_type === 'LICENSE_BASED' ? '라이선스 기반 플랜' : '엔터프라이즈 계약'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            월 ${subscription.monthly_cost || 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${subscription.status === 'active' ? 'text-green-600' : subscription.status === 'suspended' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {subscription.status === 'active' ? '활성' : subscription.status === 'suspended' ? '일시정지' : subscription.status === 'cancelled' ? '취소됨' : subscription.status === 'expired' ? '만료' : subscription.status}
                          </p>
                          {subscription.current_period_end && <p className="text-sm text-muted-foreground">
                              다음 결제: {new Date(subscription.current_period_end).toLocaleDateString('ko-KR')}
                            </p>}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">라이선스 현황</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">HQ 라이선스</p>
                            <p className="text-2xl font-bold">{subscription.hq_license_count || 0}</p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Store 라이선스</p>
                            <p className="text-2xl font-bold">{subscription.store_license_count || 0}</p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Viewer</p>
                            <p className="text-2xl font-bold">{subscription.viewer_count || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate("/pricing")}>
                          라이선스 추가 구매
                        </Button>
                        {subscription.status === 'active' && <Button variant="outline" className="text-destructive">
                            구독 취소
                          </Button>}
                      </div>
                    </CardContent>
                  </Card>

                  {licenses.length > 0 && <Card>
                      <CardHeader>
                        <CardTitle>라이선스 목록</CardTitle>
                        <CardDescription>
                          보유한 라이선스 정보입니다
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {licenses.map((license, idx) => <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">
                                  {license.license_type === 'HQ_SEAT' ? 'HQ 라이선스' : 'Store 라이선스'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  월 ${license.monthly_price || 0}
                                </p>
                              </div>
                              <span className={`text-sm px-2 py-1 rounded-full ${license.status === 'active' || license.status === 'assigned' ? 'bg-green-100 text-green-700' : license.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                {license.status === 'active' ? '활성' : license.status === 'assigned' ? '할당됨' : license.status === 'suspended' ? '일시정지' : license.status === 'expired' ? '만료' : license.status === 'revoked' ? '취소됨' : license.status}
                              </span>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>}
                </> : <Card>
                  <CardHeader>
                    <CardTitle>구독 정보 없음</CardTitle>
                    <CardDescription>
                      아직 구독하지 않으셨습니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => navigate("/subscribe")}>
                      구독 시작하기
                    </Button>
                  </CardContent>
                </Card>}
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>알림 설정</CardTitle>
                  <CardDescription>
                    받을 알림의 종류를 선택하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>이메일 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        중요한 업데이트를 이메일로 받습니다
                      </p>
                    </div>
                    <Switch checked={notifications.email} onCheckedChange={checked => setNotifications({
                    ...notifications,
                    email: checked
                  })} />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>푸시 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        브라우저 푸시 알림을 받습니다
                      </p>
                    </div>
                    <Switch checked={notifications.push} onCheckedChange={checked => setNotifications({
                    ...notifications,
                    push: checked
                  })} />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>마케팅 정보</Label>
                      <p className="text-sm text-muted-foreground">
                        새로운 기능 및 프로모션 소식을 받습니다
                      </p>
                    </div>
                    <Switch checked={notifications.marketing} onCheckedChange={checked => setNotifications({
                    ...notifications,
                    marketing: checked
                  })} />
                  </div>

                  <Button>알림 설정 저장</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>비밀번호 변경</CardTitle>
                  <CardDescription>
                    계정 보안을 위해 주기적으로 비밀번호를 변경하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handlePasswordChange}>
                    비밀번호 재설정 이메일 전송
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>세션 관리</CardTitle>
                  <CardDescription>
                    활성화된 로그인 세션을 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">현재 세션</p>
                        <p className="text-sm text-muted-foreground">
                          Chrome on Windows • 서울, 대한민국
                        </p>
                      </div>
                      <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        활성
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">계정 삭제</CardTitle>
                  <CardDescription>
                    계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive">계정 삭제</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Profile;