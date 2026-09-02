import {
  Activity,
  BarChart3,
  Bell,
  Bird,
  ClipboardList,
  DollarSign,
  Egg,
  Layers,
  Package,
  Pill,
  Shield,
  Sprout,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { APP_NAME } from "@/lib/brand"

export type NavLink = {
  label: string
  href: string
}

export const landingNavLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#contact" },
  { label: "Contact", href: "#contact" },
]

export const problemPoints = [
  "Poor record keeping across paper notes and spreadsheets",
  "Difficulty tracking livestock batches and daily performance",
  "Feed wastage and unclear consumption patterns",
  "Missed medication and vaccination schedules",
  "Inventory shortages discovered too late",
  "Poor task coordination across farm staff",
  "No real-time visibility into farm operations",
  "Difficulty measuring profitability per batch",
]

export const solutionPoints = [
  {
    title: "Centralized digital records",
    description: "Every flock, house, and daily activity logged in one secure platform.",
  },
  {
    title: "Batch-level livestock tracking",
    description: "Monitor population, mortality, weight, and production by batch in real time.",
  },
  {
    title: "Feed usage intelligence",
    description: "Track feed consumption, inventory, and formulation to reduce waste.",
  },
  {
    title: "Health program compliance",
    description: "Never miss vaccinations or medication with schedules and reminders.",
  },
  {
    title: "Smart inventory alerts",
    description: "Stay ahead of feed, vaccine, and medication stockouts.",
  },
  {
    title: "Team task management",
    description: "Assign, track, and complete farm tasks with full accountability.",
  },
  {
    title: "Live farm dashboard",
    description: "See KPIs, alerts, and trends the moment you need them.",
  },
  {
    title: "Profitability insights",
    description: "Connect sales, expenses, and production to understand true margins.",
  },
]

export type FeatureItem = {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export const featureItems: FeatureItem[] = [
  {
    icon: Bird,
    title: "Batch & Livestock Management",
    description: "Manage flocks, houses, transfers, and batch lifecycle from arrival to close-out.",
    className: "md:col-span-2",
  },
  {
    icon: Sprout,
    title: "Feed Management",
    description: "Formulate feeds, track usage, and manage feeding schedules by age and batch.",
  },
  {
    icon: Pill,
    title: "Medication & Vaccination",
    description: "Plan, record, and audit every health intervention across your operation.",
  },
  {
    icon: ClipboardList,
    title: "Task Management",
    description: "Schedule recurring farm tasks and track completion across your team.",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description: "Monitor feed, vaccine, and medication stock with low-stock alerts.",
    className: "md:col-span-2",
  },
  {
    icon: DollarSign,
    title: "Sales & Expenses",
    description: "Record flock sales, product sales, and expenditures with category tracking.",
  },
  {
    icon: BarChart3,
    title: "Farm Analytics & Reports",
    description: "Dashboards, P&L views, and exportable reports for data-driven decisions.",
    className: "md:col-span-2",
  },
  {
    icon: Wrench,
    title: "Equipment Management",
    description: "Track assets, maintenance, inspections, and equipment lifecycle.",
  },
  {
    icon: Bell,
    title: "Notifications & Reminders",
    description: "Automated alerts for health schedules, inventory, and critical farm events.",
  },
  {
    icon: Users,
    title: "Staff & User Management",
    description: "Role-based access so every team member sees only what they need.",
  },
  {
    icon: Egg,
    title: "Production Tracking",
    description: "Log eggs, weight, mortality, and daily records with batch-level accuracy.",
  },
  {
    icon: Activity,
    title: "Activity Reports",
    description: "Export operational data for audits, planning, and performance reviews.",
  },
]

export const howItWorksSteps = [
  {
    step: "01",
    title: "Create Your Farm",
    description: "Set up your farm, livestock types, batches, houses, and team members.",
  },
  {
    step: "02",
    title: "Record Your Operations",
    description: "Track feeding, medication, production, inventory, tasks, and expenses daily.",
  },
  {
    step: "03",
    title: "Monitor Performance",
    description: "View real-time dashboards and alerts to spot issues before they escalate.",
  },
  {
    step: "04",
    title: "Make Better Decisions",
    description: "Use reports and analytics to improve productivity and farm profitability.",
  },
]

export const benefitItems = [
  {
    icon: DollarSign,
    title: "Reduce operational costs",
    description: "Identify waste and inefficiencies across feed, labor, and inventory.",
  },
  {
    icon: Sprout,
    title: "Minimize feed wastage",
    description: "Match consumption to batch needs with accurate usage tracking.",
  },
  {
    icon: Shield,
    title: "Improve health tracking",
    description: "Maintain complete vaccination and medication histories per batch.",
  },
  {
    icon: ClipboardList,
    title: "Reduce record-keeping errors",
    description: "Replace scattered notes with structured, searchable digital records.",
  },
  {
    icon: Users,
    title: "Improve staff accountability",
    description: "Assign tasks and track who completed what, and when.",
  },
  {
    icon: BarChart3,
    title: "Monitor farm performance",
    description: "See mortality, production, and financial trends in one place.",
  },
  {
    icon: Layers,
    title: "Make data-driven decisions",
    description: "Base operational changes on real farm data, not guesswork.",
  },
  {
    icon: Activity,
    title: "Increase farm profitability",
    description: "Connect costs and revenue to understand true batch-level margins.",
  },
]

export type Testimonial = {
  quote: string
  name: string
  role: string
  company: string
}

export const testimonials: Testimonial[] = []

export const pricingTiers = [
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

export const dashboardPreviewKpis = [
  { label: "Active birds", value: "12,480", sub: "6 active flocks", color: "text-emerald-400" },
  { label: "Feed consumed", value: "2,840 kg", sub: "Last 30 days", color: "text-sky-400" },
  { label: "Eggs collected", value: "8,920", sub: "This week", color: "text-amber-400" },
  { label: "Mortality rate", value: "1.8%", sub: "Within target", color: "text-rose-400" },
  { label: "Revenue", value: "₦4.2M", sub: "Lifetime", color: "text-emerald-400" },
  { label: "Net profit", value: "₦1.1M", sub: "26% margin", color: "text-emerald-300" },
]

export const dashboardPreviewAlerts = [
  { title: "Newcastle vaccination due", detail: "Batch 244 · in 2 days", tag: "Vaccination" },
  { title: "Finisher feed inventory low", detail: "2 bags remaining", tag: "Inventory" },
  { title: "Task overdue: house cleaning", detail: "House B · assigned to staff", tag: "Task" },
]

export const landingHeroCopy = {
  badge: "Farm management · Livestock · Data · Profitability",
  headline: "Run your entire farm operation from one command center",
  subheadline: `${APP_NAME} helps poultry and livestock farms manage batches, feed, health, inventory, tasks, and finances — with real-time insights that drive better decisions.`,
}
