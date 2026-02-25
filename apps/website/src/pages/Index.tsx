import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, BarChart3, Brain, Target, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { trackPageView, trackCTAClick, trackFunnelStep } from "@/lib/analytics";
import heroMainImage from "@/assets/hero-main-image.png";

const Index = () => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Track page view with funnel step 1 (visit)
    trackPageView('Home', 1);
    trackFunnelStep(1, 'visit_home');

    // Handle scroll event
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section with Image */}
      <section className="relative h-screen">
        {/* Hero Image */}
        <img
          src={heroMainImage}
          alt="NeuralTwin"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4 animate-fade-in-up">
              {/* Headline */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-foreground drop-shadow-lg">
                궁극의 AI 리테일 인텔리전스 <span className="text-primary">NEURALTWIN</span>
                <br />
                가장 진보한 스마트 리테일의 미래.
              </h1>

              {/* Subheadline */}
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto drop-shadow-md">
                1분 만에 시작하고 바로 상담을 받아보세요
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                <Button 
                  asChild 
                  size="default" 
                  className="text-sm px-5 py-4"
                  onClick={() => trackCTAClick('meeting_request_hero', '/contact', 1)}
                >
                  <Link to="/contact">
                    미팅 요청
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="default" 
                  className="text-sm px-5 py-4 bg-background/50 backdrop-blur-sm"
                  onClick={() => {
                    trackCTAClick('mini_features_hero', '/product#mini', 2);
                    trackFunnelStep(2, 'click_mini_features');
                  }}
                >
                  <Link to="/product#mini">미니피쳐 둘러보기</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BarChart3,
                title: t("valueProps.title1"),
                description: t("valueProps.desc1")
              },
              {
                icon: Zap,
                title: t("valueProps.title2"),
                description: t("valueProps.desc2")
              },
              {
                icon: Users,
                title: t("valueProps.title3"),
                description: t("valueProps.desc3")
              },
              {
                icon: Brain,
                title: t("valueProps.title4"),
                description: t("valueProps.desc4")
              }
            ].map((item, index) => (
              <div
                key={index}
                className="glass p-6 rounded-2xl hover:scale-105 transition-smooth animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="relative bg-background">
        <div className="relative w-full aspect-video max-h-screen overflow-hidden">
          <iframe
            src="https://player.vimeo.com/video/1142028485?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&muted=1&loop=1&background=1&playsinline=1&quality=auto&dnt=1"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title="NeuralTwin"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16 space-y-3 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-scale-in">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{t("vision.title")}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                {t("vision.subtitle")}
              </h2>
            </div>

            {/* Description */}
            <div className="glass p-8 md:p-12 rounded-3xl mb-12 space-y-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
                {t("vision.desc1")}
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t("vision.desc2")}
              </p>
              <div className="pt-5 border-t border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("vision.desc3")}
                  <br />
                  {t("vision.desc4")}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass p-12 rounded-3xl text-center space-y-5 glow">
            <h2 className="text-2xl md:text-3xl font-bold">
              {t("finalCta.title")}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {t("finalCta.desc")}
            </p>
            <Button 
              asChild 
              size="default" 
              className="text-base px-6 py-5"
              onClick={() => trackCTAClick('meeting_request_final', '/contact', 3)}
            >
              <Link to="/contact">
                {t("finalCta.button")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
