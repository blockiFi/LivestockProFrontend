import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu } from "lucide-react"
import Logo from "@/components/navigation/Logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
        "sticky top-0 z-50 w-full border-b transition-all duration-300 motion-reduce:transition-none",
        scrolled
          ? "border-slate-800/80 bg-slate-950/95 shadow-lg shadow-black/20 backdrop-blur-md"
          : "border-transparent bg-slate-950/60 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="shrink-0" aria-label="Farm Central home">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex" aria-label="Main">
          {landingNavLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                handleNavClick(link.href)
              }}
              className="transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-900 hover:text-white">
              Log in
            </Button>
          </Link>
          <Link to="/register">
            <Button
              size="sm"
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-green-500 hover:to-emerald-600"
            >
              Get Started
            </Button>
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-300 hover:bg-slate-900 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-slate-800 bg-slate-950 text-slate-100 w-[min(100vw-2rem,320px)]">
            <SheetHeader>
              <SheetTitle className="text-left text-white">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
              {landingNavLinks.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick(link.href)
                  }}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-3">
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full border-slate-700 bg-transparent text-slate-100">
                  Log in
                </Button>
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
