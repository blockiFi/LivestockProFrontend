import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import LandingBrand from "@/components/landing/ui/LandingBrand"
import { landingNavLinks } from "@/lib/landingContent"
import { useScrolled } from "@/hooks/useScrolled"
import { cn } from "@/lib/utils"

function scrollToHash(href: string) {
  if (!href.startsWith("#")) return
  const el = document.querySelector(href)
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
}

export default function LandingNav() {
  const scrolled = useScrolled()
  const [open, setOpen] = useState(false)

  const handleNavClick = (href: string) => {
    setOpen(false)
    scrollToHash(href)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300 motion-reduce:transition-none",
        scrolled
          ? "border-farm-line bg-white/90 shadow-[0_8px_24px_-16px_rgba(20,38,27,0.35)]"
          : "border-transparent bg-farm-cream/80",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="Farm Central home">
          <LandingBrand />
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] font-medium text-farm-charcoal lg:flex" aria-label="Main">
          {landingNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                handleNavClick(link.href)
              }}
              className="transition-colors hover:text-farm-green"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" className="h-10 text-[15px] font-semibold text-farm-ink hover:bg-farm-mint hover:text-farm-green">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="h-10 rounded-[10px] bg-farm-green px-4 text-[15px] font-semibold text-white hover:bg-farm-green-dark">
            <Link to="/register">Start free trial</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-farm-ink hover:bg-farm-mint lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100vw-2rem,320px)] border-farm-line bg-farm-cream font-landing text-farm-ink">
            <SheetHeader>
              <SheetTitle className="text-left text-farm-ink">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-2 flex flex-col gap-1 px-4" aria-label="Mobile">
              {landingNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick(link.href)
                  }}
                  className="rounded-lg px-3 py-3 text-base font-medium text-farm-charcoal transition-colors hover:bg-farm-mint hover:text-farm-green"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-3 px-4">
              <Button asChild variant="outline" className="h-11 w-full border-[#dcd6c8] bg-white text-farm-ink">
                <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
              </Button>
              <Button asChild className="h-11 w-full bg-farm-green text-white hover:bg-farm-green-dark">
                <Link to="/register" onClick={() => setOpen(false)}>Start free trial</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
