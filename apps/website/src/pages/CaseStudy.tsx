import { useParams, Link, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowLeft,
  XCircle,
  CheckCircle2,
  Quote,
  ChevronRight,
} from "lucide-react";
import {
  getCaseStudyBySlug,
  getRelatedCaseStudies,
  type CaseStudy as CaseStudyType,
  type PainPoint,
  type CaseStudyStat,
  type TimelineStep,
  type BeforeAfterMetric,
} from "@/data/case-studies";

/* ═══════════════════════ Sub-components ═══════════════════════ */

/* ───── Hero ───── */
function HeroSection({ cs }: { cs: CaseStudyType }) {
  const industryBadgeColor: Record<string, string> = {
    purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  };

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background acting as hero image placeholder */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cs.heroGradient} opacity-60`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-3xl space-y-6 animate-fade-in-up">
          {/* Industry badge */}
          <span
            className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${
              industryBadgeColor[cs.industryColor] ?? industryBadgeColor.blue
            }`}
          >
            {cs.industry}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            {cs.title}
            <br />
            <span className="text-muted-foreground text-2xl sm:text-3xl md:text-4xl font-semibold">
              {cs.subtitle}
            </span>
          </h1>

          {/* Hero stat */}
          <div className="flex items-baseline gap-3">
            <span className="text-5xl md:text-7xl font-bold font-mono text-emerald-400">
              {cs.heroStat.value}
            </span>
            <span className="text-lg md:text-2xl text-muted-foreground">
              {cs.heroStat.label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───── Stats Bar ───── */
function StatsBar({ stats }: { stats: CaseStudyStat[] }) {
  return (
    <section className="border-y border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center px-4"
            >
              <span
                className={`text-3xl md:text-4xl font-bold font-mono ${
                  stat.trend === "positive"
                    ? "text-emerald-400"
                    : "text-cyan-400"
                }`}
              >
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Problem Section ───── */
function ProblemSection({
  sectionTitle,
  description,
  painPoints,
}: {
  sectionTitle: string;
  description: string;
  painPoints: PainPoint[];
}) {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-3">
          도입 전 과제
        </p>

        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          {sectionTitle}
        </h2>

        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mb-12">
          {description}
        </p>

        {/* Pain Point Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {painPoints.map((pp, i) => (
            <Card
              key={i}
              className="glass p-6 border-t-[3px] border-t-rose-500 space-y-3"
            >
              <XCircle className="w-6 h-6 text-rose-400" />
              <h3 className="text-lg font-bold">{pp.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pp.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Solution Section ───── */
function SolutionSection({
  sectionTitle,
  description,
  timeline,
  features,
}: {
  sectionTitle: string;
  description: string;
  timeline: TimelineStep[];
  features: string[];
}) {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-muted/10 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">
          NeuralTwin 도입
        </p>

        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          {sectionTitle}
        </h2>

        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mb-12">
          {description}
        </p>

        {/* Timeline — horizontal on desktop, vertical on mobile */}
        <div className="mb-12">
          {/* Desktop horizontal timeline */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Line */}
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-cyan-500/30" />

              <div className="flex justify-between">
                {timeline.map((step, i) => (
                  <div key={i} className="relative flex flex-col items-center max-w-[160px]">
                    {/* Dot */}
                    <div className="w-6 h-6 rounded-full bg-cyan-500 border-4 border-background z-10" />
                    <span className="text-xs font-semibold text-cyan-400 mt-3">
                      {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 text-center">
                      {step.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile vertical timeline */}
          <div className="md:hidden space-y-6">
            {timeline.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-background" />
                  {i < timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-cyan-500/30 mt-1" />
                  )}
                </div>
                <div className="pb-6">
                  <span className="text-xs font-semibold text-cyan-400">
                    {step.label}
                  </span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features used */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Results Section ───── */
function ResultsSection({
  sectionTitle,
  description,
  metrics,
}: {
  sectionTitle: string;
  description: string;
  metrics: BeforeAfterMetric[];
}) {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
          도입 효과
        </p>

        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          {sectionTitle}
        </h2>

        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mb-12">
          {description}
        </p>

        {/* Before / After metric cards */}
        <div className="space-y-4">
          {metrics.map((m, i) => (
            <Card key={i} className="glass p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Label */}
                <div className="sm:w-48 font-semibold text-sm">
                  {m.label}
                </div>

                {/* Before / After bars */}
                <div className="flex-1 space-y-2">
                  {/* Before */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10">
                      Before
                    </span>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-slate-500/40 rounded-full flex items-center px-3"
                        style={{ width: "50%" }}
                      >
                        <span className="text-xs font-mono text-slate-300">
                          {m.before}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* After */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10">
                      After
                    </span>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/40 rounded-full flex items-center px-3"
                        style={{ width: "80%" }}
                      >
                        <span className="text-xs font-mono text-emerald-300">
                          {m.after}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change badge */}
                <div
                  className={`text-center sm:w-24 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
                    m.improved
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-rose-500/15 text-rose-400"
                  }`}
                >
                  {m.change}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Testimonial Section ───── */
function TestimonialSection({
  quote,
  author,
  role,
  company,
}: {
  quote: string;
  author: string;
  role: string;
  company: string;
}) {
  return (
    <section className="py-16 md:py-20 bg-[#0A0E1A]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center relative">
          {/* Decorative quote mark */}
          <Quote className="w-20 h-20 text-cyan-500/10 absolute -top-4 left-1/2 -translate-x-1/2" />

          <blockquote className="relative z-10">
            <p className="text-xl md:text-2xl font-medium italic leading-relaxed text-slate-100">
              &ldquo;{quote}&rdquo;
            </p>
          </blockquote>

          {/* Attribution */}
          <div className="mt-8 flex items-center justify-center gap-3">
            {/* Default avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {author.charAt(0)}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-100">
                {author}
              </div>
              <div className="text-xs text-slate-400">
                {role}, {company}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───── Related Case Studies ───── */
function RelatedSection({ currentSlug }: { currentSlug: string }) {
  const related = getRelatedCaseStudies(currentSlug);
  if (related.length === 0) return null;

  const industryBadgeColor: Record<string, string> = {
    purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  };

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">
          다른 사례도 확인해 보세요
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((cs) => (
            <Link
              key={cs.slug}
              to={`/case-study/${cs.slug}`}
              className="group block"
            >
              <Card className="glass overflow-hidden hover:scale-[1.02] transition-smooth h-full flex flex-col">
                {/* Gradient thumbnail */}
                <div
                  className={`h-48 bg-gradient-to-br ${cs.heroGradient} relative`}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-3 left-3">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        industryBadgeColor[cs.industryColor] ??
                        industryBadgeColor.blue
                      }`}
                    >
                      {cs.industry}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1 space-y-3">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                    {cs.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                    {cs.subtitle}
                  </p>

                  {/* Key stat */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {cs.heroStat.value}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cs.heroStat.label}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 group-hover:gap-2 transition-all">
                    자세히 보기
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── CTA Section ───── */
function CTASection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold">
          우리 매장에도 적용해 보세요
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          14일 무료 체험으로 시작하세요. 설치 2시간, 위약금 없음.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/contact">
              무료 데모 시작하기
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/contact">문의하기</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          궁금한 점이 있으신가요?{" "}
          <a
            href="mailto:sales@neuraltwin.io"
            className="text-cyan-400 hover:underline"
          >
            sales@neuraltwin.io
          </a>
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════ Main Page ═══════════════════════════ */

const CaseStudy = () => {
  const { slug } = useParams<{ slug: string }>();
  const cs = slug ? getCaseStudyBySlug(slug) : undefined;

  if (!cs) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen">
      <SEOHead
        title={cs.seoTitle}
        description={cs.seoDescription}
        path={`/case-study/${cs.slug}`}
        type="article"
      />
      <Header />

      {/* Back to blog */}
      <div className="fixed top-24 left-4 z-40 hidden lg:block">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors glass px-3 py-2 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          블로그
        </Link>
      </div>

      <HeroSection cs={cs} />
      <StatsBar stats={cs.stats} />
      <ProblemSection
        sectionTitle={cs.problem.sectionTitle}
        description={cs.problem.description}
        painPoints={cs.problem.painPoints}
      />
      <SolutionSection
        sectionTitle={cs.solution.sectionTitle}
        description={cs.solution.description}
        timeline={cs.solution.timeline}
        features={cs.solution.features}
      />
      <ResultsSection
        sectionTitle={cs.results.sectionTitle}
        description={cs.results.description}
        metrics={cs.results.metrics}
      />
      <TestimonialSection
        quote={cs.testimonial.quote}
        author={cs.testimonial.author}
        role={cs.testimonial.role}
        company={cs.testimonial.company}
      />
      <RelatedSection currentSlug={cs.slug} />
      <CTASection />

      <Footer />
    </div>
  );
};

export default CaseStudy;
