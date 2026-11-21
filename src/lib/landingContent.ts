import {
  BarChart3,
  ClipboardList,
  HeartPulse,
  type LucideIcon,
} from "lucide-react"

export type NavLink = {
  label: string
  href: string
}

export const landingNavLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
]

export const landingHeroCopy = {
  badge: "For poultry and livestock farms",
  headline: "Run your whole farm from one place",
  subheadline:
    "Batches, feed, health schedules, inventory, staff tasks and money, recorded daily and turned into clear reports. On your phone or laptop.",
}

export const trustPoints = [
  "Layers, broilers and other livestock",
  "Priced in naira, per farm",
  "Works on phone and laptop",
  "Role-based staff access",
]

export type Outcome = {
  icon: LucideIcon
  title: string
  before: string
  after: string
}

export const outcomes: Outcome[] = [
  {
    icon: ClipboardList,
    title: "Records",
    before: "Daily counts scattered across notes and phones",
    after: "Every batch, house and day logged in one place, searchable by anyone on the team.",
  },
  {
    icon: HeartPulse,
    title: "Health",
    before: "Vaccinations and medication missed or forgotten",
    after: "Schedules per batch with reminders, and a full history of every treatment.",
  },
  {
    icon: BarChart3,
    title: "Money",
    before: "No idea which batch actually made a profit",
    after: "Sales, feed and expenses tied to each batch, so you see real margins.",
  },
]

export type FeatureDeepDive = {
  id: "production" | "health" | "inventory" | "finance"
  title: string
  description: string
  points: string[]
}

export const featureDeepDives: FeatureDeepDive[] = [
  {
    id: "production",
    title: "Flocks and egg production",
    description:
      "Track every batch from arrival to sale: population, mortality, weight and transfers. Record eggs by cell and collection round, so you know exactly which part of a house is under-laying.",
    points: [
      "Cell-based egg collection with rounds",
      "Daily mortality and weight logs",
      "House layouts and batch transfers",
    ],
  },
  {
    id: "health",
    title: "Feed and health schedules",
    description:
      "Plan feeding by age and batch, formulate your own feeds, and never miss a vaccination. Reminders reach the right staff member before the due date.",
    points: [
      "Recurring vaccination and medication plans",
      "Feed usage per batch to cut waste",
      "Import schedules from documents (Premium AI)",
    ],
  },
  {
    id: "inventory",
    title: "Inventory and staff tasks",
    description:
      "Know what feed, vaccines and drugs you have before you run out. Assign daily tasks to staff and see who did what, and when.",
    points: [
      "Low-stock alerts",
      "Recurring tasks with completion tracking",
      "Each role sees only what it needs",
    ],
  },
  {
    id: "finance",
    title: "Sales, expenses and profit",
    description:
      "Record flock and product sales, track every expense by category, and get profit and loss per batch. Export reports for your bank, partners or accountant.",
    points: [
      "Profit and loss per batch",
      "Customer records and sales history",
      "Excel export for any table",
    ],
  },
]

export const extraModules = [
  "Equipment and maintenance",
  "Staff and roles",
  "Notifications",
  "Multiple farms",
  "Activity reports",
]

export const howItWorksSteps = [
  {
    title: "Set up your farm",
    description: "Add houses, batches, livestock types and your team.",
  },
  {
    title: "Record daily work",
    description: "Staff log eggs, feed, health and tasks from their phones.",
  },
  {
    title: "See how you're doing",
    description: "Dashboards and alerts show problems before they cost you.",
  },
]

export type Testimonial = {
  quote: string
  name: string
  role: string
  company: string
}

/** Add real customer quotes here; the section stays hidden while this is empty. */
export const testimonials: Testimonial[] = []

export const pricingTiers = [
  {
    name: "Basic",
    tagline: "One farmer, one batch at a time.",
    price: "5,000",
    highlight: false,
    points: [
      "1 user account",
      "1 active batch",
      "Flock, feed, health and sales records",
      "Schedules, tasks and alerts",
    ],
  },
  {
    name: "Standard",
    tagline: "Growing farms with a team.",
    price: "10,000",
    highlight: false,
    points: [
      "Unlimited team members",
      "Unlimited active batches",
      "Role-based access",
      "Everything in Basic",
    ],
  },
  {
    name: "Premium",
    tagline: "AI working alongside your team.",
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

export const faqItems = [
  {
    question: "How does the free trial work?",
    answer:
      "You get 14 days of full access with no card needed. Pick a plan when it ends, or simply stop.",
  },
  {
    question: "Can my farm staff use it on their phones?",
    answer:
      "Yes. It runs in the browser on any phone or laptop, and each staff member only sees what their role allows.",
  },
  {
    question: "Which animals does it support?",
    answer:
      "Poultry is fully supported, including layers, broilers and dual-purpose birds. You can also set up your own livestock types for the other animals on your farm.",
  },
  {
    question: "Can I run more than one farm?",
    answer: "Yes. You can add several farms to one account and switch between them.",
  },
  {
    question: "Can I change plans or cancel?",
    answer: "Yes, any time. There are no long-term contracts or hidden fees.",
  },
]
