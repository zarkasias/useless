"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { toast } from "sonner";
import {
  createShareFile,
  getShareCaption,
  type ShareImageInput,
} from "@/lib/share-image";

type ShareStatus = "idle" | "preparing" | "ready" | "failed";

const DOWNLOAD_URL_LIFETIME_MS = 10000;

// Grids can bring many cards into view at once, so images render one at a time.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job);

  queue = run.catch(() => undefined);

  return run;
}

let probeFile: File | undefined;

function getCanShareFiles() {
  if (!navigator.share || !navigator.canShare) return false;

  probeFile ??= new File([""], "achievement.png", { type: "image/png" });

  return navigator.canShare({ files: [probeFile] });
}

// Browser support never changes during a visit, so there is nothing to observe.
const subscribeToNothing = () => () => {};

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
}

// For browsers without file sharing, such as desktop Firefox.
async function saveAndCopy(file: File, caption: string) {
  downloadFile(file);

  try {
    await navigator.clipboard.writeText(caption);
    toast.success("Image saved and caption copied", {
      description: "Paste the caption when you post your image.",
    });
  } catch (error) {
    console.error("Could not copy share caption:", error);
    toast.success("Image saved", {
      description: "Add it to your post with your own caption.",
    });
  }
}

interface UseAchievementShareOptions {
  input: ShareImageInput;
  enabled: boolean;
  /** Wait until the card is near the viewport before rendering its image. */
  waitForVisible: boolean;
  targetRef: RefObject<HTMLElement | null>;
}

export function useAchievementShare({
  input,
  enabled,
  waitForVisible,
  targetRef,
}: UseAchievementShareOptions) {
  const { title, description, type, emoji, iconUrl } = input;
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [isSharing, setIsSharing] = useState(false);
  const canShareFiles = useSyncExternalStore(
    subscribeToNothing,
    getCanShareFiles,
    () => true,
  );

  const createFile = useCallback(
    () => createShareFile({ title, description, type, emoji, iconUrl }),
    [title, description, type, emoji, iconUrl],
  );

  useEffect(() => {
    setFile(null);
    setStatus("idle");

    if (!enabled) return;

    let cancelled = false;

    const start = () => {
      setStatus("preparing");

      enqueue(async () => (cancelled ? null : createFile()))
        .then((created) => {
          if (cancelled || !created) return;

          setFile(created);
          setStatus("ready");
        })
        .catch((error: unknown) => {
          console.error("Error generating share image:", error);

          if (!cancelled) setStatus("failed");
        });
    };

    const target = targetRef.current;

    if (!waitForVisible || !target || !("IntersectionObserver" in window)) {
      start();

      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        observer.disconnect();
        start();
      },
      { rootMargin: "200px" },
    );

    observer.observe(target);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [createFile, enabled, targetRef, waitForVisible]);

  const retry = () => {
    setStatus("preparing");

    enqueue(createFile)
      .then((created) => {
        setFile(created);
        setStatus("ready");
        // iOS only opens the share sheet from a tap, so this needs a new one.
        toast.success("Your image is ready", {
          description: "Tap the button again to continue.",
        });
      })
      .catch((error: unknown) => {
        console.error("Error generating share image:", error);
        setStatus("failed");
        toast.error("Couldn't prepare your image", {
          description: "Please try again.",
        });
      });
  };

  // Keep this free of awaits before navigator.share. Safari only opens the
  // share sheet while it is still handling the user's tap.
  const share = () => {
    if (!file) {
      if (status === "failed") retry();
      return;
    }

    const caption = getShareCaption(title);
    const shareData: ShareData = { files: [file], text: caption };

    if (!navigator.share || !navigator.canShare?.(shareData)) {
      void saveAndCopy(file, caption);
      return;
    }

    setIsSharing(true);

    navigator
      .share(shareData)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Error sharing achievement:", error);

        return saveAndCopy(file, caption);
      })
      .finally(() => setIsSharing(false));
  };

  return {
    share,
    canShareFiles,
    isBusy: status === "preparing" || isSharing,
    canTapShare: enabled && !isSharing && (status === "ready" || status === "failed"),
  };
}
