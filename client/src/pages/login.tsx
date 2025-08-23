import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { setToken, setCurrentUser } from "@/lib/auth";
import { loadUserPermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

export default function LoginPage() {
  const { toast } = useToast();
  const [error, setError] = useState<string>("");
  
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async (data) => {
      setToken(data.token);
      setCurrentUser(data.user);
      
      // Load user permissions for RBAC
      try {
        await loadUserPermissions(data.user.id);
      } catch (error) {
        console.error('Failed to load user permissions:', error);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
      window.location.reload(); // Refresh to update auth state
    },
    onError: (error: any) => {
      setError(error.message || "Login failed");
    },
  });

  const onSubmit = (data: LoginData) => {
    setError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Heart className="text-white text-2xl" size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-text-primary">CareConnect</CardTitle>
          <p className="text-text-secondary">Healthcare Management System</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" data-testid="error-alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-text-primary">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@clinic.com"
                data-testid="input-email"
                {...form.register("email")}
                className="w-full mt-1"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1" data-testid="error-email">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-text-primary">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                data-testid="input-password"
                {...form.register("password")}
                className="w-full mt-1"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1" data-testid="error-password">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <a href="#" className="text-primary hover:text-primary-dark text-sm">
              Forgot your password?
            </a>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-text-secondary">
            <strong>Demo Credentials:</strong><br />
            Email: admin@clinic.com<br />
            Password: admin123
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
