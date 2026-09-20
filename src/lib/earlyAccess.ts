// Early Access — testovacia fáza Alteru.
// Rozdávame PLNÚ verziu zadarmo (bez licencie), len pre prihlásených.
// Podpora je úplne dobrovoľná (Buy Me a Coffee) a nie je podmienkou stiahnutia.

// Priama URL na inštalačku. Zatiaľ ukazuje na zástupný súbor v /public/downloads.
// Keď budeš mať reálnu inštalačku, nahraj ju do public/downloads/ a sem daj cestu,
// napr. "/downloads/alter-earlyaccess-setup.exe".
export const installerUrl = "/downloads/alter-earlyaccess-placeholder.txt";

// "Buy Me a Coffee" odkaz na dobrovoľnú podporu. Zatiaľ prázdne = donate sekcia sa NEzobrazí.
// Skopíruj svoj link z buymeacoffee.com/<tvoje-meno> a vlož ho sem, napr.
//   "https://www.buymeacoffee.com/quantryx".
export const donationUrl = "https://buymeacoffee.com/quantryx";

// Verzia buildu (zobrazí sa pri stiahnutí).
export const earlyAccessVersion = "Early Access build";

// Predaj plateného Alteru (demo/listener/creator/pro cez Lemon Squeezy) ešte NEbeží.
// Keď spustíš ostrý predaj, prepni na true — poznámky "predaj ešte nie je spustený"
// na produktových stránkach sa automaticky skryjú.
export const salesLaunched = false;

export const hasInstaller = (): boolean => installerUrl.trim().length > 0;
export const hasDonation = (): boolean => donationUrl.trim().length > 0;
