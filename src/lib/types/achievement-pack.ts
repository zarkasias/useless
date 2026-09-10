export type AchievementPackType = "core" | "seasonal" | "event" | "special";

export type AchievementPackStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "archived";

export interface AchievementPack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pack_type: AchievementPackType;
  starts_at: string | null;
  ends_at: string | null;
  status: AchievementPackStatus;
  created_at: string;
  updated_at: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_cents: number | null;
  theme_key: string | null;
  currency: string | null;
}
