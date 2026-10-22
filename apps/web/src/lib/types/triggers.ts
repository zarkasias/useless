import type { Achievement } from "@/lib/supabase";

export type TriggerDefinition = Pick<
  Achievement,
  | "id"
  | "title"
  | "description"
  | "type"
  | "emoji"
  | "icon_path"
  | "is_secret"
  | "status"
  | "trigger_type"
  | "trigger_config"
>;
