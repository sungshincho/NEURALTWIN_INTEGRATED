import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Calendar, Tag } from "lucide-react";
import {
  blogPosts,
  BLOG_CATEGORIES,
  type BlogCategory,
  type BlogPost,
} from "@/data/blog-posts";

/* ────────────────────────── helpers ────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function categoryLabel(cat: BlogCategory): string {
  return BLOG_CATEGORIES.find((c) => c.key === cat)?.label ?? cat;
}

const categoryColorMap: Record<string, string> = {
  "case-study": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  tech: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  trend: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

/* ────────────────────── Featured Card ─────────────────────── */

function FeaturedCard({ post }: { post: BlogPost }) {
  const linkTo = post.caseStudySlug
    ? `/case-study/${post.caseStudySlug}`
    : "#";

  return (
    <Link to={linkTo} className="block group">
      <Card className="glass overflow-hidden hover:scale-[1.01] transition-smooth">
        <div className="grid md:grid-cols-2">
          {/* Thumbnail gradient */}
          <div
            className={`h-64 md:h-auto bg-gradient-to-br ${post.gradient} relative`}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${
                  categoryColorMap[post.category] ?? ""
                }`}
              >
                <Tag className="w-3 h-3" />
                {categoryLabel(post.category as BlogCategory)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col justify-center space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
              {post.title}
            </h2>

            <p className="text-muted-foreground leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                자세히 읽기
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ───────────────────── Regular Card ──────────────────────── */

function BlogCard({ post }: { post: BlogPost }) {
  const linkTo = post.caseStudySlug
    ? `/case-study/${post.caseStudySlug}`
    : "#";

  return (
    <Link to={linkTo} className="block group">
      <Card className="glass overflow-hidden h-full hover:scale-[1.02] transition-smooth flex flex-col">
        {/* Thumbnail gradient */}
        <div
          className={`h-48 bg-gradient-to-br ${post.gradient} relative`}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-3 left-3">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                categoryColorMap[post.category] ?? ""
              }`}
            >
              <Tag className="w-3 h-3" />
              {categoryLabel(post.category as BlogCategory)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1 space-y-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
          </div>

          <h3 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {post.excerpt}
          </p>

          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
              읽기
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ───────────────────────── Page ──────────────────────────── */

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState<BlogCategory>("all");

  const featuredPost = blogPosts.find((p) => p.featured);

  const filteredPosts = useMemo(() => {
    const nonFeatured = blogPosts.filter((p) => !p.featured);
    if (activeCategory === "all") return nonFeatured;
    return nonFeatured.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="min-h-screen">
      <SEOHead
        title="블로그"
        description="NeuralTwin 인사이트 블로그 — 케이스 스터디, 기술 블로그, 리테일 업계 동향을 확인하세요."
        path="/blog"
      />
      <Header />

      {/* ───── Hero ───── */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">NeuralTwin 인사이트</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              오프라인 리테일의 미래를 만들어가는 이야기들.
              <br className="hidden sm:block" />
              케이스 스터디, 기술 블로그, 업계 동향을 확인하세요.
            </p>
          </div>
        </div>
      </section>

      {/* ───── Category Filter ───── */}
      <section className="pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {BLOG_CATEGORIES.map((cat) => (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.key)}
                className={
                  activeCategory === cat.key
                    ? ""
                    : "border-white/10 hover:border-white/20 text-muted-foreground"
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Featured Post ───── */}
      {activeCategory === "all" && featuredPost && (
        <section className="pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <FeaturedCard post={featuredPost} />
          </div>
        </section>
      )}

      {/* ───── Posts Grid ───── */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              해당 카테고리의 글이 아직 없습니다.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
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
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
