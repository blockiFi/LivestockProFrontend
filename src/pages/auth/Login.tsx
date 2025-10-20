import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react"
import logo from "@/assets/livestockpro1.png"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'react-toastify';
import type { AuthResponse } from "@/lib/types"
import { StoreToken, UserLogin } from "@/lib/request"
function Login() {
    const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const navigate = useNavigate()
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
    
        // Simulate API call
       
          if (formData.email && formData.password) {

            const response = await UserLogin({email : formData.email , password : formData.password})
            console.log("Full response:", response);
            if(response.success){
                console.log(response.data);
            if (response.data && response) {
                console.log("User token:", response.token);
               if(response.token){
                StoreToken(response.token);
                toast.success(`Login Succesfully`);
                navigate("/farm-selection");
               }else{
                toast.error(`Error Getting Login Token`);
               }
            }else{
                toast.error(`Error Occured While Signing In`);
            }
            

            }else{
                response.error ? 
                response.error.map((error :string) => toast.error(error)) : 
                toast.error(`Error Occured While Signing In`);

                
            }
            // navigate("/")
          } else {
            toast.error(`Please Enter Valid Login Credentials`);
           
          }
          setIsLoading(false)
       
      }
    
      const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
      }
    
      return (
        <div className="min-h-screen flex">
          {/* Left Side - Form */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8">
              {/* Header */}
              <div className="text-center">
                <Link
                  to="/landing"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Link>
    
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-200">
                    <img  className="h-5 w-5" src={logo}  />
                  </div>
                  <span className="text-2xl font-bold">LiveStockPro</span>
                </div>
    
                <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground mt-2">Sign in to your account to continue managing your farms</p>
              </div>
    
              {/* Login Form */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-xl">Sign in</CardTitle>
                  <CardDescription>Enter your email and password to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={formData.rememberMe}
                          onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                        />
                        <Label htmlFor="remember" className="text-sm">
                          Remember me
                        </Label>
                      </div>
                      <Link to="/auth/forgot-password" className="text-sm text-primary-400 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
    
                    <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-300" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
    
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/auth/register" className="text-primary-400 hover:underline">
                      Sign up for free
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
    
          {/* Right Side - Image/Branding */}
          <div className="hidden lg:flex lg:flex-1 lg:relative lg:bg-gradient-to-br lg:from-[#22c55e1A] lg:to-[#0ea5e91A]">
            <div className="flex flex-col justify-center px-12">
              <div className="max-w-md">
                <h2 className="text-3xl font-bold text-foreground mb-4">Manage your farms with confidence</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join thousands of farmers who trust LiveStockPro to optimize their operations and increase productivity.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-200">
                      <span className="text-sm font-semibold text-primary-400">✓</span>
                    </div>
                    <span className="text-sm">Multi-farm management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-200">
                      <span className="text-sm font-semibold text-primary-400">✓</span>
                    </div>
                    <span className="text-sm">Real-time analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-200">
                      <span className="text-sm font-semibold text-primary-400">✓</span>
                    </div>
                    <span className="text-sm">Mobile access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

export default Login
