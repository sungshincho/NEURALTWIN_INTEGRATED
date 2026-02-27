import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";
// import { LanguageToggle } from "@/components/LanguageToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import neuraltwinLogo from "@/assets/neuraltwin-logo.png";
export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const {
    user,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user]);
  const fetchProfile = async (userId: string) => {
    const {
      data
    } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setProfile(data);
    }
  };
  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
    toast({
      title: "로그아웃 완료",
      description: "성공적으로 로그아웃되었습니다."
    });
    navigate("/", {
      replace: true
    });
  };
  const navigation = [{
    name: t("nav.product"),
    href: "/product"
  }, {
    name: t("nav.pricing"),
    href: "/pricing"
  }, {
    name: t("nav.contact"),
    href: "/contact"
  }, {
    name: "대시보드",
    href: "/os/insights"
  }];
  return <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={() => { if (location.pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center">
            <img src={neuraltwinLogo} alt="NEURALTWIN" className="h-5 sm:h-6 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navigation.map(item => <Link key={item.href} to={item.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${location.pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                {item.name}
              </Link>)}
            {/* <LanguageToggle /> */}
          </div>

         {/* Auth Buttons */}
<div className="hidden md:flex md:items-center md:space-x-2">
  {user ? (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 min-w-10 rounded-full p-0 hover:bg-transparent
                     focus-visible:ring-0 focus-visible:ring-offset-0
                     data-[state=open]:bg-transparent flex-shrink-0
                     flex items-center justify-center"
        >
          <Avatar
            className="h-9 w-9 rounded-full hover:ring-1 hover:ring-foreground transition-all"
          >
            <AvatarImage
              src={profile?.avatar_url}
              alt={profile?.display_name || 'User'}
            />
            <AvatarFallback>
              {/* 아이콘 색은 항상 동일한 전경색(검정 계열) 유지 */}
              <User className="h-5 w-5 text-foreground" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.display_name || "사용자"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>내 계정 관리</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <>
      <Button variant="default" asChild className="font-bold">
        <Link to="/contact">
          소개서 요청
        </Link>
      </Button>
      {/* 로그인/회원가입 임시 숨김 */}
    </>
  )}
</div>

          {/* Mobile menu button */}
          <button type="button" className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted/50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && <div className="md:hidden glass border-t border-border/50">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navigation.map(item => <Link key={item.href} to={item.href} className={`block px-4 py-3 rounded-lg text-base font-medium transition-smooth ${location.pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`} onClick={() => setMobileMenuOpen(false)}>
                {item.name}
              </Link>)}
            <div className="pt-2 border-t border-border/50">{/* <LanguageToggle /> */}</div>
            {user ? <div className="pt-4 space-y-2">
                <div className="flex items-center gap-2 px-4 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || "User"} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{profile?.display_name || "사용자"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <User className="mr-2 h-4 w-4" />내 정보
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
            handleSignOut();
            setMobileMenuOpen(false);
          }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Button>
              </div> : <div className="pt-4 space-y-2">
                <Button asChild variant="default" className="w-full font-bold">
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                    소개서 요청
                  </Link>
                </Button>
                {/* 로그인/회원가입 임시 숨김 */}
              </div>}
          </div>
        </div>}
    </header>;
};
