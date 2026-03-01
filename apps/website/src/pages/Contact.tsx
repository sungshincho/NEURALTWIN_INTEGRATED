// Contact 페이지 - NEURALTWIN 다크 테마 (하이브리드: HTML 스타일 + 기존 기능 100% 보존)
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView, trackContactForm, trackFunnelStep } from "@/lib/analytics";
import "@/styles/contact.css";

const Contact = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [marketingDialogOpen, setMarketingDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    stores: "",
    features: [] as string[],
    timeline: "",
    message: "",
    privacyConsent: false,
    marketingConsent: false,
  });

  // === Intro animation state (about/chat 동일 패턴) ===
  const [introDone, setIntroDone] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);

  // === Analytics (기존 100% 보존) ===
  useEffect(() => {
    trackPageView("Contact", 3);
    trackFunnelStep(3, "view_contact");
    trackContactForm("start");
  }, []);

  // === Intro animation timers (about/chat 동일 패턴) ===
  useEffect(() => {
    const t1 = setTimeout(() => setIntroDone(true), 1100);
    const t2 = setTimeout(() => {
      setCurtainOpen(true);
      setContentVisible(true);
    }, 1400);
    const t3 = setTimeout(() => setIntroHidden(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // === Form submission (기존 100% 보존) ===
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.privacyConsent) {
      toast({
        title: t("contact.consent.privacyRequired"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-contact", {
        body: {
          name: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
          stores: formData.stores ? parseInt(formData.stores) : undefined,
          features: formData.features.length > 0 ? formData.features : undefined,
          timeline: formData.timeline || undefined,
          message: formData.message || undefined,
          privacyConsent: formData.privacyConsent,
          marketingConsent: formData.marketingConsent,
        },
      });

      if (error) throw error;

      trackContactForm("submit");
      setSuccessDialogOpen(true);

      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        stores: "",
        features: [],
        timeline: "",
        message: "",
        privacyConsent: false,
        marketingConsent: false,
      });
    } catch (error) {
      console.error("Form submission error:", error);
      trackContactForm("error", error instanceof Error ? error.message : "Unknown error");

      toast({
        title: t("contact.error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <SEOHead
        title={t("nav.contact")}
        description="NEURALTWIN 도입 문의. 전문가에게 무료 ROI 분석 리포트와 맞춤형 솔루션을 받아보세요."
        path="/contact"
      />
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
            <Link to="/contact" className="active">문의하기</Link>
            {/* auth buttons hidden
            {isAuthenticated ? (
              <>
                <span className="nav-user-name">{user?.user_metadata?.name || user?.email?.split('@')[0] || '사용자'}</span>
                <button className="nav-auth-btn" onClick={() => signOut()}>로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/auth" state={{ tab: "login" }}>로그인</Link>
                <Link to="/auth" state={{ tab: "signup" }}>회원가입</Link>
              </>
            )}
            */}
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
            {/* auth buttons hidden
            {isAuthenticated ? (
              <button className="mobile-auth-btn" onClick={() => { signOut(); setMobileMenuOpen(false); }}>로그아웃</button>
            ) : (
              <>
                <Link to="/auth" state={{ tab: "login" }} onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                <Link to="/auth" state={{ tab: "signup" }} onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
              </>
            )}
            */}
          </div>
        )}

        {/* ==================== CONTACT SECTION ==================== */}
        <section className="contact-section">

          {/* Left: Info */}
          <div className="contact-info">
            <div className="contact-label">Contact Us</div>
            <h1 className="contact-title">
              {t("contact.title", "무엇이든")}<br />{t("contact.titleLine2", "물어보세요")}
            </h1>
            <p className="contact-desc">
              {t("contact.desc", "NEURALTWIN에 대해 궁금한 점이 있으시면 편하게 문의해주세요. 담당자가 영업일 기준 24시간 이내에 답변드립니다.")}
            </p>
            <div className="contact-details">
              <div className="contact-detail">
                <div className="contact-detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="contact-detail-text">
                  <span className="contact-detail-label">{t("contact.info.email", "Email")}</span>
                  <a href="mailto:neuraltwin.hq@neuraltwin.io" className="contact-detail-value">neuraltwin.hq@neuraltwin.io</a>
                </div>
              </div>
              <div className="contact-detail">
                <div className="contact-detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="contact-detail-text">
                  <span className="contact-detail-label">{t("contact.info.address", "Address")}</span>
                  <span className="contact-detail-value">Seoul, South Korea</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="contact-form-wrapper">
            <form onSubmit={handleSubmit}>
              {/* Row 1: 이름 + 회사명 */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="name">{t("contact.form.name")} *</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    placeholder={t("contact.form.namePlaceholder")}
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="company">{t("contact.form.company")} *</label>
                  <input
                    type="text"
                    id="company"
                    className="form-input"
                    placeholder={t("contact.form.companyPlaceholder")}
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: 이메일 + 전화번호 */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">{t("contact.form.email")} *</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder={t("contact.form.emailPlaceholder")}
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">{t("contact.form.phone")} *</label>
                  <input
                    type="tel"
                    id="phone"
                    className="form-input"
                    placeholder={t("contact.form.phonePlaceholder")}
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* TEMPORARILY HIDDEN - START: stores, features, timeline, message fields */}
              {/*
              <div className="form-group">
                <label className="form-label" htmlFor="stores">{t("contact.form.stores")} (선택)</label>
                <input
                  type="number"
                  id="stores"
                  className="form-input"
                  placeholder={t("contact.form.storesPlaceholder")}
                  value={formData.stores}
                  onChange={(e) => setFormData({ ...formData, stores: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("contact.form.features")} (선택)</label>
                <div style={{ border: '1px solid var(--gray-700)', borderRadius: '10px', padding: '12px 18px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '12px' }}>{t("contact.form.featuresPlaceholder")}</p>
                  {[
                    { value: "consumerData", label: t("contact.form.featureOptions.consumerData") },
                    { value: "dataIntegration", label: t("contact.form.featureOptions.dataIntegration") },
                    { value: "aiSimulation", label: t("contact.form.featureOptions.aiSimulation") },
                    { value: "hqStoreCommunication", label: t("contact.form.featureOptions.hqStoreCommunication") },
                    { value: "all", label: t("contact.form.featureOptions.all") },
                  ].map((option) => (
                    <div key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Checkbox
                        id={`feature-${option.value}`}
                        checked={formData.features.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, features: [...formData.features, option.value] });
                          } else {
                            setFormData({ ...formData, features: formData.features.filter(f => f !== option.value) });
                          }
                        }}
                      />
                      <label
                        htmlFor={`feature-${option.value}`}
                        style={{ fontSize: '13px', color: 'var(--gray-300)', cursor: 'pointer' }}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="timeline">{t("contact.form.timeline")} (선택)</label>
                <select
                  id="timeline"
                  className="form-input"
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                >
                  <option value="">{t("contact.form.timelinePlaceholder")}</option>
                  <option value="immediate">{t("contact.form.timelineOptions.immediate")}</option>
                  <option value="month1">{t("contact.form.timelineOptions.month1")}</option>
                  <option value="month3">{t("contact.form.timelineOptions.month3")}</option>
                  <option value="month6">{t("contact.form.timelineOptions.month6")}</option>
                  <option value="planning">{t("contact.form.timelineOptions.planning")}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="message">{t("contact.form.message")} (선택)</label>
                <textarea
                  id="message"
                  className="form-input"
                  rows={4}
                  placeholder={t("contact.form.messagePlaceholder")}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ resize: 'none', minHeight: '120px' }}
                />
              </div>
              */}
              {/* TEMPORARILY HIDDEN - END: stores, features, timeline, message fields */}

              {/* Consent Checkboxes (기존 기능 100% 보존) */}
              <div className="consent-section">
                <div className="consent-row">
                  <div className="consent-left">
                    <Checkbox
                      id="privacyConsent"
                      checked={formData.privacyConsent}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, privacyConsent: checked as boolean })
                      }
                    />
                    <label htmlFor="privacyConsent">
                      <span className="consent-required">{t("contact.consent.required")}</span>{" "}
                      {t("contact.consent.privacy")}
                    </label>
                  </div>
                  <button
                    type="button"
                    className="consent-view-btn"
                    onClick={() => setPrivacyDialogOpen(true)}
                  >
                    {t("contact.consent.view")}
                  </button>
                </div>

                <div className="consent-row">
                  <div className="consent-left">
                    <Checkbox
                      id="marketingConsent"
                      checked={formData.marketingConsent}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, marketingConsent: checked as boolean })
                      }
                    />
                    <label htmlFor="marketingConsent">
                      <span className="consent-optional">{t("contact.consent.optional")}</span>{" "}
                      {t("contact.consent.marketing")}
                    </label>
                  </div>
                  <button
                    type="button"
                    className="consent-view-btn"
                    onClick={() => setMarketingDialogOpen(true)}
                  >
                    {t("contact.consent.view")}
                  </button>
                </div>
              </div>

              <button type="submit" className="form-submit" disabled={loading}>
                {loading ? t("contact.form.submitting") : t("contact.form.submit")}
              </button>
            </form>
          </div>

        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="contact-footer">
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
          <span><Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link></span>
        </div>

      </div>{/* /page-content */}

      {/* ==================== DIALOGS (기존 기능 100% 보존) ==================== */}

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div style={{ width: 64, height: 64, border: '2px solid white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <DialogTitle className="text-2xl">{t("contact.successTitle")}</DialogTitle>
            <DialogDescription className="text-base mt-2">
              {t("contact.successMessage")}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setSuccessDialogOpen(false)} className="mt-4">
            확인
          </Button>
        </DialogContent>
      </Dialog>

      {/* Privacy Consent Dialog (기존 법적 문서 100% 보존) */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("contact.consent.privacyTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm text-muted-foreground">
            <p>{t("contact.consent.privacyDoc.intro")}</p>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section1Title")}</h4>
              <p className="mb-3">{t("contact.consent.privacyDoc.section1Desc")}</p>
              <div className="space-y-3 pl-2">
                <div>
                  <p className="font-medium text-foreground">{t("contact.consent.privacyDoc.service")}</p>
                  <p>• 수집 항목: {t("contact.consent.privacyDoc.serviceItems")}</p>
                  <p>• 처리 목적: {t("contact.consent.privacyDoc.servicePurpose")}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("contact.consent.privacyDoc.marketing")}</p>
                  <p>• 수집 항목: {t("contact.consent.privacyDoc.marketingItems")}</p>
                  <p>• 처리 목적: {t("contact.consent.privacyDoc.marketingPurpose")}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section2Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section2Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.retention1")}</li>
                <li>{t("contact.consent.privacyDoc.retention2")}</li>
                <li>{t("contact.consent.privacyDoc.retention3")}</li>
                <li>{t("contact.consent.privacyDoc.retention4")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section3Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section3Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.thirdParty1")}</li>
                <li>{t("contact.consent.privacyDoc.thirdParty2")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section4Title")}</h4>
              <p>{t("contact.consent.privacyDoc.section4Desc")}</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section5Title")}</h4>
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
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section6Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section6Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.destroy1")}</li>
                <li>{t("contact.consent.privacyDoc.destroy2")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section7Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section7Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.safety1")}</li>
                <li>{t("contact.consent.privacyDoc.safety2")}</li>
                <li>{t("contact.consent.privacyDoc.safety3")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section8Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section8Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.officer")}</li>
                <li>{t("contact.consent.privacyDoc.contact")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section9Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section9Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.remedy1")}</li>
                <li>{t("contact.consent.privacyDoc.remedy2")}</li>
                <li>{t("contact.consent.privacyDoc.remedy3")}</li>
                <li>{t("contact.consent.privacyDoc.remedy4")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section10Title")}</h4>
              <p>{t("contact.consent.privacyDoc.section10Desc")}</p>
            </div>

            <div className="pt-2 border-t">
              <p>{t("contact.consent.privacyDoc.effectiveDate")}</p>
              <p>{t("contact.consent.privacyDoc.implementDate")}</p>
            </div>
          </div>
          <Button onClick={() => setPrivacyDialogOpen(false)} className="mt-4">
            {t("contact.consent.close")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Marketing Consent Dialog (기존 법적 문서 100% 보존) */}
      <Dialog open={marketingDialogOpen} onOpenChange={setMarketingDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("contact.consent.marketingTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{t("contact.consent.marketingDoc.intro")}</p>
            <div className="space-y-3">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-foreground">수집 항목</span>
                <span>{t("contact.consent.marketingDoc.items")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-foreground">이용 목적</span>
                <span>{t("contact.consent.marketingDoc.purpose")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-foreground">수신 방법</span>
                <span>{t("contact.consent.marketingDoc.method")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-foreground">보유 및 이용 기간</span>
                <span>{t("contact.consent.marketingDoc.period")}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/80 pt-2">{t("contact.consent.marketingDoc.note")}</p>
          </div>
          <Button onClick={() => setMarketingDialogOpen(false)} className="mt-4">
            {t("contact.consent.close")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contact;
