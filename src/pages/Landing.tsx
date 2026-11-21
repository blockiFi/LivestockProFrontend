import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"
import ContactSection from "@/components/landing/ContactSection"
import HeroSection from "@/components/landing/sections/HeroSection"
import TrustStrip from "@/components/landing/sections/TrustStrip"
import OutcomesSection from "@/components/landing/sections/OutcomesSection"
import FeaturesSection from "@/components/landing/sections/FeaturesSection"
import HowItWorksSection from "@/components/landing/sections/HowItWorksSection"
import TestimonialsSection from "@/components/landing/sections/TestimonialsSection"
import PricingSection from "@/components/landing/sections/PricingSection"
import FaqSection from "@/components/landing/sections/FaqSection"

export default function Landing() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-farm-cream font-landing text-[#1f2328] antialiased">
      <LandingNav />
      <main>
        <HeroSection />
        <TrustStrip />
        <OutcomesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  )
}
