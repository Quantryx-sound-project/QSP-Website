import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Waves } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { t } = useT();
  const [loading, setLoading] = useState(false);

  // Supabase po kliknutí na odkaz z emailu vytvorí dočasnú reláciu (recovery),
  // takže updateUser({ password }) tu funguje aj bez prihlásenia heslom.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("reset.title")}</CardTitle>
            <CardDescription>{t("reset.sub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t("reset.newPassword")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("reset.confirm")}</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? t("reset.saving") : t("reset.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
