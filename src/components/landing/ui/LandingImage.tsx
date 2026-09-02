import { useState } from "react"
import { cn } from "@/lib/utils"
import type { LandingImageConfig } from "@/lib/landingImages"

type Props = {
  image: LandingImageConfig
  className?: string
  priority?: boolean
  sizes?: string
}

export default function LandingImage({
  image,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: Props) {
  const [src, setSrc] = useState(image.src)

  return (
    <img
      src={src}
      alt={image.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      sizes={sizes}
      onError={() => {
        if (src !== image.fallback) setSrc(image.fallback)
      }}
      className={cn("h-full w-full object-cover", className)}
    />
  )
}
