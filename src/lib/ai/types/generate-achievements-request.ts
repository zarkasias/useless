export interface GenerateAchievementsRequest {
  packId: string;

  theme: string;

  instructions?: string;

  counts: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}
