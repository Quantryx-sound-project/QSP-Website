import { Waves, Headphones, Sparkles, Crown, LucideIcon } from "lucide-react";

// Štruktúra a ceny sú tu; všetok zobrazený text je v translations.ts.
// Ceny necháme ako reťazec (€ + desatinná čiarka) — sú jazykovo neutrálne.

export type PeriodType = "free" | "subscription" | "oneTime";
export type PlanId = "demo" | "listener" | "creator" | "pro";

export interface Plan {
  id: string; // používa sa v /checkout?plan=ID a ako kľúč prekladov
  price: string;
  periodType: PeriodType;
  edition: PlanId;
  originalPrice?: string;
  highlight?: boolean;
}

export const plans: Plan[] = [
  { id: "demo", price: "0 €", periodType: "free", edition: "demo" },
  {
    id: "listener",
    price: "15 €",
    periodType: "oneTime",
    edition: "listener",
  },
  {
    id: "creator",
    price: "15 €",
    periodType: "oneTime",
    edition: "creator",
  },
  {
    id: "pro",
    price: "25 €",
    periodType: "oneTime",
    edition: "pro",
    originalPrice: "30 €",
    highlight: true,
  },
];

export const planById: Record<string, Plan> = Object.fromEntries(
  plans.map((p) => [p.id, p])
);

export const planNameKey = (id: string) => {
  const plan = planById[id];
  return plan ? `plans.${plan.edition}Name` : `plans.${id}Name`;
};

export const planFeaturesKey = (id: string) => {
  const plan = planById[id];
  return plan ? `plans.${plan.edition}Features` : `plans.${id}Features`;
};

export interface Product {
  slug: string;
  icon: LucideIcon;
  planIds: PlanId[];
  gallery: number; // počet placeholder obrázkov
}

export const products: Product[] = [
  { slug: "demo", icon: Waves, gallery: 3, planIds: ["demo"] },
  {
    slug: "listener",
    icon: Headphones,
    gallery: 3,
    planIds: ["listener"],
  },
  {
    slug: "creator",
    icon: Sparkles,
    gallery: 3,
    planIds: ["creator"],
  },
  {
    slug: "pro",
    icon: Crown,
    gallery: 3,
    planIds: ["pro"],
  },
];

export const productBySlug: Record<string, Product> = Object.fromEntries(
  products.map((p) => [p.slug, p])
);
