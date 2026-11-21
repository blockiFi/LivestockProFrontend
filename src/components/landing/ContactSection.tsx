import { type FormEvent, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { APP_BILLING_EMAIL } from "@/lib/brand"

const fieldClass =
  "w-full rounded-[10px] border border-[#3a5c46] bg-farm-ink px-3.5 py-3 text-base text-white placeholder:text-[#8fae9b] focus:border-[#9fd3b2] focus:outline-none focus:ring-2 focus:ring-[#9fd3b2]/30"

/** Closing call to action plus the contact form, on the page's one dark band. */
export default function ContactSection() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [farmName, setFarmName] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Farm Central enquiry — ${farmName || name}`)
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nFarm: ${farmName}\n\n${message}`)
    window.location.href = `mailto:${APP_BILLING_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <section id="contact" className="scroll-mt-16 bg-farm-ink text-white">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
            Get your farm out of the notebook
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[#bfd3c6]">
            Start free for 14 days. Set up takes an afternoon, and your team can start recording tomorrow.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex h-[52px] items-center gap-2 rounded-xl bg-farm-orange px-6 text-base font-extrabold text-[#1f1300] transition-colors hover:bg-[#f6a043] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-farm-orange/40"
          >
            Start free trial
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-[#2c4a37] bg-[#1d3526] p-6 sm:p-7"
        >
          <h3 className="text-lg font-bold">Questions? Send us a message</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-[#cfe0d5]">
              Your name
              <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-[#cfe0d5]">
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={fieldClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm text-[#cfe0d5]">
            Farm name
            <input value={farmName} onChange={(e) => setFarmName(e.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-[#cfe0d5]">
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className={`${fieldClass} resize-y`}
              placeholder="Tell us about your farm and what you'd like to know"
            />
          </label>
          <button
            type="submit"
            className="mt-1 h-12 rounded-xl bg-white text-[15px] font-extrabold text-farm-ink transition-colors hover:bg-farm-mint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            Send message
          </button>
          <p className="text-center text-xs text-[#a9c4b3]">Opens your email app with the message filled in.</p>
        </form>
      </div>
    </section>
  )
}
