import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useT } from "@/lib/i18n";
import { site } from "@/lib/site";

// Verejná stránka /refund-policy — zásady 30-dňovej garancie vrátenia peňazí.

type Section = { h: string; p?: string[]; li?: string[] };

const CONTENT: Record<"en" | "sk", { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Refund Policy",
    updated: "Last updated: September 2026",
    intro:
      "We want you to be happy with ALTER. Every paid edition comes with a 30-day money-back guarantee, subject to the conditions below.",
    sections: [
      {
        h: "1. The 30-day guarantee",
        p: [
          "You can request a full refund of a paid, one-time ALTER license (Listener, Creator or Pro) within 30 days of the purchase date shown on your receipt. After 30 days the guarantee ends and purchases are no longer refundable, except where the law requires otherwise.",
        ],
      },
      {
        h: "2. How to request a refund",
        li: [
          "Sign in to your account on quantryxstudio.com and open My Licenses.",
          "Next to the license, choose “Request a refund” and complete the short form (reason, description of the problem and, for technical issues, your system and DAW).",
          "Confirm that you understand the license will be deactivated.",
        ],
        p: [
          "Requests are only accepted through your account, so we can verify that the request comes from the purchaser. If you cannot sign in, write to us from the e-mail address used for the purchase.",
        ],
      },
      {
        h: "3. Review and payout",
        li: [
          "Each request is reviewed personally within 3 business days.",
          "Approved refunds are issued by Lemon Squeezy, our Merchant of Record, to the original payment method. Depending on your bank, the money usually arrives within 5–10 business days.",
          "We will let you know by e-mail when your request has been approved or if we need more information.",
        ],
      },
      {
        h: "4. What happens to your license",
        p: [
          "When a refund is approved, the license is permanently deactivated on all computers and cannot be restored. You agree to uninstall ALTER and delete all copies of the installer. To use ALTER again, a new license is required.",
        ],
      },
      {
        h: "5. When a refund is not possible",
        li: [
          "The request is submitted more than 30 days after purchase.",
          "The license was already refunded once for the same customer and edition.",
          "Free editions (Demo, Early Access) and licenses that were deactivated by the customer.",
          "Signs of abuse, such as repeated purchase-and-refund cycles, sharing or reselling the license, or violating the End User License Agreement.",
        ],
      },
      {
        h: "6. Before you ask for a refund",
        p: [
          "Most problems — installation, activation, DAW compatibility or audio routing — can be solved quickly. If you bought the wrong edition, we can move your purchase to a different edition instead of a refund. Contact us first and we will do our best to help.",
        ],
      },
      {
        h: "7. Subscriptions",
        p: [
          "If ALTER is ever offered as a subscription, you can cancel at any time in the customer portal linked in your account. Cancellation stops future renewals; payments already made are covered by the 30-day guarantee only for the first payment.",
        ],
      },
      {
        h: "8. Your statutory rights",
        p: [
          "This policy does not limit any rights you have under the consumer protection laws of your country. Purchases are processed by Lemon Squeezy as Merchant of Record, and their buyer terms also apply.",
        ],
      },
    ],
  },
  sk: {
    title: "Zásady vrátenia peňazí",
    updated: "Posledná aktualizácia: september 2026",
    intro:
      "Chceme, aby si bol s ALTERom spokojný. Každá platená edícia má 30-dňovú garanciu vrátenia peňazí za podmienok uvedených nižšie.",
    sections: [
      {
        h: "1. 30-dňová garancia",
        p: [
          "O vrátenie celej sumy za platenú jednorazovú licenciu ALTER (Listener, Creator alebo Pro) môžeš požiadať do 30 dní od dátumu nákupu uvedeného na potvrdení. Po 30 dňoch garancia končí a nákup už nie je možné refundovať, okrem prípadov, keď to vyžaduje zákon.",
        ],
      },
      {
        h: "2. Ako požiadať o refund",
        li: [
          "Prihlás sa do svojho účtu na quantryxstudio.com a otvor Moje licencie.",
          "Pri licencii zvoľ „Požiadať o vrátenie peňazí“ a vyplň krátky formulár (dôvod, popis problému a pri technických problémoch aj systém a DAW).",
          "Potvrď, že rozumieš, že licencia bude deaktivovaná.",
        ],
        p: [
          "Žiadosti prijímame len cez účet, aby sme vedeli overiť, že ide o kupujúceho. Ak sa nevieš prihlásiť, napíš nám z emailu, ktorý si použil pri nákupe.",
        ],
      },
      {
        h: "3. Posúdenie a vyplatenie",
        li: [
          "Každú žiadosť posudzujeme osobne do 3 pracovných dní.",
          "Schválené refundy vypláca Lemon Squeezy (náš Merchant of Record) na pôvodný spôsob platby. Podľa banky peniaze zvyčajne dorazia do 5–10 pracovných dní.",
          "O schválení alebo o potrebe doplniť informácie ťa budeme informovať emailom.",
        ],
      },
      {
        h: "4. Čo sa stane s licenciou",
        p: [
          "Po schválení refundu je licencia natrvalo deaktivovaná na všetkých počítačoch a nedá sa obnoviť. Zaväzuješ sa ALTER odinštalovať a zmazať všetky kópie inštalačky. Na ďalšie používanie je potrebná nová licencia.",
        ],
      },
      {
        h: "5. Kedy refund nie je možný",
        li: [
          "Žiadosť je podaná neskôr ako 30 dní od nákupu.",
          "Licencia rovnakej edície už bola rovnakému zákazníkovi raz refundovaná.",
          "Bezplatné edície (Demo, Early Access) a licencie, ktoré zákazník sám deaktivoval.",
          "Známky zneužitia, napr. opakované kupovanie a vracanie, zdieľanie alebo ďalší predaj licencie či porušenie licenčnej zmluvy.",
        ],
      },
      {
        h: "6. Skôr než požiadaš o refund",
        p: [
          "Väčšinu problémov — inštalácia, aktivácia, kompatibilita s DAW či smerovanie zvuku — vieme vyriešiť rýchlo. Ak si kúpil nesprávnu edíciu, namiesto refundu ti vieme nákup presunúť na inú. Najprv nás kontaktuj a urobíme maximum, aby sme pomohli.",
        ],
      },
      {
        h: "7. Predplatné",
        p: [
          "Ak bude ALTER niekedy ponúkaný ako predplatné, zrušiť ho môžeš kedykoľvek v zákazníckom portáli, na ktorý vedie odkaz v tvojom účte. Zrušenie zastaví ďalšie obnovy; 30-dňová garancia sa vzťahuje len na prvú platbu.",
        ],
      },
      {
        h: "8. Tvoje zákonné práva",
        p: [
          "Tieto zásady neobmedzujú práva, ktoré máš podľa zákonov na ochranu spotrebiteľa vo svojej krajine. Nákupy spracúva Lemon Squeezy ako Merchant of Record a platia aj jeho podmienky pre kupujúcich.",
        ],
      },
    ],
  },
};

const RefundPolicy = () => {
  const { lang } = useT();
  const c = lang === "sk" ? CONTENT.sk : CONTENT.en;
  const contact = lang === "sk" ? "Kontakt" : "Contact";
  const eula = lang === "sk" ? "Licenčná zmluva je súčasťou inštalačky." : "The End User License Agreement is included in the installer.";

  return (
    <AppLayout>
      <div className="px-6 py-12">
        <div className="container mx-auto max-w-3xl">
          <h1 className="mb-2 text-3xl font-bold">{c.title}</h1>
          <p className="mb-8 text-sm text-muted-foreground">{c.updated}</p>
          <p className="mb-8 text-muted-foreground">{c.intro}</p>
          <div className="space-y-8">
            {c.sections.map((s) => (
              <section key={s.h}>
                <h2 className="mb-2 text-lg font-semibold">{s.h}</h2>
                {s.li && (
                  <ul className="mb-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {s.li.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
                {s.p?.map((x) => (
                  <p key={x} className="text-muted-foreground">
                    {x}
                  </p>
                ))}
              </section>
            ))}
            <section>
              <h2 className="mb-2 text-lg font-semibold">{contact}</h2>
              <p className="text-muted-foreground">
                <a href={`mailto:${site.email}`} className="text-primary underline">
                  {site.email}
                </a>
                {" · "}
                <Link to="/dashboard#licenses" className="text-primary underline">
                  {lang === "sk" ? "Moje licencie" : "My Licenses"}
                </Link>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{eula}</p>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RefundPolicy;
