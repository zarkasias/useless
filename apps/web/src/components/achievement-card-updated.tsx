"use client";

import React, { memo, useRef } from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, LoaderCircle, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Achievement } from "@/lib/supabase";
import { getAchievementIconUrl } from "@/lib/achievement-icon-url";

import {
  achievementCardTokens,
  getBadgeTextColor,
  getRarityToken,
  typeNames,
  rarityTagClass,
} from "@/components/achievement-styles";
import { useAchievementShare } from "@/components/use-achievement-share";

import Image from "next/image";
import { fredoka, nunito } from "./utils/title-fonts";

interface AchievementCardProps {
  achievement: Achievement;
  isCollected?: boolean;
  ingrid?: boolean;
  showShareButton?: boolean;
  variant?: "default" | "compact" | "enlarged" | "stacked";
}

function AchievementCardComponent({
  achievement,
  isCollected = false,
  showShareButton = false,
  ingrid = false,
  variant = "default",
}: AchievementCardProps) {
  const { title, description, type, emoji, icon_path } = achievement;
  const cardRef = useRef<HTMLDivElement>(null);

  const rarityTheme = getRarityToken(type);
  const cardTheme = achievementCardTokens;

  const iconUrl = getAchievementIconUrl(icon_path);

  const isCompact = variant === "compact";
  const isEnlarged = variant === "enlarged";
  const isStacked = variant === "stacked";

  const { share, canShareFiles, isBusy, canTapShare } = useAchievementShare({
    input: { title, description, type, emoji, iconUrl },
    enabled: showShareButton && isCollected,
    waitForVisible: ingrid,
    targetRef: cardRef,
  });

  const cardClass = `
  flex
  h-full
  flex-col
  border-0
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
  p-[2px]
  shadow-sm
`;

  const ShareIcon = canShareFiles ? Share2 : Download;

  const badge = (
    <span
      className={`${rarityTagClass} ${fredoka.className} ${
        isCompact ? "px-2 py-0.5 text-[10px]" : ""
      }`}
      style={{
        backgroundImage: `linear-gradient(
      to right,
      ${rarityTheme.badgeStart},
      ${rarityTheme.badgeEnd}
    )`,
        color: getBadgeTextColor(type),
        borderRadius: cardTheme.badge.radius,
      }}
    >
      {typeNames[type]}
    </span>
  );

  const emojiLabel = (
    <span role="img" aria-label={`${title} achievement`}>
      {emoji}
    </span>
  );

  return (
    <div className="relative w-full">
      {/* Gradient border wrapper */}
      <div
        className={cardBorderClass}
        style={{
          borderRadius: cardTheme.outerRadius,
          backgroundImage: `linear-gradient(
      to bottom right,
      ${rarityTheme.borderStart},
      ${rarityTheme.borderEnd}
    )`,
        }}
      >
        {/* Main achievement card */}
        <Card
          ref={cardRef}
          className={cardClass}
          style={{
            borderRadius: cardTheme.radius,
            backgroundColor: cardTheme.surface.light,
          }}
        >
          {isStacked ? (
            <CardHeader className="flex flex-1 flex-col items-center gap-2 px-5 pb-4 pt-5 text-center">
              {iconUrl ? (
                <Image
                  src={iconUrl}
                  alt={`${title} achievement`}
                  loading="lazy"
                  decoding="async"
                  width={160}
                  height={160}
                  className="size-28 object-contain sm:size-36"
                />
              ) : (
                <div className="relative flex size-28 items-center justify-center sm:size-36">
                  <Sparkles className="absolute left-3 top-2 size-6 text-violet-400" />
                  <Sparkles className="absolute bottom-3 right-4 size-4 text-purple-300" />
                  <div className="flex size-full items-center justify-center rounded-full bg-linear-to-br from-transparent via-blue-400/20 to-transparent">
                    <span className="flex size-20 items-center justify-center rounded-full bg-white/50 text-5xl sm:size-24 sm:text-6xl">
                      {emojiLabel}
                    </span>
                  </div>
                </div>
              )}

              {badge}

              <CardTitle
                className={`${fredoka.className} text-2xl font-semibold`}
                style={{ color: cardTheme.title.colorLight }}
              >
                {title}
              </CardTitle>

              <CardDescription
                className={`${nunito.className} text-sm font-medium`}
                style={{ color: cardTheme.description.colorLight }}
              >
                {description}
              </CardDescription>
            </CardHeader>
          ) : (
            <CardHeader
              className={
                isCompact ? "flex-1 px-3 pb-2 pt-3" : "flex-1 pb-2 px-3 pt-3"
              }
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1 space-y-1">
                  {badge}
                  <CardTitle
                    className={`${fredoka.className}
                    ${
                      isCompact
                        ? "wrap-break-word text-base font-semibold tracking-tight"
                        : "wrap-break-word text-md font-semibold tracking-normal"
                    }`}
                    style={{
                      color: cardTheme.title.colorLight,
                    }}
                  >
                    {title}
                  </CardTitle>
                  <CardDescription
                    className={`${nunito.className}
                    ${
                      isCompact
                        ? "min-h-8 line-clamp-2 text-xs leading-4"
                        : "min-h-12 line-clamp-3 text-xs leading-4"
                    }`}
                    style={{
                      color: cardTheme.description.colorLight,
                    }}
                  >
                    {description}
                  </CardDescription>
                </div>

                <div className="relative -mr-2 -mt-2 shrink-0">
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
                      className={`flex size-full items-center justify-center ${iconUrl ? "" : "rounded-full bg-linear-to-br from-transparent via-blue-400/20 to-transparent"}`}
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
                          <span className="text-2xl">{emojiLabel}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          )}

          {showShareButton && (
            <CardFooter className="flex border-t [.border-t]:pt-2 border-gray-400 justify-end pt-0 pb-2 px-0 mx-2 md:mx-4">
              <Button
                type="button"
                variant="ghost"
                onClick={share}
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
                disabled={!canTapShare}
              >
                {isBusy ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin text-orange-500" />
                ) : (
                  <ShareIcon className="mr-2 size-4 text-orange-500 transition-colors group-hover:text-orange-400" />
                )}
                <span
                  className="
                bg-linear-to-r
                from-orange-500
                to-rose-500
                bg-clip-text
                text-transparent
                transition-all
                group-hover:from-orange-400
                group-hover:to-rose-400"
                >
                  {canShareFiles ? "Share" : "Download"}
                </span>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

export const AchievementCard = memo(AchievementCardComponent);
AchievementCard.displayName = "AchievementCard";
