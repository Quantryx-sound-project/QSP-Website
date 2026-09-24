import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, LifeBuoy, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { site } from "@/lib/site";
import { useRequestRefund, describeSupabaseError, type License } from "@/hooks/useProfileData";

// 30-dňová garancia vrátenia peňazí — 3-krokový formulár žiadosti.
// Krok 1: čo sa stane + ponuka podpory, krok 2: dôvod a popis, krok 3: potvrdenie.

const REASONS = [
  "technical",
  "compatibility",
  "performance",
  "missing_feature",
  "wrong_edition",
  "duplicate",
  "expectations",
  "other",
] as const;
type Reason = (typeof REASONS)[number];
const NEEDS_SYSTEM: Reason[] = ["technical", "compatibility", "performance"];
const MIN_DETAILS = 50;

const TXT = {
  en: {
    title: "Request a refund",
    step: (n: number) => `Step ${n} of 3`,
    s1Head: "Before you continue",
    s1Intro:
      "Every paid edition of ALTER comes with a 30-day money-back guarantee. Each request is reviewed personally, so please read how it works:",
    s1Points: [
      "Your license will be permanently deactivated on all your computers once the refund is approved. It cannot be restored — you would need to buy a new license.",
      "Requests are reviewed within 3 business days. After approval, the money is returned by Lemon Squeezy to your original payment method, usually within 5–10 business days depending on your bank.",
      "One refund per customer and edition.",
      "The guarantee applies only to requests submitted within 30 days of purchase.",
    ],
    s1Support: "Most problems can be fixed in a few minutes",
    s1SupportText:
      "Issues with installation, activation, your DAW or audio routing are usually solved quickly. Bought the wrong edition? We can move your purchase to a different edition instead of a refund.",
    s1Contact: "Contact support",
    s1Continue: "Continue to refund request",
    s2Head: "Tell us what went wrong",
    s2Reason: "Main reason",
    reasons: {
      technical: "Technical problem (crash, bug, activation)",
      compatibility: "Doesn't work with my DAW / operating system",
      performance: "Performance (CPU / GPU usage)",
      missing_feature: "A feature I need is missing",
      wrong_edition: "I bought the wrong edition",
      duplicate: "Accidental or duplicate purchase",
      expectations: "It didn't meet my expectations",
      other: "Other",
    } as Record<Reason, string>,
    s2Details: "Describe the problem",
    s2DetailsHint: (n: number) => `At least ${MIN_DETAILS} characters (${n}/${MIN_DETAILS}). What did you try to do and what happened?`,
    s2System: "Your system and DAW",
    s2SystemPh: "e.g. Windows 11, Ableton Live 12, RME Babyface",
    s2Support: "Did you contact support about this problem?",
    yes: "Yes",
    no: "No",
    s2WrongEdition:
      "Tip: we can switch your purchase to a different edition — just write to support, no refund needed.",
    back: "Back",
    next: "Continue",
    s3Head: "Confirm your request",
    s3Summary: "Summary",
    s3Edition: "Edition",
    s3Amount: "Amount",
    s3Reason: "Reason",
    s3Checks: [
      "I understand that my license will be permanently deactivated on all computers once the refund is approved.",
      "I will uninstall ALTER and delete all copies of the installer.",
      "The information above is accurate and I agree with the Refund Policy.",
    ],
    policy: "Refund Policy",
    submit: "Submit refund request",
    cancel: "Cancel",
    sent: "Refund request submitted",
    sentDesc: "We'll review it within 3 business days and let you know by e-mail.",
    err: "Couldn't submit the request",
    errMap: {
      guarantee_expired: "The 30-day money-back guarantee for this purchase has ended.",
      already_pending: "A refund request for this license is already being reviewed.",
      already_refunded_once: "This edition has already been refunded once on your account.",
      not_refundable: "This license isn't eligible for a refund (free or subscription license).",
      license_not_active: "Only active licenses can be refunded.",
    } as Record<string, string>,
  },
  sk: {
    title: "Žiadosť o vrátenie peňazí",
    step: (n: number) => `Krok ${n} z 3`,
    s1Head: "Skôr než budeš pokračovať",
    s1Intro:
      "Každá platená edícia ALTERu má 30-dňovú garanciu vrátenia peňazí. Každú žiadosť posudzujeme osobne, preto si prosím prečítaj, ako to funguje:",
    s1Points: [
      "Po schválení refundu bude tvoja licencia natrvalo deaktivovaná na všetkých tvojich počítačoch. Nedá sa obnoviť — musel by si si kúpiť novú.",
      "Žiadosti posudzujeme do 3 pracovných dní. Po schválení vráti Lemon Squeezy peniaze na pôvodný spôsob platby, zvyčajne do 5–10 pracovných dní podľa banky.",
      "Jeden refund na zákazníka a edíciu.",
      "Garancia platí len pre žiadosti podané do 30 dní od nákupu.",
    ],
    s1Support: "Väčšina problémov sa dá vyriešiť za pár minút",
    s1SupportText:
      "Problémy s inštaláciou, aktiváciou, DAW alebo smerovaním zvuku vieme zvyčajne rýchlo vyriešiť. Kúpil si nesprávnu edíciu? Namiesto refundu ti vieme nákup presunúť na inú edíciu.",
    s1Contact: "Kontaktovať podporu",
    s1Continue: "Pokračovať k žiadosti",
    s2Head: "Povedz nám, čo nefungovalo",
    s2Reason: "Hlavný dôvod",
    reasons: {
      technical: "Technický problém (pád, chyba, aktivácia)",
      compatibility: "Nefunguje s mojím DAW / operačným systémom",
      performance: "Výkon (záťaž CPU / GPU)",
      missing_feature: "Chýba mi funkcia, ktorú potrebujem",
      wrong_edition: "Kúpil som nesprávnu edíciu",
      duplicate: "Omylom / dvakrát zaplatené",
      expectations: "Nesplnilo moje očakávania",
      other: "Iné",
    } as Record<Reason, string>,
    s2Details: "Popíš problém",
    s2DetailsHint: (n: number) => `Aspoň ${MIN_DETAILS} znakov (${n}/${MIN_DETAILS}). Čo si sa pokúšal spraviť a čo sa stalo?`,
    s2System: "Tvoj systém a DAW",
    s2SystemPh: "napr. Windows 11, Ableton Live 12, RME Babyface",
    s2Support: "Kontaktoval si kvôli tomuto problému podporu?",
    yes: "Áno",
    no: "Nie",
    s2WrongEdition:
      "Tip: nákup ti vieme presunúť na inú edíciu — stačí napísať podpore, refund netreba.",
    back: "Späť",
    next: "Pokračovať",
    s3Head: "Potvrď žiadosť",
    s3Summary: "Zhrnutie",
    s3Edition: "Edícia",
    s3Amount: "Suma",
    s3Reason: "Dôvod",
    s3Checks: [
      "Rozumiem, že po schválení refundu bude moja licencia natrvalo deaktivovaná na všetkých počítačoch.",
      "ALTER odinštalujem a zmažem všetky kópie inštalačky.",
      "Uvedené údaje sú pravdivé a súhlasím so Zásadami vrátenia peňazí.",
    ],
    policy: "Zásady vrátenia peňazí",
    submit: "Odoslať žiadosť o refund",
    cancel: "Zrušiť",
    sent: "Žiadosť o refund bola odoslaná",
    sentDesc: "Posúdime ju do 3 pracovných dní a dáme ti vedieť emailom.",
    err: "Žiadosť sa nepodarilo odoslať",
    errMap: {
      guarantee_expired: "30-dňová garancia pre tento nákup už skončila.",
      already_pending: "Žiadosť o refund pre túto licenciu sa už posudzuje.",
      already_refunded_once: "Táto edícia už bola na tvojom účte raz refundovaná.",
      not_refundable: "Na túto licenciu sa refund nevzťahuje (bezplatná alebo predplatné).",
      license_not_active: "Refundovať sa dajú len aktívne licencie.",
    } as Record<string, string>,
  },
};

interface Props {
  license: License;
  licenseName: string;
  amountLabel: string;
  onClose: () => void;
}

const RefundFlow = ({ license, licenseName, amountLabel, onClose }: Props) => {
  const { lang } = useT();
  const L = lang === "sk" ? TXT.sk : TXT.en;
  const request = useRequestRefund();

  const [step, setStep] = useState(1);
  const [reason, setReason] = useState<Reason | "">("");
  const [details, setDetails] = useState("");
  const [system, setSystem] = useState("");
  const [contacted, setContacted] = useState<boolean | null>(null);
  const [checks, setChecks] = useState([false, false, false]);

  const needsSystem = reason !== "" && NEEDS_SYSTEM.includes(reason);
  const step2Valid =
    reason !== "" &&
    details.trim().length >= MIN_DETAILS &&
    contacted !== null &&
    (!needsSystem || system.trim().length >= 3);
  const step3Valid = checks.every(Boolean);

  const supportHref = `mailto:${site.email}?subject=${encodeURIComponent(
    `ALTER support – ${licenseName}`
  )}`;

  const submit = () => {
    request.mutate(
      {
        licenseId: license.id,
        reason: reason as string,
        details,
        systemInfo: system,
        contactedSupport: Boolean(contacted),
      },
      {
        onSuccess: () => {
          toast.success(L.sent, { description: L.sentDesc });
          onClose();
        },
        onError: (e) => {
          const msg = (e as { message?: string })?.message ?? "";
          const known = Object.keys(L.errMap).find((k) => msg.includes(k));
          toast.error(L.err, { description: known ? L.errMap[known] : describeSupabaseError(e) });
        },
      }
    );
  };

  const field =
    "w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-semibold">{L.title}</h4>
        <span className="text-xs text-muted-foreground">{L.step(step)}</span>
      </div>

      {/* ---------- KROK 1 ---------- */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="font-medium">{L.s1Head}</p>
          <p className="text-muted-foreground">{L.s1Intro}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            {L.s1Points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="flex items-center gap-2 font-medium">
              <LifeBuoy className="h-4 w-4 text-primary" />
              {L.s1Support}
            </p>
            <p className="mt-1 text-muted-foreground">{L.s1SupportText}</p>
            <Button asChild size="sm" className="mt-3">
              <a href={supportHref}>{L.s1Contact}</a>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link to="/refund-policy" className="text-xs text-muted-foreground underline">
              {L.policy}
            </Link>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={onClose}>
                {L.cancel}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setStep(2)}>
                {L.s1Continue}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- KROK 2 ---------- */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="font-medium">{L.s2Head}</p>

          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">{L.s2Reason} *</span>
            <select
              className={field}
              value={reason}
              onChange={(e) => setReason(e.target.value as Reason)}
            >
              <option value="" disabled>
                —
              </option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {L.reasons[r]}
                </option>
              ))}
            </select>
          </label>

          {reason === "wrong_edition" && (
            <p className="rounded-md border border-primary/30 bg-primary/5 p-2 text-xs">
              {L.s2WrongEdition}{" "}
              <a href={supportHref} className="text-primary underline">
                {L.s1Contact}
              </a>
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">{L.s2Details} *</span>
            <textarea
              className={`${field} min-h-[110px]`}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
            />
            <span
              className={`mt-1 block text-xs ${
                details.trim().length >= MIN_DETAILS ? "text-muted-foreground" : "text-amber-500"
              }`}
            >
              {L.s2DetailsHint(Math.min(details.trim().length, MIN_DETAILS))}
            </span>
          </label>

          {needsSystem && (
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">{L.s2System} *</span>
              <input
                className={field}
                value={system}
                placeholder={L.s2SystemPh}
                onChange={(e) => setSystem(e.target.value)}
                maxLength={200}
              />
            </label>
          )}

          <div>
            <span className="mb-1 block text-xs text-muted-foreground">{L.s2Support} *</span>
            <div className="flex gap-4">
              {[true, false].map((v) => (
                <label key={String(v)} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`contacted-${license.id}`}
                    checked={contacted === v}
                    onChange={() => setContacted(v)}
                  />
                  {v ? L.yes : L.no}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {L.back}
            </Button>
            <Button size="sm" variant="outline" disabled={!step2Valid} onClick={() => setStep(3)}>
              {L.next}
            </Button>
          </div>
        </div>
      )}

      {/* ---------- KROK 3 ---------- */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="font-medium">{L.s3Head}</p>
          <div className="rounded-md border border-border/50 p-3 text-xs">
            <p className="mb-1 font-medium">{L.s3Summary}</p>
            <p>
              {L.s3Edition}: <span className="text-foreground">{licenseName}</span>
            </p>
            <p>
              {L.s3Amount}: <span className="text-foreground">{amountLabel}</span>
            </p>
            <p>
              {L.s3Reason}: <span className="text-foreground">{reason ? L.reasons[reason] : ""}</span>
            </p>
          </div>

          <div className="space-y-2">
            {L.s3Checks.map((c, i) => (
              <label key={c} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={checks[i]}
                  onChange={(e) =>
                    setChecks((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                  }
                />
                <span className="text-muted-foreground">
                  {c}{" "}
                  {i === 2 && (
                    <Link to="/refund-policy" target="_blank" className="text-primary underline">
                      ({L.policy})
                    </Link>
                  )}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-between gap-2">
            <Button size="sm" variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {L.back}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!step3Valid || request.isPending}
              onClick={submit}
            >
              {request.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {L.submit}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundFlow;
