# Supabase – návod na sprevádzkovanie loginu (zadarmo)

Celé to zaberie ~10 minút. Neplatíš nič, kartu nepýtajú.

## 1. Založ projekt

1. Choď na **https://supabase.com** → **Start your project** → prihlás sa
   (najjednoduchšie cez GitHub alebo Google).
2. **New project** → vyber Free plán.
   - Name: `quantryx` (hocičo)
   - Database password: vygeneruj a **ulož si ho** (netreba ho často, ale nestrať ho)
   - Region: **Central EU (Frankfurt)** – najbližšie
3. Počkaj ~2 min, kým sa projekt vytvorí.

> Pozn.: v `supabase/config.toml` je staré project_id `bamtwfxdrtlgtnvaizir`
> (pravdepodobne z Lovable). Ak sa ti pod tvojím účtom takýto projekt zobrazí,
> môžeš použiť ten a krok 1 preskočiť.

## 2. Skopíruj kľúče do `.env`

1. V projekte: **Settings (ozubené koliesko) → API Keys**
2. Do súboru `.env` (v koreňovom priečinku projektu, už je vytvorený) doplň:
   - `VITE_SUPABASE_URL` = **Project URL** (napr. `https://abcdefgh.supabase.co`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = **anon / publishable** kľúč
   - `VITE_SUPABASE_PROJECT_ID` = časť URL pred `.supabase.co` (napr. `abcdefgh`)
3. **NIKDY** nepoužívaj `service_role` kľúč vo frontende.

## 3. Vypni potvrdzovanie emailu (na testovanie)

1. **Authentication → Sign In / Providers → Email**
2. Vypni **Confirm email** → Save

Registrácia bude fungovať okamžite. Pred ostrým spustením to zapni späť.

## 4. Vytvor tabuľky

1. **SQL Editor → New query**
2. Otvor súbor `supabase/setup.sql`, celý obsah skopíruj, vlož, **Run**.
3. Over v **Table Editor**: mali by tam byť tabuľky `profiles` a `licenses`.

## 5. Otestuj

```
npm run dev
```

Otvor stránku → **Login → Sign up** → zaregistruj sa testovacím emailom.
Potom v Supabase:
- **Authentication → Users** – uvidíš email
- **Table Editor → profiles** – uvidíš email + meno

## Čo je zadarmo a kde sú limity

| Vec | Free tier |
|---|---|
| Užívatelia | 50 000 aktívnych mesačne |
| Databáza | 500 MB |
| Potvrdzovacie emaily | ~2–4/hod (preto ich zatiaľ vypíname) |
| Projekt | pauzne sa po ~1 týždni nečinnosti (v dashboarde ho obnovíš klikom) |

## Ďalšie kroky (keď budeš chcieť)

- **Lemon Squeezy**: účet zadarmo, platíš len províziu z predaja.
  Postup je v `LEMONSQUEEZY_INTEGRACIA.md`. V Test móde otestuješ bez peňazí.
- **Webhook → licencie**: Edge Function, ktorá po platbe zapíše riadok do
  tabuľky `licenses` (tá už existuje). Spravíme spolu, keď budeš mať LS účet.
- **Google login**: nastavenie v Google Cloud Console (zadarmo), potom
  zapnúť provider v Supabase.
- **Vlastný email odosielateľ (SMTP)**: až pred ostrým spustením.
