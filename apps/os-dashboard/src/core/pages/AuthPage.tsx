import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const authSchema = z.object({
  email: z.string().trim().email({ message: "올바른 이메일 주소를 입력하세요" }).max(255, { message: "이메일은 255자 이하여야 합니다" }),
  password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다" }).max(100, { message: "비밀번호는 100자 이하여야 합니다" }),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { signIn, user, resetPassword, signInWithGoogle, signInWithKakao } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = authSchema.parse({ email, password });
      const { error } = await signIn(validatedData.email, validatedData.password);

      if (error) {
        // Check for no subscription error
        if (error.message === 'NO_SUBSCRIPTION') {
          toast({
            title: "구독 필요",
            description: "활성화된 구독이 없습니다. 웹사이트에서 구독을 먼저 진행해주세요.",
            variant: "destructive",
            action: (
              <a 
                href="https://www.neuraltwin.ai/pricing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline text-sm hover:opacity-80"
              >
                구독하기
              </a>
            ),
          });
          return;
        }
        
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "로그인 실패",
            description: "이메일 또는 비밀번호가 올바르지 않습니다.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "로그인 실패",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "입력 오류",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const emailSchema = z.string().trim().email({ message: "올바른 이메일 주소를 입력하세요" });
      const validatedEmail = emailSchema.parse(resetEmail);

      const { error } = await resetPassword(validatedEmail);

      if (error) {
        toast({
          title: "비밀번호 재설정 실패",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "이메일 전송 완료",
          description: "비밀번호 재설정 링크를 이메일로 전송했습니다. 이메일을 확인해주세요.",
        });
        setResetDialogOpen(false);
        setResetEmail("");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "입력 오류",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: "Google 로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleKakaoSignIn = async () => {
    const { error } = await signInWithKakao();
    
    if (error) {
      toast({
        title: "카카오 로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 h-full w-full animate-float rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 h-full w-full animate-float rounded-full bg-accent/5 blur-3xl" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main card */}
      <Card className="relative w-full max-w-md backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl hover-lift animate-scale-in">
        <CardHeader className="space-y-4 pb-8 pt-10 text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg animate-pulse">
            <svg
              className="h-8 w-8 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            NEURALTWIN
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground/80">
            AI 기반 매장 분석 플랫폼
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-8">
          <div className="space-y-4">
            <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-background/50 border-border/50 hover:bg-accent/50"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google로 계속하기
                </Button>

                <Button
                  type="button"
                  className="w-full h-11 bg-[#FEE500] text-[#000000] hover:bg-[#FEE500]/90 border-0"
                  onClick={handleKakaoSignIn}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.486 3 2 6.262 2 10.293c0 2.499 1.617 4.697 4.066 6.063l-1.064 3.876c-.062.227.062.469.29.544.078.026.16.026.238 0 .128-.026 3.156-2.007 4.47-2.803C10.657 18.2 11.322 18.293 12 18.293c5.514 0 10-3.262 10-7.293S17.514 3 12 3z"/>
                  </svg>
                  카카오로 계속하기
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">또는</span>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-medium">
                    이메일
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="admin@neuraltwin.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-medium">
                    비밀번호
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={100}
                    className="h-11 bg-background/50 border-border/50 focus:border-primary transition-colors"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      로그인 중...
                    </span>
                  ) : (
                    "로그인"
                  )}
                </Button>
                
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <button 
                      type="button"
                      className="mt-2 text-sm text-muted-foreground hover:text-primary transition-colors text-center w-full"
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>비밀번호 재설정</DialogTitle>
                      <DialogDescription>
                        가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">이메일</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="admin@neuraltwin.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          maxLength={255}
                          className="h-11"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={resetLoading}
                      >
                        {resetLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            전송 중...
                          </span>
                        ) : (
                          "재설정 링크 전송"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
