"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { PROPERTY_IMAGE_FALLBACK } from "@/lib/property-images";

export function PropertyImage({
  src,
  alt,
  className,
  ...props
}: Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
}) {
  const fallback = PROPERTY_IMAGE_FALLBACK;
  const requestedSrc = src || fallback;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentSrc = failedSrc === requestedSrc ? fallback : requestedSrc;

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      unoptimized={currentSrc.startsWith("data:")}
      onError={() => {
        if (requestedSrc !== fallback) setFailedSrc(requestedSrc);
      }}
    />
  );
}
