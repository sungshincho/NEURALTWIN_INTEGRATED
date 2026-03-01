import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { trackPageView, trackFunnelStep } from "@/lib/analytics";
import { useTranslation } from "react-i18next";
import "@/styles/auth.css";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Extract redirect_to from query parameters for post-login navigation
  const searchParams = new URLSearchParams(location.search);
  const rawRedirect = searchParams.get('redirect_to');
  // Safety: only allow internal paths (starting with /) to prevent open redirect
  const safeRedirect = rawRedirect && rawRedirect.startsWith('/') ? rawRedirect : '/os/insights';

  const [activeTab, setActiveTab] = useState<"login" | "signup">((location.state as any)?.tab === "signup" ? "signup" : "login");
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // === Intro animation state (chat/contact/about 동일 패턴) ===
  const [introDone, setIntroDone] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);

  // 혹시 /auth 페이지에 있는 상태에서 다시 회원가입 버튼을 눌렀을 때도 반응하도록
  useEffect(() => {
    const tabFromState = (location.state as any)?.tab;
    if (tabFromState === "login" || tabFromState === "signup") {
      setActiveTab(tabFromState);
    }
  }, [location]);
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [roleType, setRoleType] = useState<"HQ" | "STORE">("HQ");
  const ensureOrganizationAndNavigate = async (session: any) => {
    try {
      const {
        data: orgMember,
        error: orgMemberError
      } = await supabase.from('organization_members').select('org_id').eq('user_id', session.user.id).maybeSingle();
      if (orgMemberError) {
        console.error("Error fetching organization member:", orgMemberError);
      }
      let orgId = orgMember?.org_id;

      // If no organization exists, find or create organization
      if (!orgId) {
        const companyName = session.user.user_metadata?.company || session.user.user_metadata?.name || session.user.user_metadata?.full_name || (session.user.email ? session.user.email.split("@")[0] : "내 조직");

        // Check if organization with this name already exists
        const {
          data: existingOrg,
          error: searchError
        } = await supabase.from('organizations').select('id').eq('org_name', companyName).maybeSingle();
        if (searchError && searchError.code !== 'PGRST116') {
          console.error("Error searching organization:", searchError);
        }
        if (existingOrg) {
          // Join existing organization
          orgId = existingOrg.id;
        } else {
          // Create new organization
          const {
            data: newOrg,
            error: orgError
          } = await supabase.from('organizations').insert({
            org_name: companyName,
            created_by: session.user.id,
            metadata: {
              country: 'KR'
            }
          }).select('id').maybeSingle();
          if (orgError || !newOrg) {
            console.error("Error creating organization:", orgError);
            throw orgError || new Error('조직 생성에 실패했습니다.');
          }
          orgId = newOrg.id;
        }

        // Determine role from user metadata
        const userRoleType = session.user.user_metadata?.roleType || 'HQ';
        const userRole = userRoleType === 'HQ' ? 'ORG_HQ' : 'ORG_STORE';

        // Add user to organization with selected role
        const {
          error: memberError
        } = await supabase.from('organization_members').insert({
          user_id: session.user.id,
          org_id: orgId,
          role: userRole
        });
        if (memberError) {
          console.error("Error creating organization member:", memberError);
          // 특정 권한 오류(예: permission denied for table users)는 치명적 오류로 보지 않고 계속 진행
          if (memberError.code !== '42501') {
            throw memberError;
          }
        }
      }

      // Check if user has an active subscription
      const {
        data: subscription,
        error: subError
      } = await supabase.from('subscriptions').select('id').eq('org_id', orgId).eq('status', 'active').maybeSingle();
      if (subError) {
        console.error("Error fetching subscription:", subError);
      }

      // --- Session Handover: link anonymous chat history to authenticated user ---
      const chatSessionId = localStorage.getItem('neuraltwin_chat_session_id');
      if (chatSessionId && session.access_token) {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          await fetch(`${supabaseUrl}/functions/v1/unified-chatbot`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': supabaseKey,
            },
            body: JSON.stringify({
              action: 'handover_session',
              sessionId: chatSessionId,
            }),
          });
        } catch (e) {
          console.warn('[SessionHandover] Failed:', e);
        }
      }

      if (subscription) {
        navigate(safeRedirect);
      } else {
        navigate("/subscribe");
      }
    } catch (error) {
      console.error("Error ensuring organization and subscription:", error);
      toast({
        title: "오류 발생",
        description: "조직 또는 구독 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  };

  // === Intro animation + body dark + session check ===
  useEffect(() => {
    // body 다크 배경
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // 인트로 시퀀스
    const t1 = setTimeout(() => setIntroDone(true), 1100);
    const t2 = setTimeout(() => {
      setCurtainOpen(true);
      setContentVisible(true);
    }, 1400);
    const t3 = setTimeout(() => setIntroHidden(true), 2200);

    // Analytics
    trackPageView('Auth');
    trackFunnelStep(2, 'view_auth');

    const ensureOrgNav = async (session: any) => {
      try {
        const {
          data: orgMember,
          error: orgMemberError
        } = await supabase.from('organization_members').select('org_id').eq('user_id', session.user.id).maybeSingle();
        if (orgMemberError) {
          console.error("Error fetching organization member:", orgMemberError);
        }
        let orgId = orgMember?.org_id;

        if (!orgId) {
          const companyName = session.user.user_metadata?.company || session.user.user_metadata?.name || session.user.user_metadata?.full_name || (session.user.email ? session.user.email.split("@")[0] : "내 조직");

          const {
            data: existingOrg,
            error: searchError
          } = await supabase.from('organizations').select('id').eq('org_name', companyName).maybeSingle();
          if (searchError && searchError.code !== 'PGRST116') {
            console.error("Error searching organization:", searchError);
          }
          if (existingOrg) {
            orgId = existingOrg.id;
          } else {
            const {
              data: newOrg,
              error: orgError
            } = await supabase.from('organizations').insert({
              org_name: companyName,
              created_by: session.user.id,
              metadata: {
                country: 'KR'
              }
            }).select('id').maybeSingle();
            if (orgError || !newOrg) {
              console.error("Error creating organization:", orgError);
              throw orgError || new Error('조직 생성에 실패했습니다.');
            }
            orgId = newOrg.id;
          }

          const userRoleType = session.user.user_metadata?.roleType || 'HQ';
          const userRole = userRoleType === 'HQ' ? 'ORG_HQ' : 'ORG_STORE';

          const {
            error: memberError
          } = await supabase.from('organization_members').insert({
            user_id: session.user.id,
            org_id: orgId,
            role: userRole
          });
          if (memberError) {
            console.error("Error creating organization member:", memberError);
            if (memberError.code !== '42501') {
              throw memberError;
            }
          }
        }

        const {
          data: subscription,
          error: subError
        } = await supabase.from('subscriptions').select('id').eq('org_id', orgId).eq('status', 'active').maybeSingle();
        if (subError) {
          console.error("Error fetching subscription:", subError);
        }

        // --- Session Handover: link anonymous chat history to authenticated user ---
        const chatSessionId = localStorage.getItem('neuraltwin_chat_session_id');
        if (chatSessionId && session.access_token) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
            await fetch(`${supabaseUrl}/functions/v1/unified-chatbot`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': supabaseKey,
              },
              body: JSON.stringify({
                action: 'handover_session',
                sessionId: chatSessionId,
              }),
            });
            // Don't remove session ID - user might return to chat
          } catch (e) {
            console.warn('[SessionHandover] Failed:', e);
            // Non-blocking - don't prevent login flow
          }
        }

        if (subscription) {
          navigate(safeRedirect);
        } else {
          navigate("/subscribe");
        }
      } catch (error) {
        console.error("Error ensuring organization and subscription:", error);
        toast({
          title: "오류 발생",
          description: "조직 또는 구독 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive"
        });
      }
    };
    const ensureOrgNavWrapper = (session: any) => {
      ensureOrgNav(session);
    };

    // Check if user is already logged in on mount
    const checkSession = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        localStorage.removeItem('neuraltwin_manual_logout');
        await ensureOrgNavWrapper(session);
      }
    };
    checkSession();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.removeItem('neuraltwin_manual_logout');
        ensureOrgNavWrapper(session);
      }
    });

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      subscription.unsubscribe();
    };
  }, [navigate, toast, safeRedirect]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !passwordConfirm || !name || !company || !phone || !roleType) {
      toast({
        title: "입력 오류",
        description: "모든 필수 필드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive"
      });
      return;
    }
    if (password !== passwordConfirm) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;

      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: name,
            name: name,
            full_name: name,
            company: company,
            phone: phone,
            roleType: roleType
          }
        }
      });
      if (error) throw error;
      if (data.user && data.session) {
        console.log("User created, creating organization...");

        const {
          data: existingOrg,
          error: searchError
        } = await supabase.from('organizations').select('id').eq('org_name', company).maybeSingle();
        if (searchError && searchError.code !== 'PGRST116') {
          console.error("Error searching organization:", searchError);
          throw searchError;
        }
        let orgId: string;
        if (existingOrg) {
          orgId = existingOrg.id;
          console.log("Joining existing organization:", orgId);
        } else {
          const {
            data: newOrg,
            error: orgError
          } = await supabase.from('organizations').insert({
            org_name: company,
            created_by: data.user.id,
            metadata: {
              country: 'KR'
            }
          }).select('id').single();
          if (orgError) {
            console.error("Error creating organization:", orgError);
            throw orgError;
          }
          if (!newOrg) {
            throw new Error('조직 생성에 실패했습니다.');
          }
          orgId = newOrg.id;
          console.log("Created new organization:", orgId);
        }

        const userRole = roleType === 'HQ' ? 'ORG_HQ' : 'ORG_STORE';

        const {
          error: memberError
        } = await supabase.from('organization_members').insert({
          user_id: data.user.id,
          org_id: orgId,
          role: userRole
        });
        if (memberError) {
          console.error("Error creating organization member:", memberError);
          throw memberError;
        }
        console.log("Organization member created successfully");
        toast({
          title: "회원가입 완료!",
          description: "환영합니다!"
        });
        trackFunnelStep(2, 'signup_completed');

        // --- Session Handover: link anonymous chat history to authenticated user ---
        const chatSessionId = localStorage.getItem('neuraltwin_chat_session_id');
        if (chatSessionId && data.session?.access_token) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
            await fetch(`${supabaseUrl}/functions/v1/unified-chatbot`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`,
                'apikey': supabaseKey,
              },
              body: JSON.stringify({
                action: 'handover_session',
                sessionId: chatSessionId,
              }),
            });
          } catch (e) {
            console.warn('[SessionHandover] Failed:', e);
          }
        }

        const {
          data: subscription
        } = await supabase.from('subscriptions').select('id').eq('org_id', orgId).eq('status', 'active').maybeSingle();
        if (subscription) {
          navigate(safeRedirect);
        } else {
          navigate("/subscribe");
        }
      } else if (data.user && !data.session) {
        toast({
          title: "회원가입 완료!",
          description: "이메일로 전송된 확인 링크를 클릭해주세요."
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = error.message || "회원가입 중 오류가 발생했습니다.";

      if (error.code === 'user_already_exists' || error.message === 'User already registered') {
        errorMessage = "이미 가입된 이메일입니다. 로그인 탭에서 로그인해주세요.";
      } else if (error.message?.includes('organization')) {
        errorMessage = "조직 생성 중 오류가 발생했습니다. 다시 시도해주세요.";
      } else if (error.message?.includes('member')) {
        errorMessage = "조직 멤버 등록 중 오류가 발생했습니다. 다시 시도해주세요.";
      }
      toast({
        title: "회원가입 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "입력 오류",
        description: "이메일과 비밀번호를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast({
        title: "로그인 성공!",
        description: "환영합니다!"
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "로그인 실패",
        description: error.message || "로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message || "Google 로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ==================== INTRO ANIMATION ==================== */}
      {!introHidden && (
        <div className={`intro-overlay${introDone ? " done" : ""}`}>
          <div className="intro-logo-wrapper">
            <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" />
          </div>
          <div className="intro-tagline">Intelligence Redefined</div>
          <div className="intro-line"></div>
        </div>
      )}
      {!introHidden && <div className={`intro-curtain-top${curtainOpen ? " open" : ""}`} />}
      {!introHidden && <div className={`intro-curtain-bottom${curtainOpen ? " open" : ""}`} />}

      {/* ==================== GRID BACKGROUND ==================== */}
      <div className="page-grid-bg">
        <div className="grid-lines"></div>
        <div className="grid-lines-fine"></div>
        <div className="grid-dots"></div>
        <div className="grid-glow"></div>
      </div>

      {/* ==================== PAGE CONTENT ==================== */}
      <div className={`page-content${contentVisible ? " visible" : ""}`}>

        {/* Nav */}
        <nav className="page-nav">
          <Link to="/">
            <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="logo-img" />
          </Link>
          <div className="page-nav-links">
            <Link to="/about">제품 &amp; 회사소개</Link>
            <Link to="/contact">문의하기</Link>
            <Link to="/auth" className="active">로그인</Link>
          </div>
          <button className={`mobile-menu-btn${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="메뉴">
            <span className="mobile-menu-bar"></span>
            <span className="mobile-menu-bar"></span>
            <span className="mobile-menu-bar"></span>
          </button>
        </nav>
        {mobileMenuOpen && (
          <div className="mobile-menu-dropdown">
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>제품 &amp; 회사소개</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>문의하기</Link>
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
          </div>
        )}

        {/* ==================== AUTH SECTION ==================== */}
        <section className="auth-section">
          <div className="auth-card">
            {/* Header */}
            <div className="auth-header">
              <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="auth-logo" />
              <p className="auth-subtitle">리테일 디지털 트윈 플랫폼</p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab${activeTab === "login" ? " active" : ""}`}
                onClick={() => setActiveTab("login")}
              >
                로그인
              </button>
              <button
                className={`auth-tab${activeTab === "signup" ? " active" : ""}`}
                onClick={() => setActiveTab("signup")}
              >
                회원가입
              </button>
            </div>

            {/* Login Form */}
            {activeTab === "login" && (
              <form onSubmit={handleEmailSignIn} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="login-email">이메일</label>
                  <input
                    id="login-email"
                    type="email"
                    className="auth-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="login-password">비밀번호</label>
                  <input
                    id="login-password"
                    type="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "로그인 중..." : "로그인"}
                </button>
              </form>
            )}

            {/* Signup Form */}
            {activeTab === "signup" && (
              <form onSubmit={handleEmailSignUp} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-email">이메일 (ID) *</label>
                  <input
                    id="signup-email"
                    type="email"
                    className="auth-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-password">비밀번호 *</label>
                  <input
                    id="signup-password"
                    type="password"
                    className="auth-input"
                    placeholder="최소 6자 이상"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-password-confirm">비밀번호 확인 *</label>
                  <input
                    id="signup-password-confirm"
                    type="password"
                    className="auth-input"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-name">이름 *</label>
                  <input
                    id="signup-name"
                    type="text"
                    className="auth-input"
                    placeholder="홍길동"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-company">회사명 (조직명) *</label>
                  <input
                    id="signup-company"
                    type="text"
                    className="auth-input"
                    placeholder="주식회사 NEURALTWIN"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-phone">전화번호 *</label>
                  <input
                    id="signup-phone"
                    type="tel"
                    className="auth-input"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">역할 선택 *</label>
                  <div className="auth-role-group">
                    <label
                      className={`auth-role-option${roleType === "HQ" ? " selected" : ""}`}
                      onClick={() => !loading && setRoleType("HQ")}
                    >
                      <input type="radio" name="roleType" value="HQ" checked={roleType === "HQ"} onChange={() => setRoleType("HQ")} disabled={loading} />
                      <span className="auth-role-dot"></span>
                      <span className="auth-role-label">본사 (HQ)</span>
                    </label>
                    <label
                      className={`auth-role-option${roleType === "STORE" ? " selected" : ""}`}
                      onClick={() => !loading && setRoleType("STORE")}
                    >
                      <input type="radio" name="roleType" value="STORE" checked={roleType === "STORE"} onChange={() => setRoleType("STORE")} disabled={loading} />
                      <span className="auth-role-dot"></span>
                      <span className="auth-role-label">매장 (Store)</span>
                    </label>
                  </div>
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "가입 중..." : "회원가입"}
                </button>
              </form>
            )}

            {/* Terms */}
            <div className="auth-terms">
              가입하면{" "}
              <a href="/terms">이용약관</a>{" "}
              및{" "}
              <button type="button" onClick={() => setPrivacyDialogOpen(true)}>
                개인정보처리방침
              </button>
              에 동의하는 것으로 간주됩니다.
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="auth-footer-full">
          <div className="footer-left">
            <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" className="logo-img" />
            <p>복잡한 세계를 위한 AI 플랫폼.<br />데이터를 의사결정으로 전환합니다.</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Company &amp; Product</h4>
              <Link to="/about">제품 & 회사소개</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <Link to="/contact">문의하기</Link>
            </div>
          </div>
        </footer>
        <div className="footer-bottom">
          <span>&copy; 2026 NEURALTWIN. All rights reserved.</span>
          <span>
            <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link>
          </span>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("contact.consent.privacyTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm">
            <p>{t("contact.consent.privacyDoc.intro")}</p>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section1Title")}</h4>
              <p className="mb-3">{t("contact.consent.privacyDoc.section1Desc")}</p>
              <div className="space-y-3 pl-2">
                <div>
                  <p className="font-medium">{t("contact.consent.privacyDoc.service")}</p>
                  <p>• 수집 항목: {t("contact.consent.privacyDoc.serviceItems")}</p>
                  <p>• 처리 목적: {t("contact.consent.privacyDoc.servicePurpose")}</p>
                </div>
                <div>
                  <p className="font-medium">{t("contact.consent.privacyDoc.marketing")}</p>
                  <p>• 수집 항목: {t("contact.consent.privacyDoc.marketingItems")}</p>
                  <p>• 처리 목적: {t("contact.consent.privacyDoc.marketingPurpose")}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section2Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section2Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.retention1")}</li>
                <li>{t("contact.consent.privacyDoc.retention2")}</li>
                <li>{t("contact.consent.privacyDoc.retention3")}</li>
                <li>{t("contact.consent.privacyDoc.retention4")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section3Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section3Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.thirdParty1")}</li>
                <li>{t("contact.consent.privacyDoc.thirdParty2")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section4Title")}</h4>
              <p>{t("contact.consent.privacyDoc.section4Desc")}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section5Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section5Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.rights1")}</li>
                <li>{t("contact.consent.privacyDoc.rights2")}</li>
                <li>{t("contact.consent.privacyDoc.rights3")}</li>
                <li>{t("contact.consent.privacyDoc.rights4")}</li>
              </ul>
              <p className="mt-2">{t("contact.consent.privacyDoc.rightsNote")}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section6Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section6Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.destroy1")}</li>
                <li>{t("contact.consent.privacyDoc.destroy2")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section7Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section7Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.safety1")}</li>
                <li>{t("contact.consent.privacyDoc.safety2")}</li>
                <li>{t("contact.consent.privacyDoc.safety3")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section8Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section8Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.officer")}</li>
                <li>{t("contact.consent.privacyDoc.contact")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section9Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section9Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.remedy1")}</li>
                <li>{t("contact.consent.privacyDoc.remedy2")}</li>
                <li>{t("contact.consent.privacyDoc.remedy3")}</li>
                <li>{t("contact.consent.privacyDoc.remedy4")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("contact.consent.privacyDoc.section10Title")}</h4>
              <p>{t("contact.consent.privacyDoc.section10Desc")}</p>
            </div>

            <div className="pt-2 border-t">
              <p>{t("contact.consent.privacyDoc.effectiveDate")}</p>
              <p>{t("contact.consent.privacyDoc.implementDate")}</p>
            </div>
          </div>
          <button className="dialog-close-btn" onClick={() => setPrivacyDialogOpen(false)}>
            {t("contact.consent.close")}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default Auth;
