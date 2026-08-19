import { Achievement, AchievementType } from "./supabase";

type AchievementTitleAndDescription = {
  title: string;
  description: string;
  emoji: string;
};

const generateAchievementId = (
  title: string,
  type: AchievementType,
  isDaily = false,
): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (isDaily) {
    return `daily-${slug}`;
  }

  return `${type.toLowerCase()}-${slug}`;
};

// Pool of achievement titles and descriptions grouped by type
export const achievementPool: Record<
  AchievementType,
  AchievementTitleAndDescription[]
> = {
  COMMON: [
    {
      title: "Button Masher Extraordinaire",
      description:
        "Clicked a button 50 times in a single session. Your finger must be tired!",
      emoji: "👆",
    },
    {
      title: "Professional Procrastinator",
      description:
        "Spent 5 minutes doing absolutely nothing productive. Congratulations!",
      emoji: "⏰",
    },
    {
      title: "Scrolling Champion",
      description:
        "Scrolled all the way to the bottom of a page. The journey matters more than the destination!",
      emoji: "📜",
    },
    {
      title: "Tab Hoarder",
      description: "Had 10+ browser tabs open at once. Your RAM is crying.",
      emoji: "🏷️",
    },
    {
      title: "Browser History Cleaner",
      description: "Cleared your browser history. What were you hiding?",
      emoji: "🧹",
    },
    {
      title: "Notification Enthusiast",
      description: "Clicked on 10 notifications in a row. FOMO much?",
      emoji: "🔔",
    },
    {
      title: "Profile Pic Perfectionist",
      description:
        "Changed your profile picture 5 times in an hour. Looking good!",
      emoji: "🖼️",
    },
    {
      title: "Apprentice Lurker",
      description:
        "Visited the site 10 times without interacting. Just observing!",
      emoji: "👀",
    },
    {
      title: "Cookie Monster",
      description: "Accepted all cookies without reading the policy. Yum!",
      emoji: "🍪",
    },
    {
      title: "Auto-Fill Fanatic",
      description:
        "Used auto-fill for every form field. Efficiency at its finest!",
      emoji: "⏩",
    },
    {
      title: "Ghost Typer",
      description:
        "Typed 100 characters and then deleted them all. Commitment issues?",
      emoji: "👻",
    },
    {
      title: "Mute Master",
      description:
        "Muted a video within 3 seconds of it playing. Ad avoidance expert!",
      emoji: "🔇",
    },
    {
      title: "Loading Screen Philosopher",
      description:
        "Stared at a loading screen for over a minute. Did you find meaning?",
      emoji: "🌀",
    },
    {
      title: "FAQ Ghost",
      description: "Opened the FAQ section but didn't read it. Classic move!",
      emoji: "📘",
    },
    {
      title: "Swipeaholic",
      description: "Swiped left/right 50 times in a row. Dating app reject?",
      emoji: "💫",
    },
    {
      title: "Zoom Wizard",
      description: "Accidentally zoomed in/out 10 times. Pinch perfection!",
      emoji: "🔍",
    },
    {
      title: "Password Pretender",
      description: "Typed 'password' as your password. So meta!",
      emoji: "🕶️",
    },
    {
      title: "Right-Click Explorer",
      description:
        "Right-clicked 20 times just to see what happens. Curiosity killed the cat!",
      emoji: "🖱️",
    },
    {
      title: "Back Button Bouncer",
      description:
        "Hit the back button 15 times trying to find something. Lost in digital space!",
      emoji: "⬅️",
    },
    {
      title: "Form Field Wanderer",
      description:
        "Tabbed through every form field without filling anything. Efficiency expert!",
      emoji: "⌨️",
    },
    {
      title: "Search Bar Philosopher",
      description:
        "Typed in the search bar then cleared it without searching. Deep thoughts!",
      emoji: "🔍",
    },
    {
      title: "Copy Paste Champion",
      description:
        "Copied and pasted the same thing 10 times. Consistency is key!",
      emoji: "📋",
    },
    {
      title: "Hover Master",
      description:
        "Hovered over 30 different elements. Just exploring tooltips!",
      emoji: "👆",
    },
    {
      title: "Double-Click Dilettante",
      description:
        "Double-clicked something that only needs a single click. Old habits die hard!",
      emoji: "👆",
    },
    {
      title: "Select All Specialist",
      description:
        "Accidentally selected all text 5 times. Ctrl+A is tempting!",
      emoji: "📝",
    },
    {
      title: "Scroll Wheel Warrior",
      description:
        "Spun your scroll wheel like a fidget spinner. The sound is so satisfying!",
      emoji: "🎡",
    },
    {
      title: "Refresh Button Friend",
      description:
        "Clicked refresh just to see the loading animation. Mesmerizing!",
      emoji: "🔄",
    },
    {
      title: "Link Preview Peeker",
      description:
        "Hovered over 20 links to see previews. Commitment issues much?",
      emoji: "👁️",
    },
    {
      title: "Escape Key Addict",
      description:
        "Pressed escape 10 times expecting something to close. Muscle memory!",
      emoji: "🚪",
    },
    {
      title: "Window Resizer",
      description: "Resized the browser window 5 times. Goldilocks syndrome!",
      emoji: "📐",
    },
    {
      title: "Drag Drop Disaster",
      description:
        "Tried to drag something that wasn't draggable. Optimism at its finest!",
      emoji: "✋",
    },
  ],
  RARE: [
    {
      title: "Digital Hoarder",
      description:
        "Saved 20 images you'll never look at again. Just in case, right?",
      emoji: "💾",
    },
    {
      title: "Sneaky Ninja",
      description:
        "Visited the website at 3 AM. Don't you have sleep to catch?",
      emoji: "🥷",
    },
    {
      title: "Pixel Perfect",
      description:
        "Spotted a misaligned element that nobody else noticed. Your OCD is appreciated!",
      emoji: "👁️",
    },
    {
      title: "Keyboard Warrior",
      description:
        "Typed a message and then deleted it without sending. Wise choice!",
      emoji: "⌨️",
    },
    {
      title: "Master of Indecision",
      description:
        "Changed your profile picture 3 times in one day. Identity crisis much?",
      emoji: "🔄",
    },
    {
      title: "Dark Mode Devotee",
      description:
        "Switched to dark mode and never looked back. Your eyes thank you!",
      emoji: "🌑",
    },
    {
      title: "Emoji Overlord",
      description:
        "Used 10 different emojis in a single message. Expressive much?",
      emoji: "😎",
    },
    {
      title: "Secret Agent",
      description:
        "Used incognito mode for the first time. What are you hiding?",
      emoji: "🕵️",
    },
    {
      title: "Wi-Fi Wizard",
      description:
        "Connected to 5 different Wi-Fi networks in one day. Nomad life!",
      emoji: "📶",
    },
    {
      title: "Battery Saver",
      description:
        "Used low power mode for an entire day. Every percent counts!",
      emoji: "🔋",
    },
    {
      title: "Airplane Mode Adventurer",
      description: "Used the app offline for 30 minutes. Who needs internet?",
      emoji: "✈️",
    },
    {
      title: "Ctrl+Z Fanatic",
      description: "Undid 20 actions in a row. Second thoughts much?",
      emoji: "⏪",
    },
    {
      title: "Link Collector",
      description: "Shared 10 links in one day. Viral potential!",
      emoji: "🔗",
    },
    {
      title: "Font Fashionista",
      description: "Changed text style 5 times in one document. Stylish!",
      emoji: "🅰️",
    },
    {
      title: "Mouse Mileage",
      description:
        "Moved cursor 1km worth of screen distance. Marathon runner!",
      emoji: "🏁",
    },
    {
      title: "Screenshot Collector",
      description:
        "Took 15 screenshots of things you'll never need again. Just in case!",
      emoji: "📸",
    },
    {
      title: "Download Dabbler",
      description:
        "Downloaded 10 files and immediately forgot what they were. Mystery files!",
      emoji: "📥",
    },
    {
      title: "Fullscreen Fanatic",
      description:
        "Toggled fullscreen mode 5 times in one session. Can't decide?",
      emoji: "🖥️",
    },
    {
      title: "Bookmark Browser",
      description:
        "Opened your bookmarks folder just to look at all the tabs. Nostalgia trip!",
      emoji: "⭐",
    },
    {
      title: "History Hopper",
      description:
        "Went through your browser history from 3 months ago. What were you doing?",
      emoji: "📚",
    },
    {
      title: "Reader Mode Reader",
      description:
        "Used reader mode to make an article look cleaner. Aesthetic goals!",
      emoji: "📖",
    },
    {
      title: "Translate Trickster",
      description:
        "Translated a page into a language you don't speak. Adventure!",
      emoji: "🌍",
    },
    {
      title: "Print Preview Pro",
      description:
        "Opened print preview just to see how it would look. Planning ahead!",
      emoji: "🖨️",
    },
    {
      title: "Desktop Screenshot Saver",
      description: "Saved your desktop as a screenshot. Backing up your icons?",
      emoji: "💾",
    },
    {
      title: "URL Copier",
      description:
        "Copied the URL to send to yourself later. You'll never actually send it!",
      emoji: "🔗",
    },
    {
      title: "Inspect Element Investigator",
      description:
        "Right-clicked 'Inspect' just to see what it does. Developer curiosity!",
      emoji: "🔬",
    },
    {
      title: "Cache Clearer",
      description:
        "Cleared your cache hoping it would fix something. IT support move!",
      emoji: "🧹",
    },
    {
      title: "Zoom In/Out Artist",
      description:
        "Zoomed to 200% then back to 50% repeatedly. Finding that sweet spot!",
      emoji: "🔍",
    },
    {
      title: "Task Manager Checker",
      description:
        "Opened task manager just to see what's running. Performance anxiety!",
      emoji: "📊",
    },
  ],
  EPIC: [
    {
      title: "404 Explorer",
      description:
        "Ventured where no user has gone before - to a broken page. Adventure awaits!",
      emoji: "🧭",
    },
    {
      title: "Night Owl Guru",
      description:
        "Used the app for 5 consecutive hours after midnight. Sleep is for the weak!",
      emoji: "🦉",
    },
    {
      title: "Refresh Addict",
      description:
        "Refreshed the page 20 times hoping for different results. That's practically insanity!",
      emoji: "🔄",
    },
    {
      title: "Bookmark Collector",
      description:
        "Created 50 bookmarks that you'll forget about by tomorrow. Organization at its finest!",
      emoji: "📑",
    },
    {
      title: "Password Amnesia",
      description:
        "Reset your password 3 times in one week. Maybe write it down this time?",
      emoji: "🔑",
    },
    {
      title: "Multi-Tasking Maestro",
      description:
        "Used the app while on a video call and cooking dinner. How do you do it?",
      emoji: "🎭",
    },
    {
      title: "Time Traveler",
      description:
        "Changed your device's timezone just to test something. Dedication!",
      emoji: "⏳",
    },
    {
      title: "Screen Time Champion",
      description:
        "Spent 10+ hours on the app in one day. That's a full-time job!",
      emoji: "⏰",
    },
    {
      title: "Notification Overload",
      description:
        "Received 100+ notifications in one day. Your phone is buzzing!",
      emoji: "📳",
    },
    {
      title: "Data Saver Hero",
      description: "Used less than 1MB of data in a day. Impressive restraint!",
      emoji: "📉",
    },
    {
      title: "Infinite Scroll",
      description: "Scrolled equivalent of 100 pages. Journey to nowhere!",
      emoji: "🎢",
    },
    {
      title: "All-Nighter",
      description: "Used from sunset to sunrise. Vampire mode activated!",
      emoji: "🌃",
    },
    {
      title: "Time Zone Hopper",
      description: "Used in 3 different time zones in 24hrs. Jet setter!",
      emoji: "🌐",
    },
    {
      title: "Data Dragon",
      description: "Used 1GB of mobile data in a day. Buffering champion!",
      emoji: "🐉",
    },
    {
      title: "Clipboard Overlord",
      description: "Copied 100 items to clipboard. Remember to paste!",
      emoji: "📋",
    },
    {
      title: "GIFsaurus Rex",
      description: "Sent 50 GIFs in one conversation. Motion sickness!",
      emoji: "🦖",
    },
    {
      title: "Undo Apocalypse",
      description: "Undid 100 changes in a row. Temporal paradox!",
      emoji: "🌀",
    },
    {
      title: "Tab Apocalypse Survivor",
      description:
        "Had 50+ tabs open simultaneously. Your browser is a warrior!",
      emoji: "🗂️",
    },
    {
      title: "Session Time Traveler",
      description:
        "Left the app open for 48 hours without closing. Digital camping!",
      emoji: "⛺",
    },
    {
      title: "Notification Necromancer",
      description:
        "Enabled notifications for 20 different things. Your phone never sleeps!",
      emoji: "🔔",
    },
    {
      title: "Dark Pattern Detector",
      description:
        "Spotted and avoided 10 different dark patterns. Skepticism level: Expert!",
      emoji: "🕵️",
    },
    {
      title: "Cookie Policy Reader",
      description:
        "Actually read a cookie policy from start to finish. Legal scholar!",
      emoji: "📜",
    },
    {
      title: "Browser Extension Collector",
      description:
        "Installed 15 browser extensions. Your browser is now a Swiss army knife!",
      emoji: "🔧",
    },
    {
      title: "Form Completion Master",
      description:
        "Filled out 5 multi-page forms in one sitting. Endurance champion!",
      emoji: "📝",
    },
    {
      title: "Video Speed Watcher",
      description:
        "Watched videos at 2x speed for 3 hours. Time efficiency wizard!",
      emoji: "⏩",
    },
    {
      title: "Archive Explorer",
      description:
        "Found something in your archives from 2 years ago. Digital archaeology!",
      emoji: "📦",
    },
    {
      title: "Multi-Device Master",
      description:
        "Used the app on 5 different devices in one day. Digital nomad!",
      emoji: "📱",
    },
    {
      title: "Error Message Collector",
      description:
        "Encountered 25 different error messages. Quality assurance expert!",
      emoji: "⚠️",
    },
    {
      title: "Browser War Veteran",
      description:
        "Switched browsers 3 times in one week. Can't find the perfect one!",
      emoji: "🌐",
    },
    {
      title: "Shortcut Memorizer",
      description:
        "Used keyboard shortcuts exclusively for an hour. Power user mode!",
      emoji: "⌨️",
    },
  ],
  LEGENDARY: [
    {
      title: "Data Archaeologist",
      description:
        "Found and interacted with a feature that even the developers forgot existed. True explorer!",
      emoji: "🏺",
    },
    {
      title: "Quantum Typer",
      description:
        "Typed at a speed of over 100 WPM. Your keyboard is smoking!",
      emoji: "⚡",
    },
    {
      title: "Unintentional Beta Tester",
      description:
        "Discovered a bug that nobody knew existed. You broke the matrix!",
      emoji: "🐛",
    },
    {
      title: "Digital Vampire",
      description:
        "Used the app for 24 hours straight. Do you even have a life?",
      emoji: "🧛",
    },
    {
      title: "Achievement Hoarder",
      description:
        "Collected 90% of all possible achievements. You're basically playing a game at this point!",
      emoji: "🏆",
    },
    {
      title: "App Whisperer",
      description:
        "Found a hidden feature that even the developers didn't know about. How?!",
      emoji: "🔮",
    },
    {
      title: "Ultimate Multitasker",
      description: "Used the app while skydiving. Priorities!",
      emoji: "🪂",
    },
    {
      title: "Memory Master",
      description: "Remembered your password after 6 months. A true miracle!",
      emoji: "🧠",
    },
    {
      title: "Bug Hunter Extraordinaire",
      description: "Reported 10 bugs in one day. Quality assurance owes you!",
      emoji: "🐞",
    },
    {
      title: "Eternal User",
      description: "Used the app every single day for a year. No days off!",
      emoji: "♾️",
    },
    {
      title: "404 Guardian",
      description: "Triggered 50 error messages in one session. Chaos agent!",
      emoji: "🚨",
    },
    {
      title: "Password Phoenix",
      description:
        "Recovered account from 10-year-old credentials. Archeology win!",
      emoji: "🦅",
    },
    {
      title: "Offline Survivor",
      description: "Used app for 24hrs without internet. Hermit mode!",
      emoji: "🏕️",
    },
    {
      title: "Hack Attempt Prankster",
      description: "Entered 'admin' as username 50 times. Nice try!",
      emoji: "🎭",
    },
    {
      title: "Pixel Pioneer",
      description: "Found hidden Easter egg. Developer's favorite!",
      emoji: "🥚",
    },
    {
      title: "Battery Immortal",
      description: "Used app for 8hrs on 5% battery. Dark magic!",
      emoji: "🧙",
    },
    {
      title: "Cloud Defier",
      description: "Deleted 1TB of data. Point of no return!",
      emoji: "☁️",
    },
    {
      title: "Code Commenter",
      description:
        "Read through the page source code looking for secrets. Developer mindset!",
      emoji: "💻",
    },
    {
      title: "API Explorer",
      description:
        "Found and used an undocumented API endpoint. Hacker level unlocked!",
      emoji: "🔓",
    },
    {
      title: "Local Storage Legend",
      description:
        "Stored 100MB of data in localStorage. Browser memory champ!",
      emoji: "💾",
    },
    {
      title: "Network Tab Navigator",
      description:
        "Spent an hour analyzing network requests. Performance optimization guru!",
      emoji: "📡",
    },
    {
      title: "Console Command Master",
      description:
        "Used browser console to execute 50 commands. JavaScript wizard!",
      emoji: "⚡",
    },
    {
      title: "Service Worker Whisperer",
      description: "Manually registered a service worker. PWA enthusiast!",
      emoji: "👨‍💻",
    },
    {
      title: "Cookie Manipulator",
      description:
        "Manually edited cookies to test something. Technical explorer!",
      emoji: "🍪",
    },
    {
      title: "WebSocket Warrior",
      description:
        "Kept a WebSocket connection open for 12 hours. Persistent dedication!",
      emoji: "🔌",
    },
    {
      title: "Cross-Origin Crusader",
      description:
        "Solved a CORS issue through creative workarounds. Problem solver!",
      emoji: "🚫",
    },
    {
      title: "Localhost Legend",
      description: "Ran localhost on a port ending in 69. Nice!",
      emoji: "😎",
    },
    {
      title: "Git Commit Master",
      description: "Made 100 commits in a single day. Productivity overload!",
      emoji: "📦",
    },
    {
      title: "Dependency Debugger",
      description:
        "Resolved a dependency conflict that broke everything. Hero move!",
      emoji: "🧩",
    },
  ],
};

// Daily achievement pool
export const dailyAchievementPool: AchievementTitleAndDescription[] = [
  {
    title: "Early Bird Special",
    description:
      "Logged in before 9 AM. Morning person or just couldn't sleep?",
    emoji: "🐦",
  },
  {
    title: "Lunch Break Escaper",
    description:
      "Visited during lunch hours. A perfect way to avoid small talk!",
    emoji: "🍱",
  },
  {
    title: "Weekend Warrior",
    description: "Checked in on a weekend. Don't you have better things to do?",
    emoji: "🏋️",
  },
  {
    title: "Consistency Champion",
    description:
      "Logged in for another day in a row. Your dedication is... concerning.",
    emoji: "📆",
  },
  {
    title: "Night Shift",
    description:
      "Active after 10 PM. Either you're productive or you've got insomnia!",
    emoji: "🌙",
  },
  {
    title: "Holiday Observer",
    description: "Logged in during a holiday. Family getting too annoying?",
    emoji: "🎉",
  },
  {
    title: "Weather Ignorer",
    description:
      "Inside on a beautiful day. The outside world is overrated anyway!",
    emoji: "☀️",
  },
  {
    title: "Rainy Day Friend",
    description: "Logged in during bad weather. At least you're staying dry!",
    emoji: "☔",
  },
  {
    title: "Monday Masochist",
    description:
      "Active on a Monday. Starting the week with digital achievements!",
    emoji: "📅",
  },
  {
    title: "App Whisperer",
    description:
      "Found a hidden feature that even the developers didn't know about. How?!",
    emoji: "🔮",
  },
  {
    title: "Ultimate Multitasker",
    description: "Used the app while skydiving. Priorities!",
    emoji: "🪂",
  },
  {
    title: "Memory Master",
    description: "Remembered your password after 6 months. A true miracle!",
    emoji: "🧠",
  },
  {
    title: "Bug Hunter Extraordinaire",
    description: "Reported 10 bugs in one day. Quality assurance owes you!",
    emoji: "🐞",
  },
  {
    title: "Eternal User",
    description: "Used the app every single day for a year. No days off!",
    emoji: "♾️",
  },
  {
    title: "Friday Celebrator",
    description:
      "Visited on Friday. Celebrating the weekend with pointless achievements!",
    emoji: "🎊",
  },
  {
    title: "Midnight Oil",
    description: "Active between 12-1 AM. Burning that late-night fuel!",
    emoji: "⛽",
  },
  {
    title: "Hump Day Hero",
    description: "Logged in on Wednesday. Over the weekly hill!",
    emoji: "🐫",
  },
  {
    title: "First Footer",
    description: "Visited on January 1st. New Year's resolutionist!",
    emoji: "🎆",
  },
  {
    title: "Leap Day Legend",
    description: "Active on February 29th. Once every 4 years!",
    emoji: "🐸",
  },
  {
    title: "Solstice Surfer",
    description: "Logged in during summer/winter solstice. Sun worshipper!",
    emoji: "🌞",
  },
  {
    title: "Time Zone Bender",
    description: "Used in 3 time zones in one day. Temporal explorer!",
    emoji: "⏰",
  },
  {
    title: "New Year, New Tab",
    description: "Opened a fresh tab on January 1st. Clean slate!",
    emoji: "🗓️",
  },
  {
    title: "Tuesday Tinkerer",
    description: "Active on a Tuesday. Just another day in paradise!",
    emoji: "📅",
  },
  {
    title: "Thursday Thinker",
    description: "Visited on Thursday. Almost there to Friday!",
    emoji: "🤔",
  },
  {
    title: "Saturday Stroller",
    description: "Logged in on Saturday. Weekend warrior mode!",
    emoji: "🚶",
  },
  {
    title: "Sunday Surfer",
    description: "Active on Sunday. Pre-Monday blues preparation!",
    emoji: "🏄",
  },
  {
    title: "Dawn Patrol",
    description: "Logged in before sunrise. Early morning productivity!",
    emoji: "🌅",
  },
  {
    title: "Afternoon Advocate",
    description: "Visited during the afternoon slump. Powering through!",
    emoji: "☕",
  },
  {
    title: "Evening Explorer",
    description: "Active during dinner hours. Multitasking master!",
    emoji: "🍽️",
  },
  {
    title: "Valentine's Visitor",
    description: "Logged in on February 14th. Priorities straight!",
    emoji: "💝",
  },
  {
    title: "Halloween Haunter",
    description: "Active on October 31st. Spooky achievement hunting!",
    emoji: "🎃",
  },
  {
    title: "Christmas Clicker",
    description: "Visited on December 25th. Holiday achievement enthusiast!",
    emoji: "🎄",
  },
  {
    title: "Birthday Browser",
    description:
      "Logged in on your birthday. Self-care looks different for everyone!",
    emoji: "🎂",
  },
  {
    title: "Equinox Explorer",
    description: "Active during spring or fall equinox. Seasonal balance!",
    emoji: "⚖️",
  },
  {
    title: "Dusk Dabbler",
    description: "Visited during twilight hours. Between day and night!",
    emoji: "🌆",
  },
  {
    title: "Pre-Dawn Pioneer",
    description: "Logged in before 6 AM. The early bird gets the achievement!",
    emoji: "🌄",
  },
];

// Get a random achievement from a specific type
export const getRandomAchievement = (type?: AchievementType): Achievement => {
  const achievementType = type || getRandomAchievementType();
  const poolForType = achievementPool[achievementType];
  const randomIndex = Math.floor(Math.random() * poolForType.length);
  const { title, description, emoji } = poolForType[randomIndex];

  return {
    id: generateAchievementId(title, achievementType),
    title,
    description,
    type: achievementType,
    emoji,
    created_at: new Date().toISOString(),
  };
};

// Get a daily achievement
export const getDailyAchievement = (
  unlockedDailyIds: string[] = [],
): Achievement | null => {
  const availableAchievements = dailyAchievementPool.filter(({ title }) => {
    const id = generateAchievementId(title, "RARE", true);
    return !unlockedDailyIds.includes(id);
  });

  if (availableAchievements.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableAchievements.length);

  const { title, description, emoji } = availableAchievements[randomIndex];

  return {
    id: generateAchievementId(title, "RARE", true),
    title,
    description,
    type: "RARE",
    emoji,
    created_at: new Date().toISOString(),
    is_daily: true,
  };
};

// Get a random achievement type with weighted probability
const getRandomAchievementType = (): AchievementType => {
  const random = Math.random();
  if (random < 0.6) return "COMMON"; // 60% chance
  if (random < 0.85) return "RARE"; // 25% chance
  if (random < 0.97) return "EPIC"; // 12% chance
  return "LEGENDARY"; // 3% chance
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
        id: generateAchievementId(title, type as AchievementType),
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
      id: generateAchievementId(title, "RARE", true),
      title,
      description,
      type: "RARE",
      emoji,
      created_at: new Date().toISOString(),
      is_daily: true,
    });
  });

  return allAchievements;
};
