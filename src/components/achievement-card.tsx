import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Achievement, AchievementType } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// Define achievement type colors with more vibrant gradients
const typeColors: Record<AchievementType, string> = {
  COMMON: 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-700',
  RARE: 'border-blue-400 bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900 dark:to-cyan-800',
  EPIC: 'border-purple-400 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900 dark:to-pink-800',
  LEGENDARY: 'border-amber-400 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900 dark:to-orange-800',
};

const typeBorderEffects: Record<AchievementType, string> = {
  COMMON: 'border-2',
  RARE: 'border-2 border-opacity-60 shadow-sm shadow-blue-300 dark:shadow-blue-900',
  EPIC: 'border-2 border-opacity-70 shadow-md shadow-purple-300 dark:shadow-purple-900',
  LEGENDARY: 'border-2 border-opacity-80 shadow-lg shadow-amber-300 dark:shadow-amber-900',
};

const typeBadgeColors: Record<AchievementType, string> = {
  COMMON: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  RARE: 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
  EPIC: 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
  LEGENDARY: 'bg-amber-200 text-amber-800 dark:bg-amber-700 dark:text-amber-200',
};

const typeNames: Record<AchievementType, string> = {
  COMMON: 'Common',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
};

// Simpler hover animations for achievements
const achievementAnimations: Record<AchievementType, string> = {
  COMMON: 'hover:shadow-md transition-all duration-300',
  RARE: 'hover:shadow-md hover:shadow-blue-300 dark:hover:shadow-blue-900 transition-all duration-300',
  EPIC: 'hover:shadow-md hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all duration-300',
  LEGENDARY: 'hover:shadow-lg hover:shadow-amber-300 dark:hover:shadow-amber-900 transition-all duration-300',
};

// Social media configurations
// const socialPlatforms = [
//   {
//     name: 'Facebook',
//     icon: (
//       <img src="/icons/facebook.png" alt="Facebook" width="28" height="28" />
//     )
//   },
//   {
//     name: 'X',
//     icon: (
//       <img src="/icons/x.webp" alt="X" width="28" height="28" />
//     )
//   },
//   {
//     name: 'LinkedIn',
//     icon: (
//       <img src="/icons/linkedin.webp" alt="LinkedIn" width="34" height="34" />
//     )
//   },
//   {
//     name: 'Instagram',
//     icon: (
//       <img src="/icons/instagram_icon.png" alt="Instagram" width="30" height="30" />
//     )
//   }
// ];

interface AchievementCardProps {
  achievement: Achievement;
  unlockedAt?: string;
  ingrid?: boolean;
  showShareButton?: boolean;
}

export function AchievementCard({ 
  achievement, 
  unlockedAt, 
  showShareButton = false,
  ingrid = false
}: AchievementCardProps) {
  const { title, description, type, emoji, is_daily } = achievement;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const generationAttemptedRef = useRef(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  // Basic card styles without excessive animations
  const cardClass = `${typeColors[type]} ${typeBorderEffects[type]} ${achievementAnimations[type]}`;
  const tagClass = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeColors[type]}`;
  
  // Format the unlocked time if available
  const timeAgo = unlockedAt 
    ? formatDistanceToNow(new Date(unlockedAt), { addSuffix: true }) 
    : '';
  
  // Automatically generate image when component mounts
  useEffect(() => {
    // Only generate once and only if sharing is enabled
    if (showShareButton && !imageUrl && !isGeneratingImage && !generationAttemptedRef.current) {
      generationAttemptedRef.current = true;
      generateImage();
    }
  }, [showShareButton, imageUrl, isGeneratingImage]);

  // Detect mobile devices on component mount
  useEffect(() => {
    const detectMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobileDevice(detectMobile());
  }, []);

  // Generate image from the achievement card
  const generateImage = async () => {
    if (!cardRef.current || isGeneratingImage) return;
    
    let toastId: string | number | undefined;
    
    try {
      setIsGeneratingImage(true);
      
      if (!ingrid) {
        toastId = toast.loading("Preparing achievement to share...", {
          description: "This will only take a moment",
        });
      }
      
      // Get device pixel ratio for better quality on high-DPI displays
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = Math.max(2, pixelRatio); // At least 2x for good quality
      
      // Skip html2canvas entirely - Use Canvas API directly
      // Create a simple canvas directly
      const canvas = document.createElement('canvas');
      const width = 350;
      const height = 200;
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Scale for high DPI
      ctx.scale(scale, scale);
      
      // Detect dark mode
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // Set background and text colors based on achievement type and theme mode
      const bgColors = {
        COMMON: {
          light: '#f8f9fa',
          dark: '#1f2937',
          border: isDarkMode ? '#4b5563' : '#d1d5db',
          tag: isDarkMode ? '#4b5563' : '#e5e7eb',
          tagText: isDarkMode ? '#f3f4f6' : '#111827'
        },
        RARE: {
          light: '#e0f7fa',
          dark: '#075985',
          border: isDarkMode ? '#0284c7' : '#7dd3fc',
          tag: isDarkMode ? '#0369a1' : '#bae6fd',
          tagText: isDarkMode ? '#f3f4f6' : '#075985'
        },
        EPIC: {
          light: '#f3e5f5',
          dark: '#581c87',
          border: isDarkMode ? '#7e22ce' : '#d8b4fe',
          tag: isDarkMode ? '#7e22ce' : '#e9d5ff',
          tagText: isDarkMode ? '#f3f4f6' : '#6b21a8'
        },
        LEGENDARY: {
          light: '#fff8e1',
          dark: '#78350f',
          border: isDarkMode ? '#d97706' : '#fcd34d',
          tag: isDarkMode ? '#d97706' : '#fde68a',
          tagText: isDarkMode ? '#f3f4f6' : '#92400e'
        }
      };
      
      // Draw background
      const bgColor = isDarkMode 
        ? bgColors[type]?.dark || '#1f2937'
        : bgColors[type]?.light || '#f8f9fa';
      
      // Draw rounded rectangle for background
      ctx.fillStyle = bgColor;
      roundRect(ctx, 0, 0, width, height, 8);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = bgColors[type]?.border || '#d1d5db';
      ctx.lineWidth = 2;
      roundRect(ctx, 1, 1, width-2, height-2, 7);
      ctx.stroke();
      
      // Draw tag background
      const tagText = is_daily ? 'Daily' : typeNames[type];
      ctx.font = '500 12px system-ui, -apple-system, sans-serif';
      const tagWidth = ctx.measureText(tagText).width + 20;
      
      ctx.fillStyle = bgColors[type]?.tag || (isDarkMode ? '#4b5563' : '#e5e7eb');
      roundRect(ctx, 20, 20, tagWidth, 24, 12);
      ctx.fill();
      
      // Draw tag text
      ctx.fillStyle = bgColors[type]?.tagText || (isDarkMode ? '#f3f4f6' : '#111827');
      ctx.fillText(tagText, 30, 36);
      
      // Draw emoji
      ctx.font = '32px system-ui, -apple-system, sans-serif';
      ctx.fillText(emoji, width - 50, 40);
      
      // Draw title
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#111827';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(title, 20, 60);
      
      // Draw description (with wrapping)
      ctx.fillStyle = isDarkMode ? '#d1d5db' : '#4b5563';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      wrapText(ctx, description, 20, 90, width - 20, 16);
      
      // Draw unlocked time if available
      if (unlockedAt) {
        ctx.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Unlocked ${timeAgo}`, 10, height - 30);
      }
      
      // Draw site URL
      ctx.fillStyle = isDarkMode ? 'rgba(156, 163, 175, 0.9)' : 'rgba(107, 114, 128, 0.9)';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      wrapText(ctx, getShareText(), 20, height - 40, width - 20, 16);
      
      // Convert to data URL and set
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setImageUrl(dataUrl);
      
      // Convert to blob and File for sharing
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `achievement-${title.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
      setImageFile(file);
      
      // Make sure to dismiss the toast ID that was created earlier
      if (toastId) toast.dismiss(toastId);
      
      if (!ingrid) {
        toast.success("Achievement ready to share!", {
          description: "Use the buttons below to share your achievement",
        });
      }
      
    } catch (error) {
      console.error("Error generating image:", error);
      
      // Make sure to dismiss the loading toast in case of error
      if (toastId) toast.dismiss(toastId);
      
      if (!ingrid) {
        toast.error("Failed to prepare image", {
          description: "Try switching between light/dark mode or using a different browser",
        });
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  // Helper function to draw rounded rectangles on canvas
  const roundRect = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };
  
  // Helper function to wrap text on canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y + (lineCount * lineHeight));
        line = words[n] + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, x, y + (lineCount * lineHeight));
  };

  // Share text and basic information for social media
  const getShareText = () => `I just unlocked "${title}" on Useless Achievements!\nCheck it out: ${window.location.origin}`;
  // const getShareUrl = () => window.location.origin;

  // Function to download the generated image
  const downloadImage = () => {
    if (!imageUrl) {
      toast.error("Image not ready yet", { 
        description: "Please wait for the image to generate"
      });
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `achievement-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Image downloaded!", {
        description: "Achievement saved to your device",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download", {
        description: "Please try again later",
      });
    }
  };

  // Function to copy image to clipboard for pasting into social media
  const copyImageToClipboard = async () => {
    if (!imageUrl) {
      toast.error("Image not ready yet", { 
        description: "Please wait for the image to generate"
      });
      return;
    }
    
    try {
      setSocialLoading('Copy');
      
      // Check if it's a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check if Clipboard API is available and properly supports images
      if (!navigator.clipboard || !navigator.clipboard.write || isMobile) {
        // Fallback for mobile devices or browsers that don't support clipboard.write with images
        toast.info("Clipboard image copy not supported on your device", {
          description: "Downloading the image instead. You can manually share it.",
          duration: 4000
        });
        downloadImage();
        return;
      }
      
      // Create a blob from the data URL
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      
      // Copy the image to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      toast.success("Image copied to clipboard!", {
        description: "Now you can paste it directly into your social media post",
      });
    } catch (error) {
      console.error("Error copying image to clipboard:", error);
      toast.error("Failed to copy image", {
        description: "Downloading instead for you to share manually",
      });
      // Offer download as fallback
      downloadImage();
    } finally {
      setSocialLoading(null);
    }
  };

  // Share functions utilizing direct platform APIs where possible
  // const shareFacebook = async () => {
  //   setSocialLoading('Facebook');
  //   try {
  //     // Check if FB SDK is loaded
  //     if (typeof window.FB !== 'undefined') {
  //       // Use proper FB SDK sharing
  //       window.FB.ui({
  //         method: 'share',
  //         href: getShareUrl(),
  //         hashtag: '#UselessAchievements',
  //         quote: getShareText(),
  //       }, function(response) {
  //         if (response && !response.error_message) {
  //           toast.success("Shared to Facebook!");
  //         } else {
  //           toast.error("Facebook sharing failed");
  //           // Fallback to direct sharing
  //           window.open(`https://www.facebook.com/sharer.php?u=${encodeURIComponent(getShareUrl())}&quote=${encodeURIComponent(getShareText())}`, '_blank', 'width=600,height=400');
  //         }
  //       });
  //     } else {
  //       // Fallback if FB SDK not loaded
  //       window.open(`https://www.facebook.com/sharer.php?u=${encodeURIComponent(getShareUrl())}&quote=${encodeURIComponent(getShareText())}`, '_blank', 'width=600,height=400');
  //       toast.info("Opening Facebook share dialog", {
  //         description: "Add your achievement image to complete sharing",
  //       });
  //       // Also download the image for manual sharing
  //       downloadImage();
  //     }
  //   } catch (error) {
  //     console.error("Error sharing to Facebook:", error);
  //     toast.error("Facebook sharing failed", {
  //       description: "Please try downloading and sharing manually",
  //     });
  //     downloadImage();
  //   } finally {
  //     setSocialLoading(null);
  //   }
  // };
  
  // const shareTwitter = async () => {
  //   setSocialLoading('Twitter');
  //   try {
  //     // X/Twitter Web Intent (most reliable method)
  //     const textToShare = `I just unlocked "${title}" ${emoji} on Useless Achievements!`;
  //     const url = getShareUrl();
  //     window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}&url=${encodeURIComponent(url)}&hashtags=UselessAchievements,GameAchievement`, '_blank');
      
  //     toast.info("X/Twitter share dialog opened", {
  //       description: "Download the image to add it to your tweet",
  //     });
  //     // Also download the image for manual sharing
  //     downloadImage();
  //   } catch (error) {
  //     console.error("Error sharing to X/Twitter:", error);
  //     toast.error("X/Twitter sharing failed", {
  //       description: "Please try downloading and sharing manually",
  //     });
  //   } finally {
  //     setSocialLoading(null);
  //   }
  // };
  
  // const shareLinkedIn = async () => {
  //   setSocialLoading('LinkedIn');
  //   try {
  //     // LinkedIn sharing API (OAuth required for more advanced features)
  //     const url = getShareUrl();
  //     const shareTitle = `I unlocked "${title}" on Useless Achievements!`;
  //     window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(description)}`, '_blank', 'width=600,height=400');
      
  //     toast.info("LinkedIn share dialog opened", {
  //       description: "Download the image to add it to your post",
  //     });
  //     // Also download the image for manual sharing
  //     downloadImage();
  //   } catch (error) {
  //     console.error("Error sharing to LinkedIn:", error);
  //     toast.error("LinkedIn sharing failed", {
  //       description: "Please try downloading and sharing manually",
  //     });
  //   } finally {
  //     setSocialLoading(null);
  //   }
  // };
  
  // const shareInstagram = async () => {
  //   setSocialLoading('Instagram');
  //   try {
  //     // Instagram doesn't have a web API for direct sharing
  //     // Best approach is to download the image and instruct the user
  //     downloadImage();
  //     toast.info("Instagram sharing guide", {
  //       description: "Open Instagram → Create a post → Select the downloaded image → Add the achievement text to your caption",
  //       duration: 6000
  //     });
  //   } catch (error) {
  //     console.error("Error preparing for Instagram:", error);
  //     toast.error("Instagram preparation failed", {
  //       description: "Please try downloading and sharing manually",
  //     });
  //   } finally {
  //     setSocialLoading(null);
  //   }
  // };
  
  // Create a map of share functions by platform name
  // const shareFunctions = {
  //   'Facebook': shareFacebook,
  //   'Twitter': shareTwitter,
  //   'LinkedIn': shareLinkedIn,
  //   'Instagram': shareInstagram
  // };

  // Function to handle sharing based on platform name
  // const handleShare = (platformName: string) => {
  //   const shareFunction = shareFunctions[platformName as keyof typeof shareFunctions];
  //   if (shareFunction) {
  //     shareFunction();
  //   } else {
  //     toast.error(`Sharing to ${platformName} not implemented`);
  //   }
  // };

  return (
    <div className="relative w-full">
      {/* Main achievement card */}
      <Card ref={cardRef} className={cardClass}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <span className={tagClass}>
              {is_daily ? 'Daily' : typeNames[type]}
            </span>
            <span className="text-4xl" role="img" aria-label="achievement emoji">
              {emoji}
            </span>
          </div>
          <CardTitle className="text-xl mt-2 font-bold">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {unlockedAt && (
            <p className="text-sm text-muted-foreground">Unlocked {timeAgo}</p>
          )}
        </CardContent>
        {showShareButton && (
          <CardFooter className="flex flex-col pt-0 gap-4">
            {/* Image Preview (if available) */}
            {/* {imageUrl && (
              <div className="w-full flex justify-center mb-2">
                <div className="relative w-64 h-38 rounded-md overflow-hidden border border-gray-200 dark:border-gray-800">
                  <img 
                    src={imageUrl} 
                    alt={`${title} achievement`} 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1">
                    <p className="text-[10px] text-white text-center font-medium">Achievement Image</p>
                  </div>
                </div>
              </div>
            )} */}
            
            {/* Download and Copy Buttons */}
            <div className="grid grid-cols-1 gap-2 w-full">
              <Button
                variant="outline"
                onClick={downloadImage}
                className={`${
                  isMobileDevice 
                    ? "bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 border-primary/20 text-primary font-medium transition-all" 
                    : "bg-gradient-to-r from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium transition-all"
                }`}
                disabled={isGeneratingImage || !imageUrl || socialLoading === 'Copy'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {isMobileDevice ? "Save & Share" : "Download"}
              </Button>
              
              {!isMobileDevice && (
                <Button
                  variant="outline"
                  onClick={copyImageToClipboard}
                  className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border-blue-500/20 text-blue-700 dark:text-blue-400 font-medium transition-all"
                  disabled={isGeneratingImage || !imageUrl || !!socialLoading}
                >
                  {socialLoading === 'Copy' ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                  Copy to Clipboard
                </Button>
              )}
              
              {isMobileDevice && imageUrl && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Save the image and share it on your favorite social platforms
                </p>
              )}
            </div>
            
           
            {/* Social Media Buttons */}
            {/* <div className="grid grid-cols-4 gap-2 w-full">
              {socialPlatforms.map((platform) => (
                <Button 
                  key={platform.name}
                  variant="ghost" 
                  onClick={() => handleShare(platform.name)}
                  className={`
                    flex flex-col items-center justify-center py-1 h-auto
                    border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700
                    bg-white/0 dark:bg-gray-950/50 hover:bg-white dark:hover:bg-gray-900
                    transition-all rounded-lg
                  `}
                  disabled={isGeneratingImage || !imageUrl || !!socialLoading}
                >
                  {socialLoading === platform.name ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <div className="mb-1">{platform.icon}</div>
                    </>
                  )}
                </Button>
              ))}
            </div> */}

            {/* Regenerate button if image generation failed */}
            {!imageUrl && !isGeneratingImage && generationAttemptedRef.current && (
              <Button
                variant="secondary"
                onClick={() => {
                  generationAttemptedRef.current = false;
                  generateImage();
                }}
                className="mt-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 22v-6h6"></path>
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
                Try Again
              </Button>
            )}

            {/* Loading indicator when generating image */}
            {isGeneratingImage && (
              <div className="w-full flex items-center justify-center space-x-2 mt-2">
                <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-muted-foreground">Preparing your achievement...</span>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Add Facebook SDK type definition
declare global {
  interface Window {
    FB?: {
      ui: (
        options: {
          method: string;
          href?: string;
          quote?: string;
          hashtag?: string;
        }, 
        callback: (response: {error_message?: string}) => void
      ) => void;
    };
  }
} 