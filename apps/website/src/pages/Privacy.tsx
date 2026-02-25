import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "@/styles/legal.css";

const Privacy = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // === Intro animation state ===
  const [introDone, setIntroDone] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    const t1 = setTimeout(() => setIntroDone(true), 1100);
    const t2 = setTimeout(() => {
      setCurtainOpen(true);
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

  return (
    <div className="legal-page">
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
            {/* auth buttons hidden */}
            {/* <Link to="/auth" state={{ tab: "login" }}>로그인</Link> */}
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
            {/* auth buttons hidden */}
            {/* <Link to="/auth" state={{ tab: "login" }} onClick={() => setMobileMenuOpen(false)}>로그인</Link> */}
          </div>
        )}

        {/* ==================== LEGAL CONTENT ==================== */}
        <section className="legal-section">
          <div className="legal-inner">
            <div className="legal-label">Privacy Policy</div>
            <h1 className="legal-title">개인정보처리방침</h1>

            <div className="legal-card">
              <div className="legal-block">
                <h2>1. 수집하는 개인정보</h2>
                <p>NEURALTWIN은 서비스 제공을 위해 최소한의 개인정보를 수집합니다.</p>
              </div>

              <hr className="legal-divider" />

              <div className="legal-block">
                <h2>2. 개인정보의 이용목적</h2>
                <p>수집된 개인정보는 서비스 제공, 고객 지원, 마케팅에 활용됩니다.</p>
              </div>

              <hr className="legal-divider" />

              <div className="legal-block">
                <h2>3. 개인정보의 보유 및 이용기간</h2>
                <p>원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
              </div>

              <hr className="legal-divider" />

              <div className="legal-block">
                <h2>4. 문의</h2>
                <p>개인정보 관련 문의: neuraltwin.hq@neuraltwin.io</p>
              </div>

              <hr className="legal-divider" />

              <div className="legal-date">최종 수정일: 2026년 02월</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="legal-footer-full">
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

export default Privacy;
