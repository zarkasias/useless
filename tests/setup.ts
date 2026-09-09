import { afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-public-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
process.env.STRIPE_WEBHOOK_SECRET = "test-webhook-secret";

// Tests must explicitly mock network boundaries; never contact real services.
vi.stubGlobal("fetch", () => { throw new Error("Unexpected network request in test"); });
afterEach(() => vi.useRealTimers());
