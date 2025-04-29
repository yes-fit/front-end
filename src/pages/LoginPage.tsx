import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

// Define form schema
const formSchema = z.object({
  email: z.string().email("Must be a valid email").min(5, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerFormSchema = z.object({
  username: z.string().min(3, "Username is required"),
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Must be a valid email").min(5, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  dob: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date of birth must be in DD-MM-YYYY format"),
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
});

type FormValues = z.infer<typeof formSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // If already logged in, redirect to appropriate dashboard
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      dob: "",
      gender: undefined,
    },
  });
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} />;
  }

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setAuthError(null);
      await login(values.email, values.password);

      // After successful login, navigate based on role
      // Check if email contains 'admin' to determine role
      if (values.email.includes("admin")) {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setAuthError("Invalid credentials. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="container max-w-lg py-12">
      <Card className="mx-auto w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Enterprise Gym Login</CardTitle>
          <CardDescription>
            Enter your enterprise email and password to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enterprise Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.name@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Demo logins:</p>
            <p>Regular user: employee@company.com / password123</p>
            <p>Admin: admin@company.com / password123</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
