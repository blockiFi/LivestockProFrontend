import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"
import ContactSection from "@/components/landing/ContactSection"
import HeroSection from "@/components/landing/sections/HeroSection"
import ProblemSolutionSection from "@/components/landing/sections/ProblemSolutionSection"
import FeaturesSection from "@/components/landing/sections/FeaturesSection"
import DashboardShowcaseSection from "@/components/landing/sections/DashboardShowcaseSection"
import HowItWorksSection from "@/components/landing/sections/HowItWorksSection"
import BenefitsSection from "@/components/landing/sections/BenefitsSection"
import TestimonialsSection from "@/components/landing/sections/TestimonialsSection"
import PricingSection from "@/components/landing/sections/PricingSection"
import FinalCtaSection from "@/components/landing/sections/FinalCtaSection"

export default function Landing() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-950 text-slate-50">
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <DashboardShowcaseSection />
        <HowItWorksSection />
        <BenefitsSection />
        <TestimonialsSection />
        <PricingSection />
        <ContactSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
