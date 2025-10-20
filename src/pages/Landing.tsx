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
  Play,
  ChevronDown,
} from "lucide-react"

import logo from "../assets/livestockpro1.png"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"

const Landing = () => {
    return (
        <div className="flex min-h-screen w-full flex-col bg-slate-900 px-3">
          {/* Navigation */}
          <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
            <div className=" flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-400 to-emerald-500">
                  <img src={logo} className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">LiveStockPro</span>
              </div>
    
              <nav className="hidden md:flex items-center gap-8">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Platform <ChevronDown className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Solutions <ChevronDown className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Templates <ChevronDown className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
                  Resources <ChevronDown className="h-4 w-4" />
                </div>
                <Link to="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </nav>
    
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                    Log in
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white border-0"
                  >
                    Sign Up Free →
                  </Button>
                </Link>
              </div>
            </div>
          </header>
    
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className=" px-4 py-24 md:py-32">
              <div className="mx-auto max-w-4xl text-center">
                <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
                  Powerful Farm Management
                  <br />
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    That Converts
                  </span>
                </h1>
                <p className="mx-auto mt-8 max-w-2xl text-lg text-slate-300 sm:text-xl">
                  Launch high-converting farm operations faster, generate qualified livestock data, and optimize your
                  agricultural efforts—all with one simple solution.
                </p>
    
                {/* Email Capture Form */}
                <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center max-w-md mx-auto">
                  <div className="relative flex-1">
                    <Input
                      type="email"
                      placeholder="Work email"
                      className="h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 rounded-lg"
                    />
                  </div>
                  <Button
                    size="lg"
                    className="h-12 px-8 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white border-0 rounded-lg font-semibold"
                  >
                    Start my trial →
                  </Button>
                </div>
              </div>
    
              {/* Product Mockup */}
              <div className="mt-20 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 blur-3xl rounded-full" />
                <div className="relative mx-auto max-w-5xl">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur">
                    <img src="https://sjc.microlink.io/aaw3zV5k-Nnih_AXHaBPUon-PJcdRy-iCHdTMHXK4KGf7AeNjRIv9ENtk2Of3d_ZJspYa9rNnKOXDhFK_JpeyA.jpeg" alt="LiveStockPro Dashboard" className="w-full h-auto" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
    
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-green-400/10 to-emerald-500/10 blur-3xl" />
              <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-blue-400/10 to-purple-500/10 blur-3xl" />
            </div>
          </section>
    
          {/* Features Section */}
          <section className="py-24 bg-slate-800">
            <div className=" px-4">
              <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Everything you need to manage your farm
                </h2>
                <p className="mt-4 text-lg text-slate-300">
                  Comprehensive tools designed specifically for modern agricultural operations
                </p>
              </div>
    
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                  <Card key={index} className="relative overflow-hidden border-slate-700 bg-slate-900/50 backdrop-blur">
                    <CardContent className="p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-green-400/10 to-emerald-500/10 border border-green-400/20">
                        <feature.icon className="h-6 w-6 text-green-400" />
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                      <p className="mt-2 text-slate-300">{feature.description}</p>
                      <ul className="mt-4 space-y-2">
                        {feature.points.map((point, pointIndex) => (
                          <li key={pointIndex} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
    
          {/* CTA Section */}
          <section className="bg-gradient-to-r from-green-400 to-emerald-500 py-16">
            <div className=" px-4 text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to transform your farm management?</h2>
              <p className="mt-4 text-lg text-green-50">
                Join thousands of farmers who have already modernized their operations
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link to="/auth/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto bg-white text-green-600 hover:bg-green-50"
                  >
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/20 text-green-400 hover:bg-white/10"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </section>
    
          {/* Footer */}
          <footer className="border-t border-slate-800 bg-slate-900">
            <div className=" px-4 py-12">
              <div className="grid gap-8 md:grid-cols-4">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-400 to-emerald-500">
                      <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">LiveStockPro</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Modern farm management platform designed for the future of agriculture.
                  </p>
                </div>
    
                <div>
                  <h3 className="font-semibold mb-4 text-white">Product</h3>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li>
                      <Link to="#" className="hover:text-white transition-colors">
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="hover:text-white transition-colors">
                        Pricing
                      </Link>
                    </li>
                  </ul>
                </div>
    
                <div>
                  <h3 className="font-semibold mb-4 text-white">Company</h3>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li>
                      <Link to="#" className="hover:text-white transition-colors">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="hover:text-white transition-colors">
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>
    
                <div>
                  <h3 className="font-semibold mb-4 text-white">Support</h3>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li>
                      <Link to="#" className="hover:text-white transition-colors">
                        Help Center
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="hover:text-white transition-colors">
                        Documentation
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
    
              <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
                <p>&copy; 2024 LiveStockPro. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      )
    }
    
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
