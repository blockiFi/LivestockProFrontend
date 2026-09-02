import heroLocal from "@/assets/livestockpro1.png"
import problemLocal from "@/assets/chicken.png"
import benefitsLocal from "@/assets/livestockpro.png"
import featuresLocal from "@/assets/chicken.png"
import showcaseLocal from "@/assets/livestockpro1.png"

export type LandingImageConfig = {
  /** Preferred image (bundled asset or /public path) */
  src: string
  /** Fallback if src fails to load */
  fallback: string
  alt: string
}

/**
 * Image map for the landing page.
 * To swap images: replace files in public/landing/ or update imports below.
 */
export const landingImages = {
  hero: {
    src: "/landing/hero.jpg",
    fallback: heroLocal,
    alt: "Modern poultry farm with healthy chickens in a well-managed facility",
  },
  problem: {
    src: "/landing/problem.jpg",
    fallback: problemLocal,
    alt: "Healthy poultry in a modern farm environment",
  },
  features: {
    src: "/landing/features.jpg",
    fallback: featuresLocal,
    alt: "Organized poultry farming operations",
  },
  showcase: {
    src: "/landing/showcase.jpg",
    fallback: showcaseLocal,
    alt: "Livestock farm management operations",
  },
  benefits: {
    src: "/landing/benefits.jpg",
    fallback: benefitsLocal,
    alt: "Modern agricultural and livestock production",
  },
} as const satisfies Record<string, LandingImageConfig>
