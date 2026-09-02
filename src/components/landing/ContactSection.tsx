import { type FormEvent, useState } from "react"
import { Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { APP_BILLING_EMAIL } from "@/lib/brand"

export default function ContactSection() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [farmName, setFarmName] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Farm Central demo request — ${farmName || name}`)
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nFarm: ${farmName}\n\n${message}`,
    )
    window.location.href = `mailto:${APP_BILLING_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <SectionShell id="contact" className="border-t border-slate-800 bg-slate-900">
      <div className="grid gap-12 lg:grid-cols-2">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Contact"
            title="Book a demo or get in touch"
            description="Tell us about your farm and we'll help you see how Farm Central fits your operation. We'll respond via email."
          />
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
            <Mail className="h-5 w-5 text-emerald-400" />
            <a href={`mailto:${APP_BILLING_EMAIL}`} className="hover:text-white hover:underline">
              {APP_BILLING_EMAIL}
            </a>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayMs={100}>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name" className="text-slate-300">
                  Your name
                </Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-slate-700 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-slate-700 bg-slate-900 text-white"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="contact-farm" className="text-slate-300">
                Farm name
              </Label>
              <Input
                id="contact-farm"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="border-slate-700 bg-slate-900 text-white"
              />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="contact-message" className="text-slate-300">
                Message
              </Label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="flex w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                placeholder="Tell us about your farm and what you'd like to see in a demo..."
              />
            </div>
            <Button
              type="submit"
              className="mt-6 w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600"
            >
              <Send className="h-4 w-4" />
              Send message
            </Button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Opens your email client with a pre-filled message to our team.
            </p>
          </form>
        </RevealOnScroll>
      </div>
    </SectionShell>
  )
}
