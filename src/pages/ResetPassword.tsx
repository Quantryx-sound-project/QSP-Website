import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Waves, MailCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

/**
 * Dual-mode reset page.
 *  - "request": arrived directly (e.g. from the app's "Forgot password" link).
 *    Ask for the email and send a reset link.
 *  - "set": arrived from the recovery email link (Supabase establishes a
 *    PASSWORD_RECOVERY session). Let the user set a new password.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, resetPassword } = useAuth();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"request" | "set">("request");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // Recovery link from the email fires PASSWORD_RECOVERY and creates a session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("set");
    });

    // Handle the case where the recovery token is already in the URL on load.
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("set");
    }

    return () => subscription.unsubscribe();
  }, []);

  // ── request a reset link ─────────────────────────────────────────────
  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error("Could not send the reset email", { description: error.message });
      return;
    }
    setSent(true);
    toast.success("Check your email", {
      description: "We sent you a link to set a new password.",
    });
  };

  // ── set a new password (after clicking the email link) ───────────────
  const handleSet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");

    if (password !== confirm) {
      toast.error(t("reset.mismatch"));
      setLoading(false);
      return;
    }

    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      toast.error(t("reset.err"), { description: error.message });
      return;
    }
    toast.success(t("reset.ok"), { description: t("reset.okDesc") });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Waves className="h-10 w-10 text-primary" />
          <span className="text-3xl font-bold tracking-tight">Alter</span>
        </Link>

        <Card className="bg-card/50 border-border/40">
          {mode === "set" ? (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t("reset.title")}</CardTitle>
                <CardDescription>{t("reset.sub")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSet} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("reset.newPassword")}</Label>
                    <Input id="password" name="password" type="password"
                           autoComplete="new-password" minLength={8}
                           placeholder="••••••••" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">{t("reset.confirm")}</Label>
                    <Input id="confirm" name="confirm" type="password"
                           autoComplete="new-password" minLength={8}
                           placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? t("reset.saving") : t("reset.save")}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : sent ? (
            <>
              <CardHeader className="text-center">
                <MailCheck className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription>
                  We sent a password reset link. Open it to set a new password.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to sign in
                </Link>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Reset your password</CardTitle>
                <CardDescription>
                  Enter your account email and we'll send you a link to set a new password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email"
                           autoComplete="email" placeholder="you@example.com" required />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Sending..." : "Send reset link"}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                    Back to sign in
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
