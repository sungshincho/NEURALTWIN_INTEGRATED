import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6 px-4">
          <div className="text-9xl font-bold gradient-text">404</div>
          <h1 className="text-3xl md:text-4xl font-bold">페이지를 찾을 수 없습니다</h1>
          <p className="text-xl text-muted-foreground">
            요청하신 페이지가 존재하지 않습니다.
          </p>
          <Button asChild size="lg">
            <Link to="/">
              <Home className="mr-2 w-5 h-5" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
