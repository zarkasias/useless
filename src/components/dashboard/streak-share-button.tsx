"use client";

import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fredoka, nunito } from "@/components/utils/title-fonts";

interface StreakShareProps {
  username: string;
  currentStreak: number;
}

export function StreakShareButton(props: StreakShareProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="
      group h-7 shrink-0 w-fit
      bg-transparent
      px-0
      text-xs font-black text-white
      transition-all
      duration-300
      hover:text-white/80
      hover:bg-transparent
    "
          aria-label="Share current streak"
        >
          <Share2
            className="size-5 transition-transform group-hover:rotate-6"
            aria-hidden="true"
          />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="
          max-h-[90dvh]
          overflow-y-auto
          border-violet-200
          bg-gradient-to-b
          from-violet-50
          via-blue-50
          to-white
          sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Share your streak</DialogTitle>
          <DialogDescription>
            Share your badge and your completely unnecessary dedication with the
            world.
          </DialogDescription>
        </DialogHeader>
        {open && <StreakBadgePreview {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function StreakBadgePreview({ username, currentStreak }: StreakShareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const caption =
    currentStreak > 0
      ? `I've  maintained a ${currentStreak}-day streak of accomplishing absolutely nothing.`
      : `My uselessness streak is currently 0.
Every pointless journey starts somewhere.`;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setImageError(false);

    const drawBadge = async () => {
      try {
        await Promise.all([
          document.fonts.load(`700 58px ${fredoka.style.fontFamily}`),
          document.fonts.load(`600 34px ${fredoka.style.fontFamily}`),
          document.fonts.load(`600 30px ${nunito.style.fontFamily}`),
          document.fonts.load(`400 31px ${nunito.style.fontFamily}`),
        ]);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) throw new Error("Image rendering unavailable");

        const width = 1080;
        const height = 660;

        canvas.width = width;
        canvas.height = height;

        // --------------------------------------------------
        // STREAK THEME
        // --------------------------------------------------

        const theme = {
          borderStart: "#fb923c",
          borderEnd: "#f43f5e",

          tagStart: "#f97316",
          tagEnd: "#f43f5e",
        };

        // --------------------------------------------------
        // BACKGROUND / GRADIENT BORDER
        // --------------------------------------------------

        const borderGradient = ctx.createLinearGradient(0, 0, width, height);

        borderGradient.addColorStop(0, theme.borderStart);
        borderGradient.addColorStop(1, theme.borderEnd);

        ctx.fillStyle = borderGradient;

        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 42);
        ctx.fill();

        // --------------------------------------------------
        // INNER ACHIEVEMENT CARD
        // --------------------------------------------------

        ctx.fillStyle = "#f9fafb";

        ctx.beginPath();
        ctx.roundRect(5, 5, width - 10, height - 10, 38);

        ctx.fill();

        // --------------------------------------------------
        // STREAK TAG
        // --------------------------------------------------

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        ctx.font = `700 30px ${nunito.style.fontFamily}`;

        const tagText = "STREAK";
        const tagWidth = ctx.measureText(tagText).width + 64;

        const tagGradient = ctx.createLinearGradient(60, 0, 60 + tagWidth, 0);

        tagGradient.addColorStop(0, theme.tagStart);

        tagGradient.addColorStop(1, theme.tagEnd);

        ctx.fillStyle = tagGradient;

        ctx.beginPath();

        ctx.roundRect(60, 55, tagWidth, 54, 29);

        ctx.fill();

        ctx.fillStyle = "#ffffff";

        ctx.fillText(tagText, 94, 84);

        // --------------------------------------------------
        // FLAME ICON
        // --------------------------------------------------

        const flameImage = new window.Image();

        flameImage.src = "/icons/flame.webp";

        await new Promise<void>((resolve, reject) => {
          flameImage.onload = () => resolve();
          flameImage.onerror = () =>
            reject(new Error("Failed to load flame icon"));
        });

        const flameSize = 190;
        const flameX = width - flameSize - 70;
        const flameY = 55;

        ctx.drawImage(flameImage, flameX, flameY, flameSize, flameSize);

        // --------------------------------------------------
        // TITLE
        // --------------------------------------------------

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        ctx.fillStyle = "#374151";

        let titleSize = 58;

        const title = `${currentStreak} Day Useless Streak`;

        ctx.font = `700 ${titleSize}px ${fredoka.style.fontFamily}`;

        while (ctx.measureText(title).width > 700 && titleSize > 40) {
          titleSize -= 2;

          ctx.font = `700 ${titleSize}px ${fredoka.style.fontFamily}`;
        }

        ctx.fillText(title, 60, 215);

        // --------------------------------------------------
        // DESCRIPTION
        // --------------------------------------------------

        ctx.fillStyle = "#6b7280";

        ctx.font = `400 31px ${nunito.style.fontFamily}`;

        const description =
          currentStreak === 1
            ? "Returned for another completely unnecessary accomplishment."
            : `Somehow returned ${currentStreak} days in a row to accomplish absolutely nothing.`;

        wrapCanvasText(ctx, description, 60, 280, 690, 44, 3);

        // --------------------------------------------------
        // USERNAME
        // --------------------------------------------------

        let usernameSize = 34;

        ctx.font = `600 ${usernameSize}px ${fredoka.style.fontFamily}`;

        while (ctx.measureText(username).width > 600 && usernameSize > 22) {
          usernameSize -= 2;

          ctx.font = `600 ${usernameSize}px ${fredoka.style.fontFamily}`;
        }

        ctx.fillStyle = "#374151";

        ctx.fillText(username, 60, 425);

        // --------------------------------------------------
        // USER LABEL
        // --------------------------------------------------

        ctx.fillStyle = "#9ca3af";

        ctx.font = `600 23px ${nunito.style.fontFamily}`;

        ctx.fillText("CERTIFIED POINTLESS PARTICIPANT", 60, 465);

        // --------------------------------------------------
        // FOOTER DIVIDER
        // --------------------------------------------------

        const footerY = 560;

        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(60, footerY);

        ctx.lineTo(width - 60, footerY);

        ctx.stroke();

        // --------------------------------------------------
        // WEBSITE
        // --------------------------------------------------

        ctx.textAlign = "left";

        ctx.fillStyle = "#6b7280";

        ctx.font = `600 25px ${nunito.style.fontFamily}`;

        ctx.fillText("uselessachievements.com", 60, 605);

        // --------------------------------------------------
        // DATE
        // --------------------------------------------------

        ctx.textAlign = "right";

        ctx.fillStyle = "#9ca3af";

        ctx.font = `400 22px ${nunito.style.fontFamily}`;

        const date = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        ctx.fillText(`Achieved ${date}`, width - 60, 605);

        if (!cancelled) {
          setReady(true);
        }
      } catch (error) {
        console.error("Failed to generate streak badge:", error);
        if (!cancelled) setImageError(true);
      }
    };
    void drawBadge();
    return () => {
      cancelled = true;
    };
  }, [username, currentStreak]);

  const downloadBadge = () => {
    if (!ready || !canvasRef.current) return;
    try {
      const link = document.createElement("a");
      link.href = canvasRef.current.toDataURL("image/png");
      link.download = `useless-achievements-streak-${currentStreak}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Couldn't download your badge. Please try again.");
    }
  };

  const getBadgeFile = async (): Promise<File | null> => {
    if (!ready || !canvasRef.current) return null;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvasRef.current?.toBlob(resolve, "image/png");
    });

    if (!blob) return null;

    return new File(
      [blob],
      `useless-achievements-streak-${currentStreak}.png`,
      { type: "image/png" },
    );
  };

  const shareBadge = async () => {
    if (!ready || !canvasRef.current) return;

    try {
      setSharing(true);

      if (!window.isSecureContext) {
        toast.info("Sharing requires a secure connection", {
          description: "Open the site using HTTPS to share your streak.",
        });
        return;
      }

      if (!navigator.share) {
        toast.info("Native sharing isn't available", {
          description: "Download the badge and share it manually.",
        });
        return;
      }

      const badgeFile = await getBadgeFile();

      if (!badgeFile) {
        toast.error("Couldn't prepare your badge for sharing.");
        return;
      }

      const canShareFile =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [badgeFile] });

      if (canShareFile) {
        await navigator.share({
          title: `${currentStreak} Day Useless Streak`,
          text: caption,
          files: [badgeFile],
        });
        return;
      }

      await navigator.share({
        title: `${currentStreak} Day Useless Streak`,
        text: caption,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Failed to share streak badge:", error);
      toast.error("Couldn't share your badge", {
        description: "Try downloading it instead.",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className={`${nunito.className} space-y-5`}>
      {/* Preview */}
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-orange-200/70
          bg-white
          shadow-lg
          shadow-orange-950/10
        "
      >
        <canvas
          ref={canvasRef}
          width={1080}
          height={720}
          role="img"
          aria-label={`${username}'s ${currentStreak}-day useless streak achievement`}
          className="
            mx-auto
            aspect-[3/2]
            w-full
          "
          hidden={!ready}
        />

        {!ready && (
          <div
            className="
              flex
              aspect-[3/2]
              items-center
              justify-center
              p-8
            "
          >
            <p
              role="status"
              className="
                text-center
                text-sm
                text-muted-foreground
              "
            >
              {imageError
                ? "Couldn't prepare your streak achievement. Close this window and try again."
                : "Preparing your completely unnecessary achievement…"}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={shareBadge}
          disabled={!ready || sharing}
          className="
            flex-1
            bg-gradient-to-r
            from-orange-500
            to-rose-500
            font-bold
            text-white
            shadow-md
            shadow-orange-500/20
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:from-orange-400
            hover:to-rose-400
            hover:shadow-lg
          "
        >
          {sharing ? (
            <LoaderCircle
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Share2 className="mr-2 size-4" aria-hidden="true" />
          )}

          {sharing ? "Sharing…" : "Share achievement"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={downloadBadge}
          disabled={!ready || sharing}
          className="
            flex-1
            transition-colors
            duration-200
            hover:border-orange-300
            hover:bg-orange-50
          "
        >
          <Download className="mr-2 size-4" aria-hidden="true" />
          Download image
        </Button>
      </div>

      {/* Caption */}
      <div>
        <label
          htmlFor="streak-share-caption"
          className="
            mb-1.5
            block
            text-sm
            font-semibold
            text-gray-700
          "
        >
          Share caption
        </label>

        <textarea
          id="streak-share-caption"
          readOnly
          value={caption}
          rows={3}
          className="
            w-full
            resize-none
            rounded-xl
            border
            border-gray-200
            bg-white/80
            p-3
            text-sm
            leading-5
            text-gray-700
            outline-none
            transition-colors
            duration-200
            focus:border-violet-300
            focus:ring-2
            focus:ring-violet-100
          "
          onFocus={(event) => event.currentTarget.select()}
        />
      </div>
    </div>
  );
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Infinity,
) {
  const words = text.split(" ");

  let line = "";
  let lineCount = 0;

  for (let index = 0; index < words.length; index++) {
    const testLine = `${line}${words[index]} `;

    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && line) {
      ctx.fillText(line.trim(), x, y + lineCount * lineHeight);

      line = `${words[index]} `;

      lineCount++;

      if (lineCount >= maxLines) {
        return;
      }
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
  }
}
