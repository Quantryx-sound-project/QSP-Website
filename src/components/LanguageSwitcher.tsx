import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, Lang } from "@/lib/i18n";

const options: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "sk", label: "SK" },
];

const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { lang, setLang } = useT();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border/40 bg-card/40 p-1",
        className
      )}
    >
      <Languages className="h-4 w-4 text-muted-foreground ml-1" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLang(o.code)}
          aria-pressed={lang === o.code}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium transition-colors",
            lang === o.code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
