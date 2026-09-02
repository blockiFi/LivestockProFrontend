import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import Logo from "@/components/navigation/Logo"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/brand"

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-4 text-sm text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-slate-300">
          <p>
            By using {APP_NAME}, you agree to these Terms of Service. Please read them carefully
            before creating an account or using the platform.
          </p>
          <section>
            <h2 className="text-lg font-semibold text-white">Use of the service</h2>
            <p className="mt-2">
              You may use the platform to manage your farm operations in accordance with applicable
              laws. You are responsible for the accuracy of data you enter and for maintaining the
              security of your account credentials.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Subscriptions and billing</h2>
            <p className="mt-2">
              Paid plans are billed per farm on a monthly basis. Trial terms and cancellation
              policies are described at signup and in your account billing settings.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Limitation of liability</h2>
            <p className="mt-2">
              The platform is provided as-is. We are not liable for decisions made based on data
              entered or reports generated within the system. Always verify critical operational
              decisions independently.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="mt-2">
              Questions about these terms? Contact{" "}
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
