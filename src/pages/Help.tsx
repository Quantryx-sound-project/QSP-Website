import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Download,
  Music2,
  AudioLines,
  Cpu,
  HelpCircle,
  ChevronDown,
  Lightbulb,
  AlertTriangle,
  Instagram,
  Mail,
  Plug,
  Monitor,
  Mic,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useT } from "@/lib/i18n";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import ssMoreInfo from "@/assets/help/smartscreen-1-more-info.webp";
import ssRunAnyway from "@/assets/help/smartscreen-2-run-anyway.webp";

// Verejná stránka /help — návod (Windows), ALTER v DAW, Audio Input,
// systémové požiadavky a FAQ. Písané pre úplných začiatočníkov.
// Obsah je tu (EN + SK) ako pri RefundPolicy, nie v translations.ts.

type TabId = "install" | "daw" | "automation" | "input" | "requirements" | "faq";
const TAB_IDS: TabId[] = ["install", "daw", "automation", "input", "requirements", "faq"];
const TAB_ICONS: Record<TabId, LucideIcon> = {
  install: Download,
  daw: Music2,
  automation: SlidersHorizontal,
  input: AudioLines,
  requirements: Cpu,
  faq: HelpCircle,
};

type Step = { title: string; text: ReactNode; img?: { src: string; alt: string }[]; tip?: ReactNode; warn?: ReactNode };
type InputCard = { icon: LucideIcon; name: string; what: string; when: string; note?: string };
type Tier = { name: string; sub: string; rows: [string, string][] };
type Faq = { q: string; a: ReactNode };

// ---------------------------------------------------------------- content

const L = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="text-primary underline underline-offset-2">
    {children}
  </Link>
);
const K = ({ children }: { children: ReactNode }) => (
  <span className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-medium text-foreground">{children}</span>
);

const content = (lang: "en" | "sk") => {
  const sk = lang === "sk";

  const tabs: Record<TabId, string> = sk
    ? { install: "Inštalácia", daw: "ALTER v DAW", automation: "Automatizácia", input: "Audio Input", requirements: "Požiadavky", faq: "FAQ" }
    : { install: "Install", daw: "Use in your DAW", automation: "Automation", input: "Audio Input", requirements: "Requirements", faq: "FAQ" };

  const install: { intro: string; steps: Step[] } = sk
    ? {
        intro: "Od nuly po spustený ALTER za cca 5 minút. Stačí ísť krok po kroku.",
        steps: [
          {
            title: "Vytvor si účet",
            text: (
              <>
                Klikni na <L to="/login">Prihlásiť sa</L> → <K>Nemáš účet? Zaregistruj sa</K>. Potom otvor email a
                potvrď registráciu.
              </>
            ),
          },
          {
            title: "Vyber si edíciu",
            text: (
              <>
                V menu otvor <K>Alter</K> → <L to="/pricing">Cenník</L> a vyber edíciu. Demo je zadarmo a počas Early
                Access si pri každej edícii môžeš zadať vlastnú cenu, aj 0 €. Dokonči objednávku.
              </>
            ),
          },
          {
            title: "Stiahni inštalačku",
            text: (
              <>
                Choď do <L to="/dashboard#licenses">Môj účet</L> → <K>Tvoje licencie</K> → klikni na <K>Windows</K>.
                Súbor (napr. <K>Alter-0.0.3-Creator-Windows.exe</K>) sa uloží do priečinka <K>Stiahnuté súbory</K>.
              </>
            ),
            tip: (
              <>
                Prehliadač napíše, že súbor „sa bežne nesťahuje“? Klikni na <K>⋯</K> → <K>Ponechať</K> (v Edge ešte{" "}
                <K>Zobraziť viac</K> → <K>Napriek tomu ponechať</K>).
              </>
            ),
          },
          {
            title: "Spusti stiahnutý súbor",
            text: "Dvakrát klikni na súbor v Stiahnutých súboroch.",
          },
          {
            title: "Modré okno „Windows protected your PC“ — je to v poriadku",
            text: (
              <>
                Najprv klikni na <K>More info</K> <b>①</b>, potom na <K>Run anyway</K> <b>②</b>. V slovenských Windows
                sú tie isté tlačidlá na rovnakom mieste, len po slovensky.
              </>
            ),
            img: [
              { src: ssMoreInfo, alt: "Krok 1: klikni na More info" },
              { src: ssRunAnyway, alt: "Krok 2: klikni na Run anyway" },
            ],
            warn: (
              <>
                Prečo sa to deje? ALTER zatiaľ nemá platený podpisový certifikát, takže Windows nepozná vydavateľa
                („Unknown publisher“). Inštalačka je bezpečná — sťahuje sa priamo z našej oficiálnej stránky. Sťahuj ju
                vždy len odtiaľto.
              </>
            ),
          },
          {
            title: "Prejdi inštaláciou",
            text: (
              <>
                Ak sa Windows spýta „Chcete tejto aplikácii povoliť vykonávať zmeny?“, klikni <K>Áno</K>. Potom len{" "}
                <K>Next</K> → <K>Install</K> → <K>Finish</K>. Nič nemeň. Nainštaluje sa appka ALTER aj plugin pre tvoj
                DAW.
              </>
            ),
          },
          {
            title: "Otvor ALTER a prihlás sa",
            text: (
              <>
                Spusti ALTER z ponuky Štart. Prihlás sa <b>tým istým emailom a heslom</b> ako na tejto stránke. Hotovo
                🎉 Teraz pokračuj na <K>ALTER v DAW</K>.
              </>
            ),
          },
        ],
      }
    : {
        intro: "From zero to ALTER running in about 5 minutes. Just go step by step.",
        steps: [
          {
            title: "Create an account",
            text: (
              <>
                Click <L to="/login">Sign in</L> → <K>No account? Sign up</K>. Then open your e-mail and confirm the
                sign-up.
              </>
            ),
          },
          {
            title: "Pick your edition",
            text: (
              <>
                In the menu open <K>Alter</K> → <L to="/pricing">Pricing</L> and pick an edition. The Demo is free, and
                during Early Access you can type your own price for every edition — even 0 €. Finish the checkout.
              </>
            ),
          },
          {
            title: "Download the installer",
            text: (
              <>
                Go to <L to="/dashboard#licenses">My account</L> → <K>Your licenses</K> → click <K>Windows</K>. The file
                (e.g. <K>Alter-0.0.3-Creator-Windows.exe</K>) lands in your <K>Downloads</K> folder.
              </>
            ),
            tip: (
              <>
                Browser says the file “isn't commonly downloaded”? Click <K>⋯</K> → <K>Keep</K> (in Edge also{" "}
                <K>Show more</K> → <K>Keep anyway</K>).
              </>
            ),
          },
          {
            title: "Open the file",
            text: "Double-click the file in your Downloads folder.",
          },
          {
            title: "Blue “Windows protected your PC” window — this is normal",
            text: (
              <>
                First click <K>More info</K> <b>①</b>, then click <K>Run anyway</K> <b>②</b>.
              </>
            ),
            img: [
              { src: ssMoreInfo, alt: "Step 1: click More info" },
              { src: ssRunAnyway, alt: "Step 2: click Run anyway" },
            ],
            warn: (
              <>
                Why does this happen? ALTER doesn't have a paid code-signing certificate yet, so Windows doesn't
                recognise the publisher (“Unknown publisher”). The installer is safe — it comes straight from our
                official site. Always download it only from here.
              </>
            ),
          },
          {
            title: "Click through the installer",
            text: (
              <>
                If Windows asks “Do you want to allow this app to make changes to your device?”, click <K>Yes</K>. Then
                just <K>Next</K> → <K>Install</K> → <K>Finish</K>. Don't change anything. This installs the ALTER app
                and the plugin for your DAW.
              </>
            ),
          },
          {
            title: "Open ALTER and sign in",
            text: (
              <>
                Start ALTER from the Start menu. Sign in with <b>the same e-mail and password</b> as on this website.
                Done 🎉 Now continue with <K>Use in your DAW</K>.
              </>
            ),
          },
        ],
      };

  const daw = sk
    ? {
        concept:
          "ALTER má 2 časti: appku ALTER (okno s metrami a vizuálmi) a malý plugin, ktorý dáš do DAW. Plugin posiela zvuk z DAW do appky. Nič viac.",
        pluginNames: "Plugin sa v DAW volá ALTER Listener, ALTER Creator alebo ALTER Pro — podľa tvojej edície (Demo a Listener = ALTER Listener).",
        steps: [
          { title: "Otvor appku ALTER", text: "Môže bežať pred DAW aj po ňom — na poradí nezáleží." },
          {
            title: "V DAW nájdi plugin",
            text: "Otvor DAW a v zozname pluginov (VST3) nájdi ALTER. Ak tam nie je, nechaj DAW pluginy preskenovať — návod pre tvoj DAW je nižšie.",
          },
          {
            title: "Daj plugin na stopu",
            text: (
              <>
                Pretiahni plugin na stopu, ktorú chceš vidieť. Najčastejšie na <K>Master</K> — vtedy vidíš celú
                skladbu. Na jednu stopu (napr. kick) ho daj, ak chceš vidieť len ju.
              </>
            ),
            tip: "Na Masteri ho daj úplne na koniec (za limiter) — vtedy meria presne to, čo vyexportuješ.",
          },
          {
            title: "V ALTER nastav Audio Input na VST Plugin",
            text: (
              <>
                Dole v ovládacom okne ALTER je <K>Audio Input</K>. Vyber <K>VST Plugin</K>.
              </>
            ),
          },
          { title: "Stlač Play v DAW", text: "Metre a vizuály sa rozhýbu. Hotovo." },
        ] as Step[],
        more: [
          {
            h: "Viac pluginov naraz",
            p: (
              <>
                Plugin môžeš dať na viac stôp. Vedľa Audio Input je <K>Instance</K> — tam vyberieš, ktorý počúvať
                (Auto = prvý aktívny). Každý modul má aj vlastný <K>Source</K>, takže napr. Spectrum môže sledovať
                kick a metre Master.
              </>
            ),
          },
          {
            h: "Automatizácia (Creator a Pro)",
            p: (
              <>
                Vizuály môžeš ovládať z timeline v DAW (napr. Geometry rastie do dropu). Celý postup krok po kroku je
                v karte <L to="/help#automation">Automatizácia</L>.
              </>
            ),
          },
        ],
        rescanTitle: "Plugin sa v DAW neukazuje? Preskenuj pluginy",
        rescan: [
          ["Ableton Live", "Options → Preferences (Settings) → Plug-ins → zapni „Use VST3 Plug-in System Folders“ → Rescan. Potom Browser → Plug-ins."],
          ["FL Studio", "Options → Manage plugins → Find installed plugins. Potom ho daj do slotu v Mixeri."],
          ["Reaper", "Options → Preferences → Plug-ins → VST → Re-scan."],
          ["Cubase", "Studio → VST Plug-in Manager → Rescan (obnoviť)."],
          ["Iný DAW", "V nastaveniach hľadaj „Rescan plugins“ alebo „VST3“. Potom DAW reštartuj."],
        ] as [string, string][],
      }
    : {
        concept:
          "ALTER has 2 parts: the ALTER app (the window with meters and visuals) and a small plugin you put in your DAW. The plugin sends sound from your DAW to the app. That's it.",
        pluginNames: "In your DAW the plugin is called ALTER Listener, ALTER Creator or ALTER Pro — depending on your edition (Demo and Listener = ALTER Listener).",
        steps: [
          { title: "Open the ALTER app", text: "It can start before or after your DAW — order doesn't matter." },
          {
            title: "Find the plugin in your DAW",
            text: "Open your DAW and look for ALTER in the plugin list (VST3). Not there? Let your DAW rescan plugins — see how for your DAW below.",
          },
          {
            title: "Put the plugin on a track",
            text: (
              <>
                Drag the plugin onto the track you want to see. Most people use the <K>Master</K> — then you see the
                whole song. Put it on one track (e.g. the kick) to see only that.
              </>
            ),
            tip: "On the Master, put it last in the chain (after the limiter) — then it measures exactly what you export.",
          },
          {
            title: "In ALTER, set Audio Input to VST Plugin",
            text: (
              <>
                At the bottom of the ALTER controller window there's <K>Audio Input</K>. Choose <K>VST Plugin</K>.
              </>
            ),
          },
          { title: "Press Play in your DAW", text: "Meters and visuals start moving. Done." },
        ] as Step[],
        more: [
          {
            h: "Several plugins at once",
            p: (
              <>
                You can put the plugin on several tracks. Next to Audio Input is <K>Instance</K> — choose which one to
                listen to (Auto = the first active one). Every module also has its own <K>Source</K>, so e.g. the
                Spectrum can follow the kick while the meters follow the Master.
              </>
            ),
          },
          {
            h: "Automation (Creator and Pro)",
            p: (
              <>
                You can drive the visuals from your DAW's timeline (e.g. Geometry growing into a drop). The full
                step-by-step is in the <L to="/help#automation">Automation</L> tab.
              </>
            ),
          },
        ],
        rescanTitle: "Plugin not showing up? Rescan your plugins",
        rescan: [
          ["Ableton Live", "Options → Preferences (Settings) → Plug-ins → turn on “Use VST3 Plug-in System Folders” → Rescan. Then Browser → Plug-ins."],
          ["FL Studio", "Options → Manage plugins → Find installed plugins. Then load it into a Mixer slot."],
          ["Reaper", "Options → Preferences → Plug-ins → VST → Re-scan."],
          ["Cubase", "Studio → VST Plug-in Manager → Rescan."],
          ["Other DAW", "Look for “Rescan plugins” or “VST3” in its settings. Then restart the DAW."],
        ] as [string, string][],
      };

  const automation = sk
    ? {
        concept:
          "Automatizácia = vizuály v ALTER sa menia samy podľa toho, čo nakreslíš na timeline v DAW. Napr. Geometry je pokojná v slohe a v drope exploduje.",
        who: "Len ALTER Creator a ALTER Pro. Listener a Demo zvuk len posielajú, ovládať nevedia.",
        steps: [
          {
            title: "V ALTER pridaj vizuálny modul",
            text: (
              <>
                Automatizovať sa dajú vizuálne moduly: <K>Synesthesia</K>, <K>Chladni</K>, <K>Geometry</K>,{" "}
                <K>Fusion</K>, <K>Monolith</K> a <K>Particles</K> (len Pro). Metre a analyzátory (Spectrum, Audio Meter…)
                len počúvajú — nie je v nich čo automatizovať.
              </>
            ),
          },
          {
            title: "Daj ALTER Creator (alebo ALTER Pro) na stopu a otvor ho",
            text: "Môže byť na hocijakej stope — na Masteri alebo na prázdnej stope, ktorú si nazveš napr. „ALTER vizuály“. Dvojklikom otvor okno pluginu.",
          },
          {
            title: "Vľavo vyber modul",
            text: (
              <>
                V ľavom zozname <K>Target module</K> sú moduly, ktoré máš otvorené v ALTER. Klikni na ten, ktorý chceš
                ovládať — pod menom sa objaví <K>controlled here</K>.
              </>
            ),
            tip: (
              <>
                Jeden plugin = jeden modul. Je modul sivý s nápisom <K>in use on …</K>? Ovláda ho už plugin na inej
                stope. Na ďalší modul pridaj ďalší plugin na inú stopu.
              </>
            ),
          },
          {
            title: "Vyskúšaj posuvníky vpravo",
            text: (
              <>
                Pohni hocijakým posuvníkom v časti <K>PARAMETERS</K> — vizuál v ALTER sa hneď zmení. Každý posuvník je
                jedna automatizačná linka v DAW.
              </>
            ),
            tip: "Dvojklik na posuvník = predvolená hodnota. Klik na číslo = napíšeš presnú hodnotu.",
          },
          {
            title: "Zobraz automatizáciu v DAW",
            text: "Tento krok sa líši podľa DAW — návod pre ten tvoj je hneď pod krokmi.",
          },
          {
            title: "Nakresli krivku a stlač Play",
            text: "Ceruzkou nakresli, ako sa má hodnota meniť v čase (napr. Complexity z 0 hore do dropu). Pusti skladbu a sleduj ALTER.",
          },
        ] as Step[],
        dawTitle: "Krok 5 vo tvojom DAW",
        daw: [
          [
            "Ableton Live",
            "V hlavičke pluginu klikni Configure. Potom v okne ALTER pluginu dvojklikni na modul vľavo — všetky jeho ovládače sa pridajú do zariadenia. Znova klikni Configure. V Arrangement stlač A (zobrazí automatizáciu), v linke vyber ALTER a parameter, kresli ceruzkou (B).",
          ],
          [
            "FL Studio",
            "Pohni posuvníkom v ALTER plugine. Potom hore v menu Tools → Last tweaked → Create automation clip. Klip sa objaví v Playliste — v ňom kreslíš krivku.",
          ],
          [
            "Reaper",
            "Pohni posuvníkom v ALTER plugine. V okne pluginu klikni Param → Show track envelope a zaškrtni parameter. Linka sa objaví pod stopou.",
          ],
          [
            "Cubase",
            "Klikni na malú šípku vľavo dole na stope (Show/Hide Automation). V linke otvor menu parametra → More… → ALTER a vyber parameter.",
          ],
          ["Iný DAW", "Všetky ovládače ALTER sú v zozname automatizácie tvojho DAW. Hľadaj na stope „Show automation“."],
        ] as [string, string][],
        tipsTitle: "Dobré vedieť",
        tips: [
          "Automatizácia má prednosť. Ak počas prehrávania pohneš gombíkom priamo v ALTER, pri ďalšom prechode tým miestom ho automatizácia prepíše. Na skúšanie rukou zastav prehrávanie alebo linku vypni.",
          "Tlačidlá ako „Sprinkle sand“ alebo „Resonance >“ sa spustia krátkym skokom linky hore (na 1).",
          "Funguje to v každom DAW s VST3 — Ableton, FL Studio, Reaper, Cubase, Studio One, Bitwig…",
        ],
      }
    : {
        concept:
          "Automation = the visuals in ALTER change by themselves, following what you draw on your DAW's timeline. E.g. Geometry stays calm in the verse and explodes in the drop.",
        who: "ALTER Creator and ALTER Pro only. Listener and Demo just send sound, they can't control anything.",
        steps: [
          {
            title: "Add a visual module in ALTER",
            text: (
              <>
                You can automate the visual modules: <K>Synesthesia</K>, <K>Chladni</K>, <K>Geometry</K>, <K>Fusion</K>,{" "}
                <K>Monolith</K> and <K>Particles</K> (Pro only). Meters and analyzers (Spectrum, Audio Meter…) only
                listen — there's nothing in them to automate.
              </>
            ),
          },
          {
            title: "Put ALTER Creator (or ALTER Pro) on a track and open it",
            text: "Any track works — the Master, or an empty track you name e.g. “ALTER visuals”. Double-click to open the plugin window.",
          },
          {
            title: "Pick the module on the left",
            text: (
              <>
                The left list, <K>Target module</K>, shows the modules you have open in ALTER. Click the one you want
                to control — <K>controlled here</K> appears under its name.
              </>
            ),
            tip: (
              <>
                One plugin = one module. Module is grey with <K>in use on …</K>? A plugin on another track already
                controls it. For another module, add another plugin on another track.
              </>
            ),
          },
          {
            title: "Try the sliders on the right",
            text: (
              <>
                Move any slider under <K>PARAMETERS</K> — the visual in ALTER changes right away. Every slider is one
                automation lane in your DAW.
              </>
            ),
            tip: "Double-click a slider = default value. Click the number = type an exact value.",
          },
          {
            title: "Show the automation in your DAW",
            text: "This step depends on your DAW — how-to for yours is right below the steps.",
          },
          {
            title: "Draw a curve and press Play",
            text: "With the pencil, draw how the value should change over time (e.g. Complexity from 0 up into the drop). Play the song and watch ALTER.",
          },
        ] as Step[],
        dawTitle: "Step 5 in your DAW",
        daw: [
          [
            "Ableton Live",
            "Click Configure in the plugin's title bar. Then, in the ALTER plugin window, double-click your module on the left — all its controls are added to the device. Click Configure again. In Arrangement press A (shows automation), pick ALTER and the parameter in the lane, draw with the pencil (B).",
          ],
          [
            "FL Studio",
            "Move a slider in the ALTER plugin. Then in the top menu Tools → Last tweaked → Create automation clip. The clip appears in the Playlist — draw your curve in it.",
          ],
          [
            "Reaper",
            "Move a slider in the ALTER plugin. In the plugin window click Param → Show track envelope and tick the parameter. The lane appears under the track.",
          ],
          [
            "Cubase",
            "Click the small arrow at the bottom-left of the track (Show/Hide Automation). In the lane open the parameter menu → More… → ALTER and pick the parameter.",
          ],
          ["Other DAW", "Every ALTER control is in your DAW's automation list. Look for “Show automation” on the track."],
        ] as [string, string][],
        tipsTitle: "Good to know",
        tips: [
          "Automation wins. If you move a knob directly in ALTER during playback, the automation writes its value back the next time it passes that point. To try things by hand, stop playback or switch the lane off.",
          "Buttons like “Sprinkle sand” or “Resonance >” fire on a short jump of the lane to the top (1).",
          "Works in any DAW with VST3 — Ableton, FL Studio, Reaper, Cubase, Studio One, Bitwig…",
        ],
      };

  const input = sk
    ? {
        intro: "Audio Input = odkiaľ ALTER počúva. Nastavíš ho dole v ovládacom okne ALTER. Vyber podľa toho, čo chceš vidieť:",
        cards: [
          {
            icon: Plug,
            name: "VST Plugin",
            what: "Zvuk z tvojho DAW (Ableton, FL Studio…), cez plugin ALTER.",
            when: "Keď robíš hudbu, mixuješ alebo masteruješ.",
            note: "Len Listener, Creator a Pro. Demo túto možnosť nemá.",
          },
          {
            icon: Monitor,
            name: "System Audio",
            what: "Všetko, čo hrá tvoj počítač — Spotify, YouTube, hra, prehrávač.",
            when: "Keď len počúvaš hudbu alebo chceš vizuály k čomukoľvek.",
            note: "Ak tvoj DAW používa ASIO ovládač (zvuková karta), System Audio ho nepočuje — použi VST Plugin.",
          },
          {
            icon: Mic,
            name: "Input Device",
            what: "Mikrofón alebo vstup na zvukovej karte (gitara, synth, nahrávanie naživo).",
            when: "Keď chceš vidieť zvuk z reálneho sveta.",
            note: "Vedľa vyber zariadenie. Gombík Gain (0 až +40 dB) zosilní tiché zdroje — metre aj tak ukazujú skutočnú úroveň.",
          },
        ] as InputCard[],
        quickTitle: "Rýchly výber",
        quick: [
          ["Robím beat v DAW", "VST Plugin"],
          ["Počúvam Spotify / YouTube", "System Audio"],
          ["Mám Demo", "System Audio"],
          ["Hrám na gitaru do mikrofónu", "Input Device"],
        ] as [string, string][],
        perModule: (
          <>
            Bonus: každý modul má vlastný <K>Source</K>. Na <K>Auto</K> nasleduje hlavný Audio Input. Môžeš ho ale
            prepnúť — napr. Spectrum z mikrofónu a metre z DAW naraz.
          </>
        ),
      }
    : {
        intro: "Audio Input = where ALTER listens. You set it at the bottom of the ALTER controller window. Pick it based on what you want to see:",
        cards: [
          {
            icon: Plug,
            name: "VST Plugin",
            what: "Sound from your DAW (Ableton, FL Studio…), through the ALTER plugin.",
            when: "When you make music, mix or master.",
            note: "Listener, Creator and Pro only. The Demo doesn't have this option.",
          },
          {
            icon: Monitor,
            name: "System Audio",
            what: "Everything your computer plays — Spotify, YouTube, a game, a media player.",
            when: "When you just listen to music or want visuals for anything.",
            note: "If your DAW uses an ASIO driver (audio interface), System Audio can't hear it — use VST Plugin.",
          },
          {
            icon: Mic,
            name: "Input Device",
            what: "A microphone or an input on your audio interface (guitar, synth, live recording).",
            when: "When you want to see sound from the real world.",
            note: "Pick the device next to it. The Gain knob (0 to +40 dB) lifts quiet sources — meters still show the real level.",
          },
        ] as InputCard[],
        quickTitle: "Quick pick",
        quick: [
          ["I'm making a beat in my DAW", "VST Plugin"],
          ["I'm listening to Spotify / YouTube", "System Audio"],
          ["I have the Demo", "System Audio"],
          ["I'm playing guitar into a mic", "Input Device"],
        ] as [string, string][],
        perModule: (
          <>
            Bonus: every module has its own <K>Source</K>. On <K>Auto</K> it follows the main Audio Input. You can
            switch it though — e.g. Spectrum from the mic and meters from the DAW at the same time.
          </>
        ),
      };

  const req = sk
    ? {
        intro: "Nutné: 64-bit Windows 10/11 (alebo macOS 13+) a grafika s OpenGL 3.2. Všetko ostatné len určuje, koľko modulov naraz utiahneš.",
        tiers: [
          {
            name: "Minimum",
            sub: "Všetky metre + 1–2 vizuály plynulo",
            rows: [
              ["Systém", "Windows 10 64-bit · macOS 13 Ventura"],
              ["Procesor", "4 jadrá, ~2,5 GHz (Intel Core i5 6. gen., Ryzen 3 3200G, Apple M1)"],
              ["RAM", "8 GB"],
              ["Grafika", "integrovaná s OpenGL 3.2 (Intel HD 620, Vega 8)"],
              ["Displej", "1920 × 1080, 60 Hz"],
              ["Disk", "200 MB + miesto na exporty"],
            ],
          },
          {
            name: "Odporúčané",
            sub: "Celý HUD + export vo Full HD",
            rows: [
              ["Systém", "Windows 11 · macOS 14.2+"],
              ["Procesor", "6 jadier, ~3,5 GHz (Core i5-10400, Ryzen 5 3600, M1/M2)"],
              ["RAM", "16 GB"],
              ["Grafika", "samostatná, 4 GB (GTX 1650, RX 6500 XT) alebo Apple M1"],
              ["Displej", "1920 × 1080 až 2560 × 1440, 60 Hz+"],
              ["Disk", "SSD"],
            ],
          },
          {
            name: "Ťažké scény",
            sub: "Hustý Particles, Monolith na max, 4K",
            rows: [
              ["Systém", "Windows 11 · macOS 14.2+"],
              ["Procesor", "8+ jadier (Core i7-12700, Ryzen 7 5800X, M2 Pro+)"],
              ["RAM", "32 GB"],
              ["Grafika", "8 GB (RTX 3060, RX 6700 XT) alebo M2 Pro+"],
              ["Displej", "4K / viac monitorov"],
              ["Disk", "SSD, ~1 GB/min pre priehľadný MOV"],
            ],
          },
        ] as Tier[],
        calm: "Slabší počítač? ALTER nespadne — sám zníži počet snímok, keď nestíha.",
        checkTitle: "Ako zistím, čo mám v počítači?",
        check: [
          "Procesor, RAM a 64-bit: Štart → Nastavenia → Systém → Informácie.",
          "Grafika: stlač Ctrl + Shift + Esc → Výkon → GPU (názov je hore vpravo).",
        ],
      }
    : {
        intro: "Must have: 64-bit Windows 10/11 (or macOS 13+) and graphics with OpenGL 3.2. Everything else only decides how many modules you can run at once.",
        tiers: [
          {
            name: "Minimum",
            sub: "All meters + 1–2 visuals, smooth",
            rows: [
              ["System", "Windows 10 64-bit · macOS 13 Ventura"],
              ["CPU", "4 cores, ~2.5 GHz (Intel Core i5 6th gen, Ryzen 3 3200G, Apple M1)"],
              ["RAM", "8 GB"],
              ["Graphics", "integrated with OpenGL 3.2 (Intel HD 620, Vega 8)"],
              ["Display", "1920 × 1080, 60 Hz"],
              ["Disk", "200 MB + space for exports"],
            ],
          },
          {
            name: "Recommended",
            sub: "Full HUD + Full HD export",
            rows: [
              ["System", "Windows 11 · macOS 14.2+"],
              ["CPU", "6 cores, ~3.5 GHz (Core i5-10400, Ryzen 5 3600, M1/M2)"],
              ["RAM", "16 GB"],
              ["Graphics", "dedicated, 4 GB (GTX 1650, RX 6500 XT) or Apple M1"],
              ["Display", "1920 × 1080 to 2560 × 1440, 60 Hz+"],
              ["Disk", "SSD"],
            ],
          },
          {
            name: "Heavy scenes",
            sub: "Dense Particles, Monolith maxed out, 4K",
            rows: [
              ["System", "Windows 11 · macOS 14.2+"],
              ["CPU", "8+ cores (Core i7-12700, Ryzen 7 5800X, M2 Pro+)"],
              ["RAM", "32 GB"],
              ["Graphics", "8 GB (RTX 3060, RX 6700 XT) or M2 Pro+"],
              ["Display", "4K / multiple monitors"],
              ["Disk", "SSD, ~1 GB/min for transparent MOV"],
            ],
          },
        ] as Tier[],
        calm: "Weaker computer? ALTER won't crash — it lowers its own frame rate when it can't keep up.",
        checkTitle: "How do I check what my computer has?",
        check: [
          "CPU, RAM and 64-bit: Start → Settings → System → About.",
          "Graphics: press Ctrl + Shift + Esc → Performance → GPU (the name is top right).",
        ],
      };

  const faq: Faq[] = sk
    ? [
        {
          q: "Je ALTER bezpečný? Prečo ma Windows varuje?",
          a: "Áno. Windows varuje pri každej novej appke bez plateného podpisového certifikátu — ALTER ho zatiaľ nemá. Klikni More info → Run anyway. Sťahuj ALTER len z tejto stránky.",
        },
        {
          q: "V modrom okne nevidím tlačidlo „Run anyway“",
          a: "Najprv klikni na malý odkaz „More info“ pod textom. Až potom sa tlačidlo objaví. Ak ho nevidíš ani potom, počítač spravuje firma alebo škola a inštaláciu musí povoliť správca.",
        },
        {
          q: "Antivírus inštalačku zablokoval alebo zmazal",
          a: "Pri nových nepodpísaných appkach sa to stáva (falošný poplach). Obnov súbor v antivíruse (karanténa → Obnoviť / Povoliť) alebo ho stiahni znova z Môj účet → Tvoje licencie.",
        },
        {
          q: "Prehliadač nechce súbor stiahnuť",
          a: "Klikni na ⋯ pri sťahovaní → Ponechať. V Edge: Zobraziť viac → Napriek tomu ponechať.",
        },
        {
          q: "Nenájdem plugin v DAW",
          a: "Nechaj DAW preskenovať pluginy (návod je v karte „ALTER v DAW“) a DAW reštartuj. Over, že DAW je 64-bit a podporuje VST3. Plugin sa volá ALTER Listener / Creator / Pro podľa edície.",
        },
        {
          q: "ALTER je otvorený, ale nič sa nehýbe",
          a: "Skontroluj: 1) Audio Input je správne (z DAW = VST Plugin), 2) plugin je na stope, 3) v DAW hrá zvuk a stopa nie je stlmená, 4) pri viacerých pluginoch je v Instance vybraný ten správny.",
        },
        {
          q: "System Audio nič neukazuje, aj keď DAW hrá",
          a: "Tvoj DAW pravdepodobne používa ASIO ovládač — ten ide mimo Windows, takže ho System Audio nepočuje. Daj plugin na Master a prepni Audio Input na VST Plugin.",
        },
        {
          q: "Mám Demo a nemôžem vybrať VST Plugin",
          a: "To je v poriadku — Demo funguje len so System Audio. Vstup cez plugin je v Listener, Creator a Pro.",
        },
        {
          q: "ALTER sa seká alebo je pomalý",
          a: "Zavri moduly, ktoré nepotrebuješ, a dole zníž FFT (napr. FFT 1024). Aktualizuj ovládač grafiky. Na notebooku ho pripoj do zásuvky.",
        },
        {
          q: "ALTER sa nespustí alebo je okno čierne",
          a: "Aktualizuj ovládač grafiky (NVIDIA / AMD / Intel). Ak má notebook dve grafiky: Nastavenia → Systém → Obrazovka → Grafika → ALTER → Vysoký výkon.",
        },
        {
          q: "Na koľkých počítačoch môžem ALTER používať?",
          a: "Na 3 naraz. Počítač uvoľníš v Môj účet → Tvoje licencie.",
        },
        {
          q: "Potrebujem internet?",
          a: "Na prvé prihlásenie áno. Potom ALTER funguje aj offline — stačí sa pripojiť aspoň raz za mesiac.",
        },
        {
          q: "Ako aktualizujem ALTER?",
          a: "ALTER ti sám povie, keď je nová verzia — klikni Update. Modré okno Windows sa môže pri novej verzii ukázať znova; postup je rovnaký.",
        },
        {
          q: "Ako ALTER odinštalujem?",
          a: "Štart → Nastavenia → Aplikácie → Nainštalované aplikácie → ALTER → ⋯ → Odinštalovať.",
        },
        {
          q: "Mám Mac",
          a: "Inštalačka pre macOS je tiež v Môj účet → Tvoje licencie. Pri System Audio a mikrofóne ti macOS vypýta povolenie (Nastavenia systému → Súkromie a bezpečnosť) — povoľ ho pre ALTER.",
        },
        {
          q: "Modul je v plugine sivý a píše „in use on …“",
          a: "Ten modul už ovláda ALTER plugin na inej stope. Jeden modul môže ovládať len jeden plugin. Vyber iný modul alebo ho na tamtej stope uvoľni.",
        },
        {
          q: "Nakreslil som automatizáciu, ale vizuál sa nehýbe",
          a: "Skontroluj: 1) máš Creator alebo Pro, 2) v plugine vľavo je vybraný modul (controlled here), 3) linka v DAW nie je vypnutá a je v režime Read, 4) ALTER je otvorený.",
        },
        {
          q: "Môžem dostať peniaze späť?",
          a: (
            <>
              Áno, platené edície majú 30-dňovú garanciu. Viac v <L to="/refund-policy">Zásadách vrátenia peňazí</L>.
            </>
          ),
        },
      ]
    : [
        {
          q: "Is ALTER safe? Why does Windows warn me?",
          a: "Yes. Windows warns about every new app without a paid code-signing certificate — ALTER doesn't have one yet. Click More info → Run anyway. Only download ALTER from this website.",
        },
        {
          q: "I don't see the “Run anyway” button",
          a: "First click the small “More info” link under the text. The button shows up only after that. If it still isn't there, the computer is managed by a company or school and an administrator has to allow the install.",
        },
        {
          q: "My antivirus blocked or deleted the installer",
          a: "This happens with new unsigned apps (a false alarm). Restore the file in your antivirus (quarantine → Restore / Allow) or download it again from My account → Your licenses.",
        },
        {
          q: "My browser won't download the file",
          a: "Click ⋯ next to the download → Keep. In Edge: Show more → Keep anyway.",
        },
        {
          q: "I can't find the plugin in my DAW",
          a: "Let your DAW rescan plugins (how-to is in the “Use in your DAW” tab) and restart it. Make sure the DAW is 64-bit and supports VST3. The plugin is called ALTER Listener / Creator / Pro depending on your edition.",
        },
        {
          q: "ALTER is open but nothing moves",
          a: "Check: 1) Audio Input is right (from a DAW = VST Plugin), 2) the plugin is on a track, 3) the DAW is playing and the track isn't muted, 4) with several plugins, the right one is picked in Instance.",
        },
        {
          q: "System Audio shows nothing while my DAW plays",
          a: "Your DAW probably uses an ASIO driver — it bypasses Windows, so System Audio can't hear it. Put the plugin on the Master and switch Audio Input to VST Plugin.",
        },
        {
          q: "I have the Demo and can't pick VST Plugin",
          a: "That's expected — the Demo works with System Audio only. Plugin input comes with Listener, Creator and Pro.",
        },
        {
          q: "ALTER is laggy or slow",
          a: "Close modules you don't need and lower the FFT at the bottom (e.g. FFT 1024). Update your graphics driver. On a laptop, plug in the charger.",
        },
        {
          q: "ALTER won't start or the window is black",
          a: "Update your graphics driver (NVIDIA / AMD / Intel). If your laptop has two graphics chips: Settings → System → Display → Graphics → ALTER → High performance.",
        },
        {
          q: "On how many computers can I use ALTER?",
          a: "On 3 at a time. Free up a computer in My account → Your licenses.",
        },
        {
          q: "Do I need internet?",
          a: "For the first sign-in, yes. After that ALTER works offline too — just go online at least once a month.",
        },
        {
          q: "How do I update ALTER?",
          a: "ALTER tells you when there's a new version — click Update. The blue Windows window may show up again for a new version; same steps.",
        },
        {
          q: "How do I uninstall ALTER?",
          a: "Start → Settings → Apps → Installed apps → ALTER → ⋯ → Uninstall.",
        },
        {
          q: "I'm on a Mac",
          a: "The macOS installer is also in My account → Your licenses. For System Audio and the microphone, macOS asks for permission (System Settings → Privacy & Security) — allow it for ALTER.",
        },
        {
          q: "The module is grey in the plugin and says “in use on …”",
          a: "An ALTER plugin on another track already controls that module. Only one plugin can control a module. Pick another module or free it on that track.",
        },
        {
          q: "I drew automation but the visual doesn't move",
          a: "Check: 1) you have Creator or Pro, 2) a module is picked on the left of the plugin (controlled here), 3) the lane in your DAW isn't switched off and is set to Read, 4) ALTER is open.",
        },
        {
          q: "Can I get a refund?",
          a: (
            <>
              Yes, paid editions have a 30-day money-back guarantee. See the <L to="/refund-policy">Refund Policy</L>.
            </>
          ),
        },
      ];

  const ui = sk
    ? {
        badge: "Pomoc",
        title: "Návod a FAQ",
        lead: "Všetko, čo potrebuješ na rozbehanie ALTER — jednoducho, krok po kroku.",
        step: "Krok",
        tip: "Tip",
        stuckTitle: "Stále to nejde?",
        stuck: "Napíš mi — pomôžem. Pošli, čo sa deje, prípadne aj screenshot.",
        windowsOnly: "Tento návod je pre Windows.",
      }
    : {
        badge: "Help",
        title: "Guide & FAQ",
        lead: "Everything you need to get ALTER running — simple, step by step.",
        step: "Step",
        tip: "Tip",
        stuckTitle: "Still stuck?",
        stuck: "Message me — I'll help. Tell me what's happening, a screenshot helps too.",
        windowsOnly: "This guide is for Windows.",
      };

  return { tabs, install, daw, automation, input, req, faq, ui };
};

// ---------------------------------------------------------------- pieces

const Callout = ({ kind, children }: { kind: "tip" | "warn"; children: ReactNode }) => {
  const Icon = kind === "tip" ? Lightbulb : AlertTriangle;
  return (
    <div
      className={cn(
        "mt-3 flex gap-3 rounded-lg border p-3 text-sm",
        kind === "tip" ? "border-neon/30 bg-neon/5" : "border-amber-400/30 bg-amber-400/5"
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", kind === "tip" ? "text-neon" : "text-amber-400")} aria-hidden />
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
};

const Steps = ({ steps, label }: { steps: Step[]; label: string }) => (
  <ol className="space-y-4">
    {steps.map((s, i) => (
      <li key={s.title} className="rounded-xl border border-border/50 bg-card/40 p-5">
        <div className="flex gap-4">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground"
            aria-label={`${label} ${i + 1}`}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold leading-snug">{s.title}</h3>
            <div className="mt-1 leading-relaxed text-muted-foreground">{s.text}</div>
            {s.img && (
              <div className="mt-4 grid gap-3">
                {s.img.map((im) => (
                  <img
                    key={im.src}
                    src={im.src}
                    alt={im.alt}
                    loading="lazy"
                    className="w-full rounded-lg border border-border/60"
                  />
                ))}
              </div>
            )}
            {s.tip && <Callout kind="tip">{s.tip}</Callout>}
            {s.warn && <Callout kind="warn">{s.warn}</Callout>}
          </div>
        </div>
      </li>
    ))}
  </ol>
);

const FaqItem = ({ f }: { f: Faq }) => (
  <details className="group rounded-xl border border-border/50 bg-card/40 open:border-primary/40">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-medium [&::-webkit-details-marker]:hidden">
      {f.q}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-4 pb-4 leading-relaxed text-muted-foreground">{f.a}</div>
  </details>
);

// ---------------------------------------------------------------- page

const Help = () => {
  const { lang } = useT();
  const c = content(lang === "sk" ? "sk" : "en");
  const location = useLocation();
  const navigate = useNavigate();

  const fromHash = (): TabId => {
    const h = location.hash.replace("#", "") as TabId;
    return TAB_IDS.includes(h) ? h : "install";
  };
  const [tab, setTab] = useState<TabId>(fromHash);
  useEffect(() => setTab(fromHash()), [location.hash]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id: TabId) => {
    setTab(id);
    navigate({ hash: id }, { replace: true });
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <header>
          <span className="inline-flex items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neon">
            {c.ui.badge}
          </span>
          <h1 className="mt-4 text-4xl font-bold text-glow md:text-5xl">{c.ui.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{c.ui.lead}</p>
        </header>

        {/* Karty */}
        <nav
          role="tablist"
          className="sticky top-16 z-20 -mx-4 mt-8 flex gap-2 overflow-x-auto border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:flex-wrap sm:overflow-visible sm:rounded-xl sm:border sm:px-3"
        >
          {TAB_IDS.map((id) => {
            const Icon = TAB_ICONS[id];
            const active = tab === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => pick(id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {c.tabs[id]}
              </button>
            );
          })}
        </nav>

        <section className="mt-8" role="tabpanel">
          {tab === "install" && (
            <>
              <p className="mb-1 text-sm font-medium text-neon">{c.ui.windowsOnly}</p>
              <p className="mb-6 text-muted-foreground">{c.install.intro}</p>
              <Steps steps={c.install.steps} label={c.ui.step} />
            </>
          )}

          {tab === "daw" && (
            <>
              <div className="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-5">
                <p className="text-lg leading-relaxed">{c.daw.concept}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.daw.pluginNames}</p>
              </div>
              <Steps steps={c.daw.steps} label={c.ui.step} />

              <div className="mt-8 space-y-4">
                {c.daw.more.map((m) => (
                  <div key={m.h} className="rounded-xl border border-border/50 bg-card/40 p-5">
                    <h3 className="font-semibold">{m.h}</h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{m.p}</p>
                  </div>
                ))}
              </div>

              <h2 className="mb-3 mt-10 text-xl font-bold">{c.daw.rescanTitle}</h2>
              <div className="space-y-2">
                {c.daw.rescan.map(([daw, how]) => (
                  <div key={daw} className="rounded-lg border border-border/50 bg-card/40 p-4 sm:flex sm:gap-4">
                    <span className="block w-32 shrink-0 font-semibold">{daw}</span>
                    <span className="text-sm text-muted-foreground">{how}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "automation" && (
            <>
              <div className="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-5">
                <p className="text-lg leading-relaxed">{c.automation.concept}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.automation.who}</p>
              </div>
              <Steps steps={c.automation.steps} label={c.ui.step} />

              <h2 className="mb-3 mt-10 text-xl font-bold">{c.automation.dawTitle}</h2>
              <div className="space-y-2">
                {c.automation.daw.map(([daw, how]) => (
                  <div key={daw} className="rounded-lg border border-border/50 bg-card/40 p-4 sm:flex sm:gap-4">
                    <span className="block w-32 shrink-0 font-semibold">{daw}</span>
                    <span className="text-sm leading-relaxed text-muted-foreground">{how}</span>
                  </div>
                ))}
              </div>

              <h2 className="mb-3 mt-10 text-xl font-bold">{c.automation.tipsTitle}</h2>
              <div className="space-y-2">
                {c.automation.tips.map((x) => (
                  <Callout key={x} kind="tip">
                    {x}
                  </Callout>
                ))}
              </div>
            </>
          )}

          {tab === "input" && (
            <>
              <p className="mb-6 text-lg text-muted-foreground">{c.input.intro}</p>
              <div className="space-y-4">
                {c.input.cards.map((card) => (
                  <div key={card.name} className="rounded-xl border border-border/50 bg-card/40 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                        <card.icon className="h-5 w-5 text-primary" aria-hidden />
                      </span>
                      <h3 className="text-xl font-bold">{card.name}</h3>
                    </div>
                    <p className="mt-3 text-foreground">{card.what}</p>
                    <p className="mt-1 text-muted-foreground">→ {card.when}</p>
                    {card.note && <Callout kind="tip">{card.note}</Callout>}
                  </div>
                ))}
              </div>

              <h2 className="mb-3 mt-10 text-xl font-bold">{c.input.quickTitle}</h2>
              <div className="overflow-hidden rounded-xl border border-border/50">
                {c.input.quick.map(([want, pick], i) => (
                  <div
                    key={want}
                    className={cn("flex items-center justify-between gap-4 p-4", i > 0 && "border-t border-border/40")}
                  >
                    <span className="text-muted-foreground">{want}</span>
                    <span className="shrink-0 rounded-md bg-primary/15 px-2.5 py-1 text-sm font-semibold text-primary">
                      {pick}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{c.input.perModule}</p>
            </>
          )}

          {tab === "requirements" && (
            <>
              <p className="mb-6 text-lg text-muted-foreground">{c.req.intro}</p>
              <div className="grid gap-4 md:grid-cols-3">
                {c.req.tiers.map((t, i) => (
                  <div
                    key={t.name}
                    className={cn(
                      "rounded-xl border bg-card/40 p-5",
                      i === 1 ? "border-primary/60 shadow-[0_0_24px_-10px_hsl(var(--primary)/0.7)]" : "border-border/50"
                    )}
                  >
                    <h3 className="text-lg font-bold">{t.name}</h3>
                    <p className="mb-4 text-xs text-muted-foreground">{t.sub}</p>
                    <dl className="space-y-3 text-sm">
                      {t.rows.map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-xs uppercase tracking-wider text-muted-foreground/80">{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
              <Callout kind="tip">{c.req.calm}</Callout>
              <h2 className="mb-3 mt-10 text-xl font-bold">{c.req.checkTitle}</h2>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {c.req.check.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </>
          )}

          {tab === "faq" && (
            <div className="space-y-2">
              {c.faq.map((f) => (
                <FaqItem key={f.q} f={f} />
              ))}
            </div>
          )}
        </section>

        {/* Stále to nejde */}
        <section className="mt-14 rounded-xl border border-border/50 bg-card/40 p-6">
          <h2 className="text-xl font-bold">{c.ui.stuckTitle}</h2>
          <p className="mt-1 text-muted-foreground">{c.ui.stuck}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {site.socials
              .filter((s) => s.label === "Instagram" && s.url)
              .map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary underline underline-offset-2"
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              ))}
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 text-primary underline underline-offset-2">
              <Mail className="h-4 w-4" /> {site.email}
            </a>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Help;
