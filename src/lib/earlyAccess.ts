// Early Access — testovacia fáza Alteru.
// Rozdávame PLNÚ verziu zadarmo (bez licencie), len pre prihlásených.
// Podpora je úplne dobrovoľná (Buy Me a Coffee) a nie je podmienkou stiahnutia.

// Priama URL na inštalačku. Zatiaľ ukazuje na zástupný súbor v /public/downloads.
// Keď budeš mať reálnu inštalačku, nahraj ju do public/downloads/ a sem daj cestu,
// napr. "/downloads/alter-earlyaccess-setup.exe".
// Windows inštalačka z GitHub Releases (public repo alter-releases).
// Pri každom novom builde sem daj nový tag/verziu (alebo použi .../releases/latest/download/...).
export const installerUrl = "https://github.com/Quantryx-sound-project/alter-releases/releases/download/v0.0.1/Alter-0.0.1-Windows.exe";

// macOS inštalačka (.pkg) — ak zatiaľ nemáš mac build, nechaj prázdne.
export const installerUrlMac = "https://github.com/Quantryx-sound-project/alter-releases/releases/download/v0.0.1/Alter-0.0.1-macOS.pkg";

// "Buy Me a Coffee" odkaz na dobrovoľnú podporu. Zatiaľ prázdne = donate sekcia sa NEzobrazí.
// Skopíruj svoj link z buymeacoffee.com/<tvoje-meno> a vlož ho sem, napr.
//   "https://www.buymeacoffee.com/quantryx".
export const donationUrl = "https://buymeacoffee.com/quantryx";

// Buy Me a Coffee používateľské meno (slug) — pre vnorený widget/overlay,
// kde ľudia zaplatia priamo na stránke bez registrácie a bez presmerovania.
export const bmcUsername = "quantryx";

// Verzia buildu (zobrazí sa pri stiahnutí).
export const earlyAccessVersion = "0.0.1 — Early Access";

// Predaj plateného Alteru (demo/listener/creator/pro cez Lemon Squeezy) ešte NEbeží.
// Keď spustíš ostrý predaj, prepni na true — poznámky "predaj ešte nie je spustený"
// na produktových stránkach sa automaticky skryjú.
export const salesLaunched = false;

export const hasInstaller = (): boolean => installerUrl.trim().length > 0;
export const hasDonation = (): boolean => donationUrl.trim().length > 0;
