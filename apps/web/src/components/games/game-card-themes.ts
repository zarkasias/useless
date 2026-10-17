export interface GameCardTheme {
  // Main card
  border: string;
  gradient: string;
  glow: string;
  hoverShadow: string;

  // Icon background
  iconGradient: string;

  // Status badge
  badgeBackground: string;
  badgeText: string;

  // Typography
  titleText: string;
  descriptionText: string;

  // Footer
  footerBorder: string;
  footerBackground: string;
  footerText: string;
}

export const gameCardThemes = {
  solitaire: {
    border: "border-orange-200",
    gradient: "from-orange-50 via-white to-amber-50",
    glow: "bg-orange-300/20",
    hoverShadow: "hover:shadow-orange-500/10",

    iconGradient: "from-orange-100/50 via-amber-100/50 to-yellow-100/50",

    badgeBackground: "bg-orange-100",
    badgeText: "text-orange-700",

    titleText: "text-gray-700",
    descriptionText: "text-muted-foreground",

    footerBorder: "border-orange-100",
    footerBackground: "bg-white/60",
    footerText: "text-muted-foreground",
  },

  memory: {
    border: "border-violet-200",
    gradient: "from-violet-50 via-white to-purple-50",
    glow: "bg-violet-300/20",
    hoverShadow: "hover:shadow-violet-500/10",

    iconGradient: "from-violet-100/50 via-purple-100/50 to-fuchsia-100/50",

    badgeBackground: "bg-violet-100",
    badgeText: "text-violet-700",

    titleText: "text-gray-700",
    descriptionText: "text-muted-foreground",

    footerBorder: "border-violet-100",
    footerBackground: "bg-white/60",
    footerText: "text-muted-foreground",
  },

  spider: {
    border: "border-emerald-200",
    gradient: "from-emerald-50 via-white to-teal-50",
    glow: "bg-emerald-300/20",
    hoverShadow: "hover:shadow-emerald-500/10",

    iconGradient: "from-emerald-100/50 via-teal-100/50 to-green-100/50",

    badgeBackground: "bg-emerald-100",
    badgeText: "text-emerald-700",

    titleText: "text-gray-700",
    descriptionText: "text-muted-foreground",

    footerBorder: "border-emerald-100",
    footerBackground: "bg-white/60",
    footerText: "text-muted-foreground",
  },

  words: {
    border: "border-sky-200",
    gradient: "from-sky-50 via-white to-indigo-50",
    glow: "bg-sky-300/20",
    hoverShadow: "hover:shadow-sky-500/10",

    iconGradient: "from-sky-100/50 via-blue-100/50 to-indigo-100/50",

    badgeBackground: "bg-sky-100",
    badgeText: "text-sky-700",

    titleText: "text-gray-700",
    descriptionText: "text-muted-foreground",

    footerBorder: "border-sky-100",
    footerBackground: "bg-white/60",
    footerText: "text-muted-foreground",
  },
} satisfies Record<string, GameCardTheme>;
