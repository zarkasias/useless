import React, { useRef, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Copy,
  Download,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Achievement, AchievementType } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Define achievement type colors with more vibrant gradients

const typeBorderColors: Record<AchievementType, string> = {
  COMMON: "from-gray-100 to-gray-300",

  RARE: "from-gray-100 to-blue-500",

  EPIC: "from-gray-100 to-purple-500",

  LEGENDARY: "from-gray-100 to-amber-500",
};

const typeBadgeColors: Record<AchievementType, string> = {
  COMMON: "bg-gradient-to-r from-gray-500 via-gray-400 to-gray-400 text-white",

  RARE: "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-400 text-white",

  EPIC: "bg-gradient-to-r from-purple-500 via-purple-400 to-purple-400 text-white",

  LEGENDARY:
    "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-400 text-white",
};

const typeNames: Record<AchievementType, string> = {
  COMMON: "Common",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
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
  isCollected?: boolean;
  unlockedAt?: string;
  ingrid?: boolean;
  showShareButton?: boolean;
  variant?: "default" | "compact";
}

export function AchievementCard({
  achievement,
  unlockedAt,
  isCollected = false,
  showShareButton = false,
  ingrid = false,
  variant = "default",
}: AchievementCardProps) {
  const { title, description, type, emoji } = achievement;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const generationAttemptedRef = useRef(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const isCompact = variant === "compact";

  const cardClass = `
  flex
  h-full
  flex-col
  rounded-[15px]
  border-0
  bg-gray-50/80
  ${isCompact ? "py-2" : "py-4"}
  shadow-sm
  transition-shadow
  hover:shadow-md
`;

  const cardBorderClass = `
  h-full
  rounded-2xl
  bg-gradient-to-br
  ${typeBorderColors[type]}
  p-[1px]
  shadow-sm
`;

  const tagClass = `
  inline-flex
  items-center
  rounded-full
  border
  px-2.5
  py-1
  text-xs
  uppercase
  font-medium
  ${typeBadgeColors[type]}
`;

  // Format the unlocked time if available
  const timeAgo = unlockedAt
    ? formatDistanceToNow(new Date(unlockedAt), { addSuffix: true })
    : "";

  // Automatically generate image when component mounts
  useEffect(() => {
    // Only generate once and only if sharing is enabled
    if (
      showShareButton &&
      !imageUrl &&
      !isGeneratingImage &&
      !generationAttemptedRef.current
    ) {
      generationAttemptedRef.current = true;
      generateImage();
    }
  }, [showShareButton, imageUrl, isGeneratingImage]);

  // Detect mobile devices on component mount
  useEffect(() => {
    const detectMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
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
      const canvas = document.createElement("canvas");
      const width = 350;
      const height = 200;
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Scale for high DPI
      ctx.scale(scale, scale);

      // Detect dark mode
      const isDarkMode = document.documentElement.classList.contains("dark");

      // Match the current on-screen card styling:
      // soft gray interior, subtle rarity gradient border,
      // gradient rarity badge, and decorated emoji medallion.
      const canvasTheme = {
        COMMON: {
          borderStart: "#f3f4f6",
          borderEnd: "#d1d5db",
          tagStart: "#6b7280",
          tagEnd: "#9ca3af",
          sparkleA: "#a78bfa",
          sparkleB: "#d8b4fe",
          medallionMid: "rgba(96, 165, 250, 0.30)",
        },
        RARE: {
          borderStart: "#f3f4f6",
          borderEnd: "#3b82f6",
          tagStart: "#3b82f6",
          tagEnd: "#60a5fa",
          sparkleA: "#a78bfa",
          sparkleB: "#d8b4fe",
          medallionMid: "rgba(96, 165, 250, 0.30)",
        },
        EPIC: {
          borderStart: "#f3f4f6",
          borderEnd: "#a855f7",
          tagStart: "#a855f7",
          tagEnd: "#c084fc",
          sparkleA: "#a78bfa",
          sparkleB: "#d8b4fe",
          medallionMid: "rgba(168, 85, 247, 0.24)",
        },
        LEGENDARY: {
          borderStart: "#f3f4f6",
          borderEnd: "#f59e0b",
          tagStart: "#f59e0b",
          tagEnd: "#fbbf24",
          sparkleA: "#a78bfa",
          sparkleB: "#d8b4fe",
          medallionMid: "rgba(251, 191, 36, 0.24)",
        },
      } as const;

      const theme = canvasTheme[type];

      // Outer gradient border, matching typeBorderColors.
      const borderGradient = ctx.createLinearGradient(0, 0, width, height);
      borderGradient.addColorStop(0, theme.borderStart);
      borderGradient.addColorStop(1, theme.borderEnd);

      ctx.fillStyle = borderGradient;
      roundRect(ctx, 0, 0, width, height, 16);
      ctx.fill();

      // Inner card uses the same soft gray surface as bg-gray-50/80.
      ctx.fillStyle = isDarkMode ? "#111827" : "#f9fafb";
      roundRect(ctx, 1.5, 1.5, width - 3, height - 3, 15);
      ctx.fill();

      // Rarity badge.
      const tagText = typeNames[type].toUpperCase();
      ctx.font = "500 12px system-ui, -apple-system, sans-serif";
      const tagWidth = ctx.measureText(tagText).width + 22;

      const tagGradient = ctx.createLinearGradient(20, 0, 20 + tagWidth, 0);
      tagGradient.addColorStop(0, theme.tagStart);
      tagGradient.addColorStop(1, theme.tagEnd);

      ctx.fillStyle = tagGradient;
      roundRect(ctx, 20, 18, tagWidth, 24, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(tagText, 31, 34);

      // Decorated emoji medallion in the top-right, matching the UI.
      const centerX = width - 48;
      const centerY = 36;
      const radius = 28;

      const medallionGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        2,
        centerX,
        centerY,
        radius,
      );
      medallionGradient.addColorStop(0, theme.medallionMid);
      medallionGradient.addColorStop(0.55, theme.medallionMid);
      medallionGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = medallionGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Small sparkle marks around the emoji.
      ctx.fillStyle = theme.sparkleA;
      drawSparkle(ctx, centerX - 23, centerY - 21, 5);

      ctx.fillStyle = theme.sparkleB;
      drawSparkle(ctx, centerX + 18, centerY + 20, 4);

      // Emoji itself.
      ctx.font = "30px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, centerX, centerY + 1);

      // Reset text alignment for the rest of the card.
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";

      // Draw title
      ctx.fillStyle = isDarkMode ? "#f3f4f6" : "#374151";
      ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
      ctx.fillText(title, 20, 60);

      // Draw description (with wrapping)
      ctx.fillStyle = isDarkMode ? "#d1d5db" : "#6b7280";
      ctx.font = "12px system-ui, -apple-system, sans-serif";
      wrapText(ctx, description, 20, 90, width - 20, 16);

      // Draw unlocked time if available
      if (unlockedAt) {
        ctx.fillStyle = isDarkMode ? "#9ca3af" : "#6b7280";
        ctx.font = "12px system-ui, -apple-system, sans-serif";
        ctx.fillText(`Unlocked ${timeAgo}`, 10, height - 30);
      }

      // Draw site URL
      ctx.fillStyle = isDarkMode
        ? "rgba(156, 163, 175, 0.9)"
        : "rgba(107, 114, 128, 0.9)";
      ctx.font = "9px system-ui, -apple-system, sans-serif";
      wrapText(ctx, getShareText(), 20, height - 40, width - 20, 16);

      // Convert to data URL and set
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      setImageUrl(dataUrl);

      // Convert to blob and File for sharing
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `achievement-${title.toLowerCase().replace(/\s+/g, "-")}.png`,
        { type: "image/png" },
      );
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
          description:
            "Try switching between light/dark mode or using a different browser",
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
    radius: number,
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

  // Helper function to draw a simple four-point sparkle.
  const drawSparkle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.35, y - size * 0.35);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size * 0.35, y + size * 0.35);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.35, y + size * 0.35);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x - size * 0.35, y - size * 0.35);
    ctx.closePath();
    ctx.fill();
  };

  // Helper function to wrap text on canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const words = text.split(" ");
    let line = "";
    let testLine = "";
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y + lineCount * lineHeight);
        line = words[n] + " ";
        lineCount++;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, y + lineCount * lineHeight);
  };

  // Share text and basic information for social media
  const getShareText = () =>
    `I just unlocked "${title}" on Useless Achievements!\nCheck it out: ${window.location.origin}`;
  // const getShareUrl = () => window.location.origin;

  // Function to download the generated image
  const downloadImage = () => {
    if (!imageUrl) {
      toast.error("Image not ready yet", {
        description: "Please wait for the image to generate",
      });
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `achievement-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
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
        description: "Please wait for the image to generate",
      });
      return;
    }

    try {
      setSocialLoading("Copy");

      // Check if it's a mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      // Check if Clipboard API is available and properly supports images
      if (!navigator.clipboard || !navigator.clipboard.write || isMobile) {
        // Fallback for mobile devices or browsers that don't support clipboard.write with images
        toast.info("Clipboard image copy not supported on your device", {
          description:
            "Downloading the image instead. You can manually share it.",
          duration: 4000,
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
          [blob.type]: blob,
        }),
      ]);

      toast.success("Image copied to clipboard!", {
        description:
          "Now you can paste it directly into your social media post",
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
      {/* Gradient border wrapper */}
      <div className={cardBorderClass}>
        {/* Main achievement card */}
        <Card ref={cardRef} className={cardClass}>
          <CardHeader
            className={isCompact ? "flex-1 px-4 pb-2" : "flex-1 pb-3"}
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className={`${tagClass} ${
                  isCompact ? "px-2 py-0.5 text-[10px]" : ""
                }`}
              >
                {typeNames[type]}
              </span>

              <div className="relative mr-2 mt-2">
                {/* Sparkles */}
                <Sparkles className="absolute left-1 -top-1 size-4 text-violet-400" />

                <Sparkles className="absolute -bottom-1 right-1 size-3 text-purple-300" />

                {/* Emoji circle */}
                <div
                  className={`
      flex size-14 items-center justify-center
      rounded-full
    `}
                >
                  <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-transparent via-blue-400/30 to-transparent">
                    <span className="bg-white/60 size-10 rounded-full flex items-center justify-center">
                      <span
                        className="text-2xl"
                        role="img"
                        aria-label={`${title} achievement`}
                      >
                        {emoji}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={isCompact ? "space-y-1 pt-1" : "space-y-2 pt-2"}>
              <CardTitle
                className={
                  isCompact
                    ? "text-base font-semibold tracking-tight text-gray-700 dark:text-gray-200"
                    : "text-lg font-semibold tracking-tight text-gray-700 dark:text-gray-200"
                }
              >
                {title}
              </CardTitle>

              <CardDescription
                className={
                  isCompact
                    ? "min-h-10 line-clamp-2 text-xs leading-5"
                    : "min-h-[52px] line-clamp-3 text-xs leading-6"
                }
              >
                {description}
              </CardDescription>
            </div>
          </CardHeader>

          {unlockedAt && (
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Unlocked {timeAgo}
              </p>
            </CardContent>
          )}
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
                  className="w-full"
                  disabled={
                    isGeneratingImage ||
                    !imageUrl ||
                    socialLoading === "Copy" ||
                    !isCollected
                  }
                >
                  <Download className="mr-2 size-4" />

                  {isMobileDevice ? "Save & Share" : "Download"}
                </Button>

                {!isMobileDevice && (
                  <Button
                    variant="outline"
                    onClick={copyImageToClipboard}
                    className="w-full"
                    disabled={
                      isGeneratingImage ||
                      !imageUrl ||
                      !!socialLoading ||
                      !isCollected
                    }
                  >
                    {socialLoading === "Copy" ? (
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Copy className="mr-2 size-4" />
                    )}
                    Copy to Clipboard
                  </Button>
                )}

                {isMobileDevice && imageUrl && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Save the image and share it on your favorite social
                    platforms
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
              {!imageUrl &&
                !isGeneratingImage &&
                generationAttemptedRef.current && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      generationAttemptedRef.current = false;
                      generateImage();
                    }}
                    className="mt-2 text-sm"
                  >
                    <RefreshCw className="mr-2 size-4" />
                    Try Again
                  </Button>
                )}

              {/* Loading indicator when generating image */}
              {isGeneratingImage && (
                <div className="mt-2 flex w-full items-center justify-center gap-2">
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" />

                  <span className="text-xs text-muted-foreground">
                    Preparing your achievement...
                  </span>
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
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
        callback: (response: { error_message?: string }) => void,
      ) => void;
    };
  }
}
