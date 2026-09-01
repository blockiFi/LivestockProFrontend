import { Link } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Leaf,
  Monitor,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Activity,
  Bell,
} from "lucide-react"

import logo from "../assets/livestockpro1.png"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"

const Landing = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950 text-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-400 to-emerald-500">
              <img src={logo} className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">LiveStockPro</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#platform" className="hover:text-white">
              Platform
            </a>
            <a href="#workflows" className="hover:text-white">
              Workflows
            </a>
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                Log in
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-green-500 hover:to-emerald-600"
              >
                Sign up free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + app overview */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-20 md:flex-row md:items-center md:py-24">
          {/* Hero copy */}
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-900/60 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI-assisted livestock & poultry operations
            </div>
            <div>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Run smarter, healthier
                <br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  livestock operations
                </span>
              </h1>
              <p className="mt-4 text-balance text-base text-slate-300 sm:text-lg">
                LiveStockPro combines precise flock management, AI feed formulation, and real-time
                health notifications into a single professional platform for poultry and livestock
                farms of any size.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-green-500 hover:to-emerald-600"
                >
                  Get started in minutes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-slate-700 bg-slate-900/60 text-base text-slate-100 hover:bg-slate-900"
                >
                  View my dashboard
                  <Monitor className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Quick metrics */}
            <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
              <div>
                <div className="text-xl font-semibold text-white">Realtime</div>
                <p className="mt-1 text-xs text-slate-400">
                  Live flock health, feed usage, and inventory insights.
                </p>
              </div>
              <div>
                <div className="text-xl font-semibold text-white">AI formulas</div>
                <p className="mt-1 text-xs text-slate-400">
                  Formulate balanced feeds based on targets and components.
                </p>
              </div>
              <div>
                <div className="text-xl font-semibold text-white">Compliance</div>
                <p className="mt-1 text-xs text-slate-400">
                  Centralize vaccination and medication schedules by flock.
                </p>
              </div>
            </div>
          </div>

          {/* App preview / quick links */}
          <div
            id="platform"
            className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-emerald-500/10 backdrop-blur"
          >
            <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Activity className="h-3 w-3 text-emerald-400" />
                Live operations snapshot
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                Demo view
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <DashboardCard
                  title="Poultry overview"
                  description="Active flocks, mortality rate, production."
                  to="/dashboard/poultry"
                />
                <DashboardCard
                  title="Feed formulation (AI)"
                  description="Design balanced feeds by profile or components."
                  to="/dashboard/poultry/feed/formulation"
                />
                <DashboardCard
                  title="Flock health"
                  description="Vaccination & medication schedules per batch."
                  to="/dashboard/poultry/health/vaccinations"
                />
                <DashboardCard
                  title="Inventory & alerts"
                  description="Low stock warnings across meds, vaccines & feed."
                  to="/dashboard/poultry/inventory/feeds"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Bell className="h-3.5 w-3.5 text-emerald-400" />
                    Upcoming notifications
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    Sample
                  </span>
                </div>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">
                        Newcastle vaccination for Batch 244
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Due in 2 days · Age-based schedule reminder
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-amber-300">
                      Vaccination
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">
                        Finisher feed inventory low
                      </p>
                      <p className="text-[11px] text-slate-400">
                        2 bags remaining · reorder recommended
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-red-300">
                      Inventory
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">
                        New AI feed formula suggestion
                      </p>
                      <p className="text-[11px] text-slate-400">
                        For Broiler Finisher · CP 22.5% · ME 3100 kcal/kg
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-300">
                      AI
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Background accents */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        </div>
      </section>

      {/* Workflow section */}
      <section
        id="workflows"
        className="border-t border-slate-800 bg-slate-950 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              From scattered records to one connected workflow
            </h2>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              LiveStockPro guides you from onboarding flocks to optimizing feed and monitoring
              performance with a clear, repeatable process.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <WorkflowStep
              step="01"
              title="Set up farm & flocks"
              description="Create farms, houses, and batches with arrival age, population, and production targets."
            />
            <WorkflowStep
              step="02"
              title="Configure health & feed"
              description="Apply medication and vaccination templates, then formulate balanced feeds with AI support."
            />
            <WorkflowStep
              step="03"
              title="Monitor, adjust, grow"
              description="Track performance metrics, respond to alerts, and refine formulas based on real outcomes."
            />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section
        id="features"
        className="border-t border-slate-800 bg-slate-900 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Everything you need to manage modern livestock operations
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Purpose-built modules for poultry and livestock backed by AI-assisted decision
                support—no generic spreadsheets or retrofitted software.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="relative overflow-hidden border-slate-800 bg-slate-950/70 backdrop-blur"
              >
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-sky-500/10">
                    <feature.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    {feature.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-2">
                        <CheckCircle className="mt-[2px] h-3.5 w-3.5 text-emerald-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-slate-800 bg-slate-950 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Simple pricing, billed per farm
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
              Every plan starts with a 14-day free trial. Change or cancel at any time — no hidden
              fees and no long-term contracts.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <Card
                key={tier.name}
                className={`border-slate-800 bg-slate-900/60 ${
                  tier.highlight ? "ring-2 ring-emerald-400" : ""
                }`}
              >
                <CardContent className="p-6">
                  {tier.highlight && (
                    <span className="mb-3 inline-block rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Most complete
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{tier.tagline}</p>
                  <p className="mt-4">
                    <span className="text-3xl font-bold text-white">₦{tier.price}</span>
                    <span className="text-sm text-slate-400"> /month per farm</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-300">
                    {tier.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="mt-6 block">
                    <Button
                      className={`w-full rounded-xl ${
                        tier.highlight
                          ? "bg-gradient-to-r from-green-400 to-emerald-500 text-emerald-950"
                          : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                      }`}
                    >
                      Start free trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            No credit card required to start · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-400 to-emerald-500">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">
                  LiveStockPro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modern livestock and poultry management platform for farms that treat
                operations like a business.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Product</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#workflows" className="hover:text-white">
                    Workflows
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Company</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Support</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="#" className="hover:text-white">
                    Help center
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-900 pt-6 text-center text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} LiveStockPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
    
type DashboardCardProps = {
  title: string
  description: string
  to: string
}

const DashboardCard = ({ title, description, to }: DashboardCardProps) => {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition hover:border-emerald-500/60 hover:bg-slate-900"
    >
      <div className="mb-1 text-xs font-medium text-slate-300 group-hover:text-emerald-300">
        {title}
      </div>
      <p className="text-[11px] text-slate-400">{description}</p>
    </Link>
  )
}

type WorkflowStepProps = {
  step: string
  title: string
  description: string
}

const WorkflowStep = ({ step, title, description }: WorkflowStepProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
      <div className="mb-4 inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
        <span className="mr-2 text-slate-500">{step}</span>
        <span className="h-1 w-1 rounded-full bg-emerald-400" />
        <span className="ml-2 text-slate-200">Key step</span>
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-xs text-slate-300">{description}</p>
    </div>
  )
}

const PRICING_TIERS = [
  {
    name: "Basic",
    tagline: "For a single farmer running one batch at a time.",
    price: "5,000",
    highlight: false,
    points: [
      "1 user account",
      "1 active batch at a time",
      "Flock, feed, health, and sales records",
      "Schedules, tasks, and alerts",
    ],
  },
  {
    name: "Standard",
    tagline: "For growing farms with a team and several batches.",
    price: "10,000",
    highlight: false,
    points: [
      "Unlimited team members",
      "Unlimited active batches",
      "Role-based access control",
      "Everything in Basic",
    ],
  },
  {
    name: "Premium",
    tagline: "For farms that want AI working alongside the team.",
    price: "15,000",
    highlight: true,
    points: [
      "Everything in Standard",
      "AI feed formulation and analysis",
      "AI flock performance insights",
      "AI schedule import from documents",
    ],
  },
]

const features = [
      {
        icon: Users,
        title: "Multi-Farm Management",
        description: "Manage multiple farms from a single dashboard with role-based access control.",
        points: ["Unlimited farms", "Team collaboration", "Role permissions", "Cross-farm analytics"],
      },
      {
        icon: BarChart3,
        title: "Livestock Tracking",
        description: "Complete livestock management for poultry, piggery, and fishery operations.",
        points: ["Individual animal profiles", "Health monitoring", "Breeding records", "Growth tracking"],
      },
      {
        icon: TrendingUp,
        title: "Production Analytics",
        description: "Real-time insights and analytics to optimize your farm's productivity.",
        points: ["Performance metrics", "Trend analysis", "Predictive insights", "Custom reports"],
      },
      {
        icon: Shield,
        title: "Health Management",
        description: "Comprehensive health monitoring and veterinary record keeping.",
        points: ["Vaccination schedules", "Disease tracking", "Medication records", "Health alerts"],
      },
      {
        icon: Monitor,
        title: "Inventory Control",
        description: "Smart inventory management for feed, supplies, and equipment.",
        points: ["Stock tracking", "Auto-reordering", "Supplier management", "Cost analysis"],
      },
      {
        icon: Smartphone,
        title: "Mobile Access",
        description: "Access your farm data anywhere with our responsive mobile interface.",
        points: ["Mobile optimized", "Offline support", "Real-time sync", "Push notifications"],
      },
    ]
    
export default Landing
