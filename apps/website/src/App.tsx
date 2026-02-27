import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages — eager load (landing + core marketing)
import Index from "./pages/Index";
import Product from "./pages/Product";
import Chat from "./pages/Chat";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

// Protected pages — lazy load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Subscribe = lazy(() => import("./pages/Subscribe"));

// OS Dashboard — lazy load (authenticated layout + pages)
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const OsPlaceholder = lazy(() => import("./pages/os/OsPlaceholder"));
const ROIMeasurementPage = lazy(() => import("./features/roi/ROIMeasurementPage"));
const InsightHubPage = lazy(() => import("./features/insights/InsightHubPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* ===== Public Routes ===== */}
              <Route path="/" element={<Index />} />
              <Route path="/product" element={<Product />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

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
                <Route path="studio" element={<OsPlaceholder />} />
                <Route path="roi" element={<ROIMeasurementPage />} />
                <Route path="settings" element={<OsPlaceholder />} />
              </Route>

              {/* ===== Catch-all ===== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
