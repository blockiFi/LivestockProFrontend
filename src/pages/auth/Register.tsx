import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react"
import logo from "@/assets/farm-central-logo.png"
import { APP_NAME } from "@/lib/brand"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-toastify"
import { StoreToken } from "@/lib/request"
import axios from "@/lib/axios"

function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    acceptTerms: false,
  })

  const navigate = useNavigate()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.acceptTerms) {
      toast.error("You must accept the terms to create an account")
      return
    }
    if (formData.password !== formData.passwordConfirmation) {
      toast.error("Password and confirmation do not match")
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post("/api/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      if (response.status === 200 || response.status === 201) {
        const token = response.data?.data?.access_token ?? response.data?.data?.token
        if (token) {
          StoreToken(token)
        }
        toast.success("Account created successfully")
        navigate("/farm-selection")
      } else {
        toast.error(`Registration failed (${response.status})`)
      }
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        const errs = error.response.data.errors
        if (Array.isArray(errs)) {
          errs.forEach((msg: string) => toast.error(msg))
        } else if (typeof errs === "object") {
          Object.values(errs).forEach((arr: any) => {
            if (Array.isArray(arr)) arr.forEach((msg: string) => toast.error(msg))
          })
        }
      } else {
        toast.error("An unexpected error occurred during registration")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="mb-6 flex justify-center px-2">
              <img
                className="h-28 sm:h-32 w-auto max-w-full object-contain"
                src={logo}
                alt={APP_NAME}
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-2">
              Start managing your farms, flocks, and inventory in one place.
            </p>
          </div>

          {/* Register Form */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Sign up</CardTitle>
              <CardDescription>Enter your details to create a new account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordConfirmation">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="passwordConfirmation"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={formData.passwordConfirmation}
                      onChange={(e) => handleInputChange("passwordConfirmation", e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-muted-foreground"
                      onClick={() => setShowConfirm((prev) => !prev)}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(val) => handleInputChange("acceptTerms", Boolean(val))}
                  />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-snug">
                    I agree to the{" "}
                    <Link to="/terms" className="font-semibold text-emerald-700 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="font-semibold text-emerald-700 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-emerald-700 hover:underline">
                  Sign in instead
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Illustration / Marketing */}
      <div className="hidden flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 md:flex items-center justify-center p-10">
        <div className="max-w-md space-y-6">
          <h2 className="text-2xl font-semibold">
            Designed for modern poultry & livestock operations
          </h2>
          <p className="text-sm text-slate-300">
            Track flock performance, automate feed and health schedules, and get a unified view of
            your farm’s KPIs. {APP_NAME} helps you make better decisions, faster.
          </p>
          <ul className="space-y-3 text-sm text-slate-200">
            <li>• Smart dashboards across flocks, feed, and health</li>
            <li>• AI-assisted feed formulation and component analysis</li>
            <li>• Integrated inventory and schedule notifications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Register

