import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import Logo from "@/components/navigation/Logo"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/brand"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-slate-300">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-slate-300">
          <p>
            {APP_NAME} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
            This policy describes how we collect, use, and safeguard information when you use our farm
            management platform.
          </p>
          <section>
            <h2 className="text-lg font-semibold text-white">Information we collect</h2>
            <p className="mt-2">
              We collect account information (name, email), farm operational data you enter into the
              platform, and usage data necessary to provide and improve the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">How we use your information</h2>
            <p className="mt-2">
              Your data is used to operate the platform, provide support, improve features, and
              communicate service-related updates. We do not sell your personal information.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Data security</h2>
            <p className="mt-2">
              We implement appropriate technical and organizational measures to protect your data.
              Access is restricted to authorized personnel and secured connections.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="mt-2">
              For privacy-related questions, contact us at{" "}
              <a href="mailto:billing@farmcentral.com" className="text-emerald-400 hover:underline">
                billing@farmcentral.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
