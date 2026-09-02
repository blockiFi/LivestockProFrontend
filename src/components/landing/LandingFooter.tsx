import { Link } from "react-router-dom"
import Logo from "@/components/navigation/Logo"
import { APP_COPYRIGHT, APP_TAGLINE } from "@/lib/brand"

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Dashboard", href: "#showcase" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Poultry farms", href: "#solutions" },
      { label: "Livestock operations", href: "#solutions" },
      { label: "Multi-farm management", href: "#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Contact", href: "#contact" },
      { label: "Book a demo", href: "#contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "#contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
]

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo size="sm" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {APP_TAGLINE} — modern livestock and poultry management for farms that treat operations
              like a business.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold text-white">{col.title}</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {col.links.map((link) => (
                  <li key={col.title + link.label}>
                    {link.href.startsWith("#") ? (
                      <a href={link.href} className="transition-colors hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-900 pt-6 text-center text-xs text-slate-500">
          <p>{APP_COPYRIGHT}</p>
        </div>
      </div>
    </footer>
  )
}
