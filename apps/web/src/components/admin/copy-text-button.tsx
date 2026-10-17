"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function CopyTextButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={handleCopy}
      disabled={!text}
    >
      {copied ? (
        <>
          <Check className="mr-2 size-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="mr-2 size-4" />
          {label}
        </>
      )}
    </Button>
  );
}
