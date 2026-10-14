"use client";

import React, { memo, useRef, useState, useEffect } from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderCircle, RefreshCw, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Achievement } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { getAchievementIconUrl } from "@/lib/achievement-icon-url";

import {
  typeBorderColors,
  typeBadgeColors,
  typeNames,
  rarityTagClass,
  rarityTokens,
} from "@/components/achievement-styles";

import Image from "next/image";
import { fredoka, nunito } from "./utils/title-fonts";
import { toast } from "sonner";

interface AchievementCardProps {
  achievement: Achievement;
  isCollected?: boolean;
  unlockedAt?: string;
  ingrid?: boolean;
  showShareButton?: boolean;
  variant?: "default" | "compact" | "enlarged";
}

function AchievementCardComponent({
  achievement,
  unlockedAt,
  isCollected = false,
  showShareButton = false,
  ingrid = false,
  variant = "default",
}: AchievementCardProps) {
  const { title, description, type, emoji, icon_path } = achievement;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const generationAttemptedRef = useRef(false);

  const generateImageRef = useRef<() => Promise<void>>(async () => {});

  const iconUrl = getAchievementIconUrl(icon_path);

  const isCompact = variant === "compact";
  const isEnlarged = variant === "enlarged";

  const cardClass = `
  flex
  h-full
  flex-col
  rounded-[15px]
  border-0
  bg-gray-50/80
  py-0
  shadow-sm
  transition-shadow
  hover:shadow-md
`;

  const cardBorderClass = `
  h-full
  rounded-2xl
  bg-gradient-to-br
  ${isEnlarged && "md:scale-105"}
  ${typeBorderColors[type]}
  p-[1px]
  shadow-sm
`;

  const tagClass = `${rarityTagClass} ${typeBadgeColors[type]}`;

  // Format the unlocked time if available
  const timeAgo = unlockedAt
    ? formatDistanceToNow(new Date(unlockedAt), { addSuffix: true })
    : "";

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();

      image.crossOrigin = "anonymous";

      image.onload = () => resolve(image);
      image.onerror = reject;

      image.src = src;
    });
  };

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
      const height = 230;
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
        GAME: {
          borderStart: rarityTokens.game.borderStart,
          borderEnd: rarityTokens.game.borderEnd,
          tagStart: rarityTokens.game.badgeStart,
          tagEnd: rarityTokens.game.badgeEnd,
          sparkleA: rarityTokens.game.sparkleA,
          sparkleB: rarityTokens.game.sparkleB,
          medallionMid: rarityTokens.game.medallionMid,
        },
        COMMON: {
          borderStart: rarityTokens.common.borderStart,
          borderEnd: rarityTokens.common.borderEnd,
          tagStart: rarityTokens.common.badgeStart,
          tagEnd: rarityTokens.common.badgeEnd,
          sparkleA: rarityTokens.common.sparkleA,
          sparkleB: rarityTokens.common.sparkleB,
          medallionMid: rarityTokens.common.medallionMid,
        },
        RARE: {
          borderStart: rarityTokens.rare.borderStart,
          borderEnd: rarityTokens.rare.borderEnd,

          tagStart: rarityTokens.rare.badgeStart,
          tagEnd: rarityTokens.rare.badgeEnd,
          sparkleA: rarityTokens.rare.sparkleA,
          sparkleB: rarityTokens.rare.sparkleB,
          medallionMid: rarityTokens.rare.medallionMid,
        },
        EPIC: {
          borderStart: rarityTokens.epic.borderStart,
          borderEnd: rarityTokens.epic.borderEnd,

          tagStart: rarityTokens.epic.badgeStart,
          tagEnd: rarityTokens.epic.badgeEnd,
          sparkleA: rarityTokens.epic.sparkleA,
          sparkleB: rarityTokens.epic.sparkleB,
          medallionMid: rarityTokens.epic.medallionMid,
        },
        LEGENDARY: {
          borderStart: rarityTokens.legendary.borderStart,
          borderEnd: rarityTokens.legendary.borderEnd,

          tagStart: rarityTokens.legendary.badgeStart,
          tagEnd: rarityTokens.legendary.badgeEnd,
          sparkleA: rarityTokens.legendary.sparkleA,
          sparkleB: rarityTokens.legendary.sparkleB,
          medallionMid: rarityTokens.legendary.medallionMid,
        },
        SECRET: {
          borderStart: rarityTokens.secret.borderStart,
          borderEnd: rarityTokens.secret.borderEnd,

          tagStart: rarityTokens.secret.badgeStart,
          tagEnd: rarityTokens.secret.badgeEnd,

          sparkleA: rarityTokens.secret.sparkleA,
          sparkleB: rarityTokens.secret.sparkleB,

          medallionMid: rarityTokens.secret.medallionMid,
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

      // Achievement icon / emoji, matching the updated card UI.
      const centerX = width - 58;
      const centerY = 58;

      const drawEmojiFallback = () => {
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

        // Sparkles only appear for emoji fallback, not real image icons.
        ctx.fillStyle = theme.sparkleA;
        drawSparkle(ctx, centerX - 23, centerY - 21, 5);

        ctx.fillStyle = theme.sparkleB;
        drawSparkle(ctx, centerX + 18, centerY + 20, 4);

        ctx.font = "30px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(emoji, centerX, centerY + 1);
      };

      if (iconUrl) {
        try {
          const iconImage = await loadImage(iconUrl);
          const iconSize = 88;

          ctx.drawImage(
            iconImage,
            centerX - iconSize / 2,
            centerY - iconSize / 2,
            iconSize,
            iconSize,
          );
        } catch (error) {
          console.error("Failed to load achievement icon:", error);
          drawEmojiFallback();
        }
      } else {
        drawEmojiFallback();
      }

      // Reset text alignment for the rest of the card.
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";

      // Leave room on the right for the larger achievement icon.
      const textMaxWidth = iconUrl ? width - 130 : width - 95;

      // Draw title
      ctx.fillStyle = isDarkMode ? "#f3f4f6" : "#374151";
      ctx.font = `bold 16px ${fredoka.style.fontFamily}`;
      wrapText(ctx, title, 20, 67, textMaxWidth, 19, 2);

      // Draw description directly below the title, matching CardHeader.
      ctx.fillStyle = isDarkMode ? "#d1d5db" : "#6b7280";
      ctx.font = `400 12px ${nunito.style.fontFamily}`;
      wrapText(ctx, description, 20, 94, textMaxWidth, 16, 3);

      // Draw site URL
      const shareText = getShareText();

      const shareX = 20;
      const shareWidth = width - 40;
      const shareHeight = 42;
      const shareY = height - shareHeight - 20;

      if (unlockedAt) {
        ctx.fillStyle = isDarkMode ? "#9ca3af" : "#6b7280";
        ctx.font = `400 11px ${nunito.style.fontFamily}`;
        ctx.fillText(`Unlocked ${timeAgo}`, 20, shareY - 10);
      }

      ctx.fillStyle = isDarkMode
        ? "rgba(31, 41, 55, 0.92)"
        : "rgba(255, 255, 255, 0.96)";

      ctx.strokeStyle = isDarkMode
        ? "rgba(75, 85, 99, 0.8)"
        : "rgba(209, 213, 219, 0.9)";

      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(shareX, shareY, shareWidth, shareHeight, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDarkMode ? "#f3f4f6" : "#374151";
      ctx.font = `600 11px ${nunito.style.fontFamily}`;

      wrapText(ctx, shareText, shareX + 12, shareY + 16, shareWidth - 24, 14);

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

      // if (!ingrid) {
      //   toast.success("Achievement ready to share!", {
      //     description: "Use the buttons below to share your achievement",
      //   });
      // }
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

  generateImageRef.current = generateImage;

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
      void generateImageRef.current();
    }
  }, [showShareButton, imageUrl, isGeneratingImage]);

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
    maxLines = Infinity,
  ) => {
    const words = text.split(" ");
    let line = "";
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = `${line}${words[n]} `;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && line) {
        if (lineCount >= maxLines - 1) {
          let finalLine = line.trim();

          while (
            ctx.measureText(`${finalLine}...`).width > maxWidth &&
            finalLine.length > 0
          ) {
            finalLine = finalLine.slice(0, -1);
          }

          ctx.fillText(`${finalLine.trim()}...`, x, y + lineCount * lineHeight);
          return;
        }

        ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
        line = `${words[n]} `;
        lineCount++;
      } else {
        line = testLine;
      }
    }

    if (line && lineCount < maxLines) {
      ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
    }
  };

  // Share text and basic information for social media
  const getShareText = () =>
    `I just unlocked "${title}" on Useless Achievements!`;
  // const getShareUrl = () => window.location.origin;

  const shareAchievement = async () => {
    if (!imageFile) {
      toast.error("Image not ready yet", {
        description: "Please wait for the image to generate",
      });

      return;
    }

    try {
      setSocialLoading("Share");

      const shareData: ShareData = {
        title: `${title} - Useless Achievements`,
        text: getShareText(),
        files: [imageFile],
      };

      if (
        navigator.share &&
        navigator.canShare?.({
          files: [imageFile],
        })
      ) {
        await navigator.share(shareData);

        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: `${title} - Useless Achievements`,
          text: getShareText(),
        });

        return;
      }

      toast.info("Sharing is not supported in this browser", {
        description: "Download the image and share it manually.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Error sharing achievement:", error);

      toast.error("Unable to share achievement", {
        description: "Try downloading the image instead.",
      });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="relative w-full">
      {/* Gradient border wrapper */}
      <div className={cardBorderClass}>
        {/* Main achievement card */}
        <Card ref={cardRef} className={cardClass}>
          <CardHeader
            className={
              isCompact ? "flex-1 px-3 pb-2 pt-3" : "flex-1 pb-2 px-3 pt-3"
            }
          >
            <div className="flex items-start justify-between gap-1">
              <div className="space-y-1">
                <span
                  className={`${tagClass} ${
                    isCompact ? "px-2 py-0.5 text-[10px]" : ""
                  }`}
                >
                  {typeNames[type]}
                </span>
                <CardTitle
                  className={`${fredoka.className}
                    ${
                      isCompact
                        ? `text-base font-semibold tracking-tight text-gray-700 dark:text-gray-200 whitespace-nowrap`
                        : `text-md font-semibold tracking-normal text-gray-700 dark:text-gray-200 whitespace-nowrap`
                    }`}
                >
                  {title}
                </CardTitle>
                <CardDescription
                  className={`${nunito.className}
                    ${
                      isCompact
                        ? `min-h-8 line-clamp-2 text-xs leading-3.5`
                        : `min-h-12 line-clamp-3 text-xs leading-4`
                    }`}
                >
                  {description}
                </CardDescription>
              </div>

              <div className="relative -mr-2 -mt-2">
                {/* Sparkles */}
                {!iconUrl && (
                  <>
                    <Sparkles className="absolute left-1 -top-1 size-4 text-violet-400" />

                    <Sparkles className="absolute -bottom-1 right-1 size-3 text-purple-300" />
                  </>
                )}

                {/* Emoji circle */}
                <div
                  className={`flex items-center justify-center ${
                    iconUrl ? "size-26" : "size-14"
                  }`}
                >
                  <div
                    className={`flex size-full items-center justify-center ${iconUrl ? "" : "rounded-full bg-gradient-to-br from-transparent via-blue-400/20 to-transparent"}`}
                  >
                    <span
                      className={`${iconUrl ? "size-24" : "bg-white/50 size-10 rounded-full"} flex items-center justify-center`}
                    >
                      {iconUrl ? (
                        <Image
                          src={iconUrl}
                          alt={`${title} achievement`}
                          loading="lazy"
                          decoding="async"
                          width={80}
                          height={80}
                          className="h-24 w-24 object-contain"
                        />
                      ) : (
                        <span
                          className="text-2xl"
                          role="img"
                          aria-label={`${title} achievement`}
                        >
                          {emoji}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* {unlockedAt && (
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Unlocked {timeAgo}
              </p>
            </CardContent>
          )} */}
          {showShareButton && (
            <CardFooter className="flex border-t [.border-t]:pt-2 border-gray-400 justify-end pt-0 pb-2 px-0 mx-2 md:mx-4">
              <Button
                type="button"
                variant="ghost"
                onClick={shareAchievement}
                className="
                group
                h-auto
  bg-transparent
  px-0
  py-0
  font-bold
  shadow-none
  hover:-translate-y-0.5
  hover:bg-transparent
        hover:shadow-none
    "
                disabled={
                  isGeneratingImage ||
                  !imageFile ||
                  !!socialLoading ||
                  !isCollected
                }
              >
                {socialLoading === "Share" ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin text-orange-500" />
                ) : (
                  <Share2 className="mr-2 size-4 text-orange-500 transition-colors group-hover:text-orange-400" />
                )}
                <span
                  className="
                bg-gradient-to-r 
                from-orange-500 
                to-rose-500 
                bg-clip-text 
                text-transparent 
                transition-all 
                group-hover:from-orange-400 
                group-hover:to-rose-400"
                >
                  Share
                </span>
              </Button>

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

export const AchievementCard = memo(AchievementCardComponent);
AchievementCard.displayName = "AchievementCard";
