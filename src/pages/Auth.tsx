import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Brain, Camera, FolderOpen, Search } from "lucide-react";
import { z } from "zod";
import memoryIcon from "@/assets/memory-icon.png";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email and password
      emailSchema.parse(formData.email);
      passwordSchema.parse(formData.password);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.fullName },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to Remindly AI. Redirecting...",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Authentication failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center px-6 py-12">
      {/* Hero Section */}
      <div className="animate-fade-in mb-12 text-center">
        <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <img src={memoryIcon} alt="Remindly AI" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-5xl font-pacifico text-foreground mb-3">Remindly AI</h1>
        <p className="text-muted-foreground text-lg">Your intelligent memory companion</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-medium border border-border">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to access your memories" : "Join and start organizing your memories"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <Input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required={!isLogin}
                className="h-14 px-6 rounded-2xl bg-muted border-0 focus-visible:ring-primary"
              />
            )}
            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-14 px-6 rounded-2xl bg-muted border-0 focus-visible:ring-primary"
            />
            <Input
              type="password"
              placeholder={isLogin ? "Enter your password" : "Create Password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-14 px-6 rounded-2xl bg-muted border-0 focus-visible:ring-primary"
            />

            {/* Feature highlights for signup */}
            {!isLogin && (
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Camera className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Capture</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <FolderOpen className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Organize</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Search className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Recall</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl text-base font-semibold transition-all hover:shadow-glow"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <span className="font-semibold text-primary">Sign Up</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="font-semibold text-primary">Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
