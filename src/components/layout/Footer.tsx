import { Link, useLocation, useNavigate } from "react-router-dom";
import { Linkedin } from "lucide-react";

export const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/pricing") {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
      navigate("/pricing");
    }
  };

  const handleFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/product") {
      const element = document.getElementById("license-features");
      if (element) {
        element.scrollIntoView({ behavior: "instant" });
      }
    } else {
      navigate("/product", { state: { scrollTo: "license-features" } });
    }
  };

  const handleTechnologyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/product") {
      const element = document.getElementById("technology-pipeline");
      if (element) {
        element.scrollIntoView({ behavior: "instant" });
      }
    } else {
      navigate("/product", { state: { scrollTo: "technology-pipeline" } });
    }
  };

  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img src="/images/neuraltwin-logo.png" alt="NEURALTWIN" className="h-5 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">
              오프라인 리테일을 위한<br />
              궁극의 AI OS
            </p>
            <div className="flex space-x-4">
              <a href="https://www.linkedin.com/company/neuraltwin" className="text-muted-foreground hover:text-primary transition-smooth" target="_blank" rel="noopener noreferrer">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">제품</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="/product#license-features" 
                  onClick={handleFeatureClick}
                  className="text-muted-foreground hover:text-foreground transition-smooth cursor-pointer"
                >
                  기능
                </a>
              </li>
              <li>
                <a 
                  href="/pricing" 
                  onClick={handlePricingClick}
                  className="text-muted-foreground hover:text-foreground transition-smooth cursor-pointer"
                >
                  가격
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/contact" 
                  onClick={() => window.scrollTo(0, 0)}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  문의
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal - Hidden for now */}
          {/* <div>
            <h3 className="font-semibold mb-4">법적 고지</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/privacy" 
                  onClick={() => window.scrollTo(0, 0)}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  onClick={() => window.scrollTo(0, 0)}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  이용약관
                </Link>
              </li>
            </ul>
          </div> */}
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 NEURALTWIN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
