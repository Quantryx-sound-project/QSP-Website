import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { t } = useT();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, from, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const emailValue = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();

    try {
      if (isLogin) {
        const { error } = await signIn(emailValue, password);
        if (error) {
          toast.error(t("login.errSignin"), { description: error.message });
          return;
        }
        toast.success(t("login.okSignin"));
        navigate(from, { replace: true });
      } else {
        const { error } = await signUp(emailValue, password, name);
        if (error) {
          toast.error(t("login.errSignup"), { description: error.message });
          return;
        }
        toast.success(t("login.okSignup"), { description: t("login.okSignupDesc") });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(t("login.errGoogle"), { description: error.message });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error(t("login.forgotNeedEmail"), { description: t("login.forgotNeedEmailDesc") });
      return;
    }
    const { error } = await resetPassword(email);
    if (error) {
      toast.error(t("login.resetErr"), { description: error.message });
      return;
    }
    toast.success(t("login.resetSent"), { description: t("login.resetSentDesc") });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo-mark.svg" alt="" aria-hidden className="h-10 w-auto" />
          <span className="text-3xl font-bold tracking-tight">Alter</span>
        </Link>

        <Card className="bg-card/50 border-border/40">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? t("login.welcomeBack") : t("login.createAccount")}
            </CardTitle>
            <CardDescription>{isLogin ? t("login.signinSub") : t("login.signupSub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
              size="lg"
              onClick={handleGoogle}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
              </svg>
              {t("login.google")}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("login.or")}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t("login.name")}</Label>
                  <Input id="name" name="name" placeholder={t("login.namePh")} required={!isLogin} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tvoj@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {t("login.forgot")}
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={8}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? t("common.loading") : isLogin ? t("login.submitSignin") : t("login.submitSignup")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isLogin ? t("login.toggleToSignup") : t("login.toggleToSignin")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
