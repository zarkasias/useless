import { Achievement, AchievementType } from './supabase';

type AchievementTitleAndDescription = {
  title: string;
  description: string;
  emoji: string;
};

const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Pool of achievement titles and descriptions grouped by type
const achievementPool: Record<AchievementType, AchievementTitleAndDescription[]> = {
  COMMON: [
    {
      title: "Button Masher Extraordinaire",
      description: "Clicked a button 50 times in a single session. Your finger must be tired!",
      emoji: "👆"
    },
    {
      title: "Professional Procrastinator",
      description: "Spent 5 minutes doing absolutely nothing productive. Congratulations!",
      emoji: "⏰"
    },
    {
      title: "Scrolling Champion",
      description: "Scrolled all the way to the bottom of a page. The journey matters more than the destination!",
      emoji: "📜"
    },
    {
      title: "Tab Hoarder",
      description: "Had 10+ browser tabs open at once. Your RAM is crying.",
      emoji: "🏷️"
    },
    {
      title: "Browser History Cleaner",
      description: "Cleared your browser history. What were you hiding?",
      emoji: "🧹"
    },
    {
      title: "Notification Enthusiast",
      description: "Clicked on 10 notifications in a row. FOMO much?",
      emoji: "🔔"
    },
    {
      title: "Profile Pic Perfectionist",
      description: "Changed your profile picture 5 times in an hour. Looking good!",
      emoji: "🖼️"
    },
    {
      title: "Apprentice Lurker",
      description: "Visited the site 10 times without interacting. Just observing!",
      emoji: "👀"
    },
    {
      title: "Cookie Monster",
      description: "Accepted all cookies without reading the policy. Yum!",
      emoji: "🍪"
    },
    {
      title: "Auto-Fill Fanatic",
      description: "Used auto-fill for every form field. Efficiency at its finest!",
      emoji: "⏩"
    },
  ],
  RARE: [
    {
      title: "Digital Hoarder",
      description: "Saved 20 images you'll never look at again. Just in case, right?",
      emoji: "💾"
    },
    {
      title: "Sneaky Ninja",
      description: "Visited the website at 3 AM. Don't you have sleep to catch?",
      emoji: "🥷"
    },
    {
      title: "Pixel Perfect",
      description: "Spotted a misaligned element that nobody else noticed. Your OCD is appreciated!",
      emoji: "👁️"
    },
    {
      title: "Keyboard Warrior",
      description: "Typed a message and then deleted it without sending. Wise choice!",
      emoji: "⌨️"
    },
    {
      title: "Master of Indecision",
      description: "Changed your profile picture 3 times in one day. Identity crisis much?",
      emoji: "🔄"
    },
    {
      title: "Dark Mode Devotee",
      description: "Switched to dark mode and never looked back. Your eyes thank you!",
      emoji: "🌑"
    },
    {
      title: "Emoji Overlord",
      description: "Used 10 different emojis in a single message. Expressive much?",
      emoji: "😎"
    },
    {
      title: "Secret Agent",
      description: "Used incognito mode for the first time. What are you hiding?",
      emoji: "🕵️"
    },
    {
      title: "Wi-Fi Wizard",
      description: "Connected to 5 different Wi-Fi networks in one day. Nomad life!",
      emoji: "📶"
    },
    {
      title: "Battery Saver",
      description: "Used low power mode for an entire day. Every percent counts!",
      emoji: "🔋"
    },
  
  ],
  EPIC: [
    {
      title: "404 Explorer",
      description: "Ventured where no user has gone before - to a broken page. Adventure awaits!",
      emoji: "🧭"
    },
    {
      title: "Night Owl Guru",
      description: "Used the app for 5 consecutive hours after midnight. Sleep is for the weak!",
      emoji: "🦉"
    },
    {
      title: "Refresh Addict",
      description: "Refreshed the page 20 times hoping for different results. That's practically insanity!",
      emoji: "🔄"
    },
    {
      title: "Bookmark Collector",
      description: "Created 50 bookmarks that you'll forget about by tomorrow. Organization at its finest!",
      emoji: "📑"
    },
    {
      title: "Password Amnesia",
      description: "Reset your password 3 times in one week. Maybe write it down this time?",
      emoji: "🔑"
    },
    {
      title: "Multi-Tasking Maestro",
      description: "Used the app while on a video call and cooking dinner. How do you do it?",
      emoji: "🎭"
    },
    {
      title: "Time Traveler",
      description: "Changed your device's timezone just to test something. Dedication!",
      emoji: "⏳"
    },
    {
      title: "Screen Time Champion",
      description: "Spent 10+ hours on the app in one day. That's a full-time job!",
      emoji: "⏰"
    },
    {
      title: "Notification Overload",
      description: "Received 100+ notifications in one day. Your phone is buzzing!",
      emoji: "📳"
    },
    {
      title: "Data Saver Hero",
      description: "Used less than 1MB of data in a day. Impressive restraint!",
      emoji: "📉"
    },
  ],
  LEGENDARY: [
    {
      title: "Data Archaeologist",
      description: "Found and interacted with a feature that even the developers forgot existed. True explorer!",
      emoji: "🏺"
    },
    {
      title: "Quantum Typer",
      description: "Typed at a speed of over 100 WPM. Your keyboard is smoking!",
      emoji: "⚡"
    },
    {
      title: "Unintentional Beta Tester",
      description: "Discovered a bug that nobody knew existed. You broke the matrix!",
      emoji: "🐛"
    },
    {
      title: "Digital Vampire",
      description: "Used the app for 24 hours straight. Do you even have a life?",
      emoji: "🧛"
    },
    {
      title: "Achievement Hoarder",
      description: "Collected 90% of all possible achievements. You're basically playing a game at this point!",
      emoji: "🏆"
    },
    {
      title: "App Whisperer",
      description: "Found a hidden feature that even the developers didn't know about. How?!",
      emoji: "🔮"
    },
    {
      title: "Ultimate Multitasker",
      description: "Used the app while skydiving. Priorities!",
      emoji: "🪂"
    },
    {
      title: "Memory Master",
      description: "Remembered your password after 6 months. A true miracle!",
      emoji: "🧠"
    },
    {
      title: "Bug Hunter Extraordinaire",
      description: "Reported 10 bugs in one day. Quality assurance owes you!",
      emoji: "🐞"
    },
    {
      title: "Eternal User",
      description: "Used the app every single day for a year. No days off!",
      emoji: "♾️"
    },
  ]
};

// Daily achievement pool
const dailyAchievementPool: AchievementTitleAndDescription[] = [
  {
    title: "Early Bird Special",
    description: "Logged in before 9 AM. Morning person or just couldn't sleep?",
    emoji: "🐦"
  },
  {
    title: "Lunch Break Escaper",
    description: "Visited during lunch hours. A perfect way to avoid small talk!",
    emoji: "🍱"
  },
  {
    title: "Weekend Warrior",
    description: "Checked in on a weekend. Don't you have better things to do?",
    emoji: "🏋️"
  },
  {
    title: "Consistency Champion",
    description: "Logged in for another day in a row. Your dedication is... concerning.",
    emoji: "📆"
  },
  {
    title: "Night Shift",
    description: "Active after 10 PM. Either you're productive or you've got insomnia!",
    emoji: "🌙"
  },
  {
    title: "Holiday Observer",
    description: "Logged in during a holiday. Family getting too annoying?",
    emoji: "🎉"
  },
  {
    title: "Weather Ignorer",
    description: "Inside on a beautiful day. The outside world is overrated anyway!",
    emoji: "☀️"
  },
  {
    title: "Rainy Day Friend",
    description: "Logged in during bad weather. At least you're staying dry!",
    emoji: "☔"
  },
  {
    title: "Monday Masochist",
    description: "Active on a Monday. Starting the week with digital achievements!",
    emoji: "📅"
  },
  {
    title: "App Whisperer",
    description: "Found a hidden feature that even the developers didn't know about. How?!",
    emoji: "🔮"
  },
  {
    title: "Ultimate Multitasker",
    description: "Used the app while skydiving. Priorities!",
    emoji: "🪂"
  },
  {
    title: "Memory Master",
    description: "Remembered your password after 6 months. A true miracle!",
    emoji: "🧠"
  },
  {
    title: "Bug Hunter Extraordinaire",
    description: "Reported 10 bugs in one day. Quality assurance owes you!",
    emoji: "🐞"
  },
  {
    title: "Eternal User",
    description: "Used the app every single day for a year. No days off!",
    emoji: "♾️"
  },
  {
    title: "Friday Celebrator",
    description: "Visited on Friday. Celebrating the weekend with pointless achievements!",
    emoji: "🎊"
  }
];

// Get a random achievement from a specific type
export const getRandomAchievement = (type?: AchievementType): Achievement => {
  const achievementType = type || getRandomAchievementType();
  const poolForType = achievementPool[achievementType];
  const randomIndex = Math.floor(Math.random() * poolForType.length);
  const { title, description, emoji } = poolForType[randomIndex];
  
  return {
    id: generateUniqueId(),
    title,
    description,
    type: achievementType,
    emoji,
    created_at: new Date().toISOString(),
  };
};

// Get a daily achievement
export const getDailyAchievement = (): Achievement => {
  const randomIndex = Math.floor(Math.random() * dailyAchievementPool.length);
  const { title, description, emoji } = dailyAchievementPool[randomIndex];
  
  return {
    id: generateUniqueId(),
    title,
    description,
    type: 'RARE', // Daily achievements are always "RARE"
    emoji,
    created_at: new Date().toISOString(),
    is_daily: true,
  };
};

// Get a random achievement type with weighted probability
const getRandomAchievementType = (): AchievementType => {
  const random = Math.random();
  if (random < 0.6) return 'COMMON';      // 60% chance
  if (random < 0.85) return 'RARE';       // 25% chance  
  if (random < 0.97) return 'EPIC';       // 12% chance
  return 'LEGENDARY';                     // 3% chance
};

/**
 * Get all available achievements from the pool
 */
export const getAllPossibleAchievements = (): Achievement[] => {
  const allAchievements: Achievement[] = [];
  
  // Add achievements from each type
  Object.entries(achievementPool).forEach(([type, achievements]) => {
    achievements.forEach(({ title, description, emoji }) => {
      allAchievements.push({
        id: generateUniqueId(),
        title,
        description,
        type: type as AchievementType,
        emoji,
        created_at: new Date().toISOString(),
      });
    });
  });
  
  // Add daily achievements
  dailyAchievementPool.forEach(({ title, description, emoji }) => {
    allAchievements.push({
      id: generateUniqueId(),
      title,
      description,
      type: 'RARE',
      emoji,
      created_at: new Date().toISOString(),
      is_daily: true,
    });
  });
  
  return allAchievements;
}; 