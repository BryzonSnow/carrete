"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copiar",
  copiedLabel = "Copiado",
  className = "",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className={className} onClick={() => void copy()}>
      {copied ? copiedLabel : label}
    </button>
  );
}
