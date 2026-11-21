import { Link } from "react-router-dom"
import LandingBrand from "@/components/landing/ui/LandingBrand"
import { APP_COPYRIGHT } from "@/lib/brand"

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]

export default function LandingFooter() {
  return (
    <footer className="border-t border-farm-line bg-farm-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between">
        <LandingBrand />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {footerLinks.map((link) =>
            link.href.startsWith("#") ? (
              <a key={link.label} href={link.href} className="hover:text-farm-green">
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.href} className="hover:text-farm-green">
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <p>{APP_COPYRIGHT}</p>
      </div>
    </footer>
  )
}
