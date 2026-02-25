// About 페이지 - NEURALTWIN 제품 & 회사소개
// HTML 원본을 React로 변환: 인트로 애니메이션, 아코디언, 캔버스, 스크롤 Reveal
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import "@/styles/about.css";

// 서비스 아코디언 데이터
// 서비스별 스크린샷 이미지 경로 — public/images/services/ 에 실제 파일 배치 필요
const SERVICES = [
  {
    num: "01",
    title: "데이터 컨트롤 타워",
    desc: "Single Source of Truth — 단일 진실 소스",
    image: "/images/services/data-control-tower.png",
    panelTitle: "흩어진 데이터, 하나의 진실로",
    panelDesc:
      "POS, IoT 센서, CCTV, ERP 등 50개 이상의 레거시 시스템을 단일 플랫폼으로 통합합니다. 초당 37,000건 이상의 데이터를 실시간 처리하며, Data Quality 100/100 자동 헬스체크로 데이터 신뢰성을 보장합니다.",
    tags: ["실시간 연동", "데이터 정합성", "50+ 시스템 통합"],
  },
  {
    num: "02",
    title: "인사이트 허브",
    desc: "실시간 대시보드 & AI Critical Alert",
    image: "/images/services/insight-hub.png",
    panelTitle: "수천 개 지표 대신, 지금 당장 해야 할 것만",
    panelDesc:
      "통합된 데이터를 AI가 분석하여 즉시 실행 가능한 인사이트로 시각화합니다. 매출 트렌드, 고객 동선 패턴, 상품 실적 등 핵심 지표를 한눈에 파악하고, AI가 감지한 Critical Alert만 우선 확인 — 불필요한 데이터 노이즈를 제거합니다.",
    tags: ["실시간 대시보드", "AI 추천", "Critical Alert"],
  },
  {
    num: "03",
    title: "디지털 트윈 스튜디오",
    desc: "3D 시뮬레이션으로 실패 비용 제로",
    image: "/images/services/digital-twin-studio.png",
    panelTitle: "실패는 가상에서, 현실엔 성공만",
    panelDesc:
      "실제 매장을 3D 디지털 트윈으로 정밀하게 복제하여 레이아웃 변경, 상품 재배치, 동선 최적화를 사전에 시뮬레이션합니다. AI가 예측한 매출 효과를 확인하고, 94% 정확도로 검증된 전략만 현실에 적용하세요.",
    tags: ["3D 시뮬레이션", "AI 레이아웃 최적화", "94% 예측 정확도"],
  },
  {
    num: "04",
    title: "ROI 측정",
    desc: "예측 vs 실측, 실시간 비교 분석",
    image: "/images/services/roi-measurement.png",
    panelTitle: "AI 제안의 가치, 숫자로 증명합니다",
    panelDesc:
      "디지털 트윈에서 검증된 시나리오를 실제 매장에 적용한 후, 예측치(Forecast)와 실측치(Actual)를 실시간으로 비교 분석합니다. 매출, 전환율, 체류 시간 등 주요 KPI를 자동 추적하여 ROI 1,700%, 전환율 +8.3% 같은 검증된 결과를 만들어냅니다.",
    tags: ["A/B 비교", "실시간 KPI 추적", "ROI 1,700%"],
  },
  {
    num: "05",
    title: "설정 & 관리",
    desc: "엔터프라이즈급 거버넌스 & 글로벌 확장성",
    image: "/images/services/settings-management.png",
    panelTitle: "클릭 한 번으로 전 세계 매장 관리",
    panelDesc:
      "다중 매장 관리, 사용자 권한 설정, 알림 규칙, 데이터 연동 설정 등 플랫폼의 모든 설정을 직관적인 인터페이스로 관리합니다. 역할 기반 접근 제어(RBAC)와 ISO 27001 & GDPR 준수로 글로벌 확장에도 안심하고 사용하세요.",
    tags: ["멀티매장", "RBAC", "ISO 27001"],
  },
];


const About = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 인트로 애니메이션 상태
  const [introComplete, setIntroComplete] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);

  // 아코디언 상태 (열려있는 서비스 인덱스, -1이면 모두 닫힘)
  const [openService, setOpenService] = useState(-1);

  // 패널 ref 배열 (아코디언 높이 계산용)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  // 서비스 아이템 ref 배열 (classList 기반 open 토글 — React className 충돌 방지)
  const serviceItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // body 다크 배경
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // 인트로 시퀀스
    const t1 = setTimeout(() => setIntroComplete(true), 1100);
    const t2 = setTimeout(() => {
      setCurtainsOpen(true);
      setContentVisible(true);
    }, 1400);
    const t3 = setTimeout(() => setIntroHidden(true), 2200);

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // 스크롤 Reveal (IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll(".about-page .reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [contentVisible]);

  // 아코디언 토글
  const toggleService = useCallback(
    (index: number) => {
      setOpenService(openService === index ? -1 : index);
    },
    [openService]
  );

  // open 클래스를 classList로 관리 — React className이 IntersectionObserver의 visible을 덮어쓰지 않도록
  useEffect(() => {
    serviceItemRefs.current.forEach((el, i) => {
      if (!el) return;
      el.classList.toggle('open', openService === i);
    });
  }, [openService]);

  // 아코디언 패널 높이 계산 — rAF로 레이아웃 완료 후 측정하여 scrollHeight 0 버그 방지
  useEffect(() => {
    requestAnimationFrame(() => {
      panelRefs.current.forEach((panel, i) => {
        if (!panel) return;
        if (openService === i) {
          panel.style.maxHeight = panel.scrollHeight + "px";
        } else {
          panel.style.maxHeight = "0px";
        }
      });
    });
  }, [openService]);

  return (
    <div className="about-page">
      {/* ==================== INTRO ANIMATION ==================== */}
      {!introHidden && (
        <>
          <div className={`intro-overlay${introComplete ? " done" : ""}`}>
            <div className="intro-logo-wrapper">
              <img src="/NEURALTWIN_logo_white.png" alt="NEURALTWIN" />
            </div>
            <div className="intro-tagline">Intelligence Redefined</div>
            <div className="intro-line"></div>
          </div>
          <div className={`intro-curtain-top${curtainsOpen ? " open" : ""}`}></div>
          <div className={`intro-curtain-bottom${curtainsOpen ? " open" : ""}`}></div>
        </>
      )}

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
            <Link to="/about" className="active">제품 &amp; 회사소개</Link>
            <Link to="/contact">문의하기</Link>
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

        {/* ==================== PAGE HERO ==================== */}
        <section className="page-hero">
          <div className="page-hero-label">Product &amp; Company</div>
          <h1 className="page-hero-title">
            리테일의 미래를<br />만듭니다
          </h1>
          <p className="page-hero-desc">
            NEURALTWIN은 오프라인 매장의 모든 데이터를 하나로 통합하고,
            AI 기반 시뮬레이션으로 <strong>실패 없는 의사결정</strong>을 지원하는 리테일 인텔리전스 OS입니다.
          </p>
        </section>

        {/* ==================== ABOUT ==================== */}
        <section className="section-about" id="about">
          <div className="about-left reveal">
            <div className="about-label">About</div>
            <h2 className="about-title">
              리테일 비즈니스를<br />위한 가장<br />강력한 솔루션
            </h2>
          </div>
          <div className="about-right reveal">
            <p>
              NEURALTWIN은 POS, 센서, CRM, ERP 등 흩어진 모든 데이터를 하나로 통합하고,
              AI 기반 분석으로 고객 동선, 상품 배치, 인력 운영을 자동으로 최적화합니다.
            </p>
            <p>
              실패는 가상에서, 현실엔 성공만 — 디지털 트윈으로 리스크 없이 검증하세요.
            </p>
            <div className="about-stat-row">
              <div className="about-stat">
                <div className="number">-70%</div>
                <div className="label">의사결정 시간</div>
              </div>
              <div className="about-stat">
                <div className="number">+20%</div>
                <div className="label">매출 향상</div>
              </div>
              <div className="about-stat">
                <div className="number">-30%</div>
                <div className="label">운영 비용</div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== SERVICES (Accordion) ==================== */}
        <section className="section-services" id="services">
          <div className="services-header reveal">
            <div className="about-label">Platform</div>
            <h2 className="about-title">강력한 도구</h2>
          </div>

          {SERVICES.map((svc, i) => (
            <div
              key={svc.num}
              ref={(el) => { serviceItemRefs.current[i] = el; }}
              className="service-item reveal"
            >
              <div className="service-row" onClick={() => toggleService(i)}>
                <div className="service-num">{svc.num}</div>
                <div className="service-title">{svc.title}</div>
                <div className="service-desc">{svc.desc}</div>
              </div>
              <div className="service-arrow">→</div>
              <div
                className="service-panel"
                ref={(el) => { panelRefs.current[i] = el; }}
              >
                <div className="service-panel-inner">
                  <div className="service-panel-image">
                    <img
                      src={svc.image}
                      alt={svc.title}
                      loading="lazy"
                    />
                  </div>
                  <div className="service-panel-text">
                    <h3>{svc.panelTitle}</h3>
                    <p>{svc.panelDesc}</p>
                    <div className="service-panel-tags">
                      {svc.tags.map((tag) => (
                        <span key={tag} className="service-panel-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="section-process" id="process">
          <div className="process-header reveal">
            <div className="about-label">How It Works</div>
            <h2 className="about-title">4단계로 시작하세요</h2>
          </div>
          <div className="process-grid">
            <div className="process-step reveal">
              <div className="process-step-num">01</div>
              <div className="process-step-title">데이터 연결</div>
              <div className="process-step-desc">
                POS, IoT 센서, CCTV 등 기존 시스템의 데이터를 그대로 연결합니다.
                별도 하드웨어 없이도 시작 가능하며, NEURALSENSE 센서 추가 시 더 정밀한 분석이 가능합니다.
              </div>
              <div className="process-connector"></div>
            </div>
            <div className="process-step reveal">
              <div className="process-step-num">02</div>
              <div className="process-step-title">디지털 트윈 생성</div>
              <div className="process-step-desc">
                실제 매장을 3D로 자동 복제합니다. 레이아웃, 상품 배치,
                고객 동선이 실시간으로 동기화됩니다.
              </div>
              <div className="process-connector"></div>
            </div>
            <div className="process-step reveal">
              <div className="process-step-num">03</div>
              <div className="process-step-title">AI 분석 &amp; 시뮬레이션</div>
              <div className="process-step-desc">
                AI가 패턴을 분석하고 최적화 방안을 자동 제안합니다. 변경이 매출에 미치는 영향을
                사전에 예측하고 검증하세요.
              </div>
              <div className="process-connector"></div>
            </div>
            <div className="process-step reveal">
              <div className="process-step-num">04</div>
              <div className="process-step-title">실행 &amp; 측정</div>
              <div className="process-step-desc">
                검증된 최적화를 원클릭으로 적용하고, ROI를 실시간 추적합니다.
                데이터 기반 지속 개선 사이클이 자동으로 구축됩니다.
              </div>
            </div>
          </div>
        </section>

        {/* ==================== CTA ==================== */}
        <section className="section-cta" id="cta">
          <div className="cta-glow"></div>
          <div className="reveal">
            <div className="cta-label">Get Started</div>
            <h2 className="cta-title">
              미래를 구축할<br />준비가 되셨나요?
            </h2>
            <p className="cta-desc">
              지금 바로 NEURALTWIN 플랫폼을 경험하세요.
              전문가 팀이 여러분의 여정을 함께합니다.
            </p>
            <div className="cta-buttons">
              <Link to="/contact" className="btn-white">미팅 요청</Link>
              <Link to="/contact" className="btn-outline">상담하기</Link>
            </div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="about-footer">
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
    </div>
  );
};

export default About;
