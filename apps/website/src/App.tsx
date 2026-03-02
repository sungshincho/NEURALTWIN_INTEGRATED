import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OrganizationSchema, SoftwareSchema } from "@/components/seo/StructuredData";

// Public pages — eager load (landing + core marketing)
import Product from "./pages/Product";
import Chat from "./pages/Chat";
import About from "./pages/About";
import Auth from "./pages/Auth";
import PricingPage from "./pages/PricingPage";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

// Blog / Case Study — lazy load (marketing content)
const Blog = lazy(() => import("./pages/Blog"));
const CaseStudyPage = lazy(() => import("./pages/CaseStudy"));

// Protected pages — lazy load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Subscribe = lazy(() => import("./pages/Subscribe"));

// OS Dashboard — lazy load (authenticated layout + pages)
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const ROIMeasurementPage = lazy(() => import("./features/roi/ROIMeasurementPage"));
const InsightHubPage = lazy(() => import("./features/insights/InsightHubPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const DigitalTwinStudioPage = lazy(() => import("./features/studio/DigitalTwinStudioPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

// 다크모드 기본값 — App 컴포넌트 렌더 전 즉시 실행 (FOUC 방지)
(() => {
  const saved = localStorage.getItem("neuraltwin-theme");
  if (!saved) {
    // 첫 방문: 다크 모드를 기본값으로
    localStorage.setItem("neuraltwin-theme", "dark");
    document.documentElement.classList.add("dark");
  } else if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OrganizationSchema />
      <SoftwareSchema />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* ===== Public Routes ===== */}
              <Route path="/" element={<Chat />} />
              <Route path="/chat" element={<Navigate to="/" replace />} />
              <Route path="/product" element={<Product />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/case-study/:slug" element={<CaseStudyPage />} />

              {/* ===== Protected Routes (Website) ===== */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscribe"
                element={
                  <ProtectedRoute>
                    <Subscribe />
                  </ProtectedRoute>
                }
              />

              {/* ===== OS Dashboard Routes (Protected + DashboardLayout) ===== */}
              <Route
                path="/os"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/os/insights" replace />} />
                <Route path="insights" element={<InsightHubPage />} />
                <Route path="studio" element={<DigitalTwinStudioPage />} />
                <Route path="roi" element={<ROIMeasurementPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* ===== Catch-all ===== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
