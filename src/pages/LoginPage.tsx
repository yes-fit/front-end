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
  const [isRegistering, setIsRegistering] = useState(true); // Show registration by default
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

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setRegistrationStatus("loading");
    setAuthError(null); // Clear any previous errors
    try {
      
      
      
       const response = await fetch("https://gym-application-gsim.onrender.com/api/v1/register", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify(values),
       });

       const data = await response.json();

       if (!response.ok) {
         throw new Error(data.responseMessage || "Registration failed");
       }

      setRegistrationStatus("success");
      //automatically log in the user after successful registration
      // await login(values.email, values.password);
      // navigate("/dashboard"); // Or navigate to login page
    } catch (error: any) {
      setRegistrationStatus("error");
      setAuthError(error.message || "An unexpected error occurred during registration.");
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="container max-w-lg py-12">
      <Card className="mx-auto w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isRegistering ? "Register New User" : "Enterprise Gym Login"}
          </CardTitle>
          <CardDescription>
            {isRegistering ? "Enter your details to create an account" : "Enter your enterprise email and password to sign in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRegistering ? (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
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
                <FormField
                  control={registerForm.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth (DD-MM-YYYY)</FormLabel>
                      <FormControl>
                        <Input placeholder="DD-MM-YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
                <Button type="submit" className="w-full" disabled={registrationStatus === "loading"}>
                  {registrationStatus === "loading" ? "Registering..." : "Register"}
                </Button>
                {registrationStatus === "success" && (
                  <p className="text-sm font-medium text-green-600">Registration successful! You can now log in.</p>
                )}
                 {registrationStatus === "error" && (
                  <p className="text-sm font-medium text-destructive">{authError || "Registration failed. Please try again."}</p>
                 )}
              </form>
            </Form>
          ) : (
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
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            {isRegistering ? (
              <>
                Already have an account?{" "}
                <Button variant="link" onClick={() => setIsRegistering(false)} className="p-0 h-auto">
                  Sign In
                </Button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Button variant="link" onClick={() => setIsRegistering(true)} className="p-0 h-auto">
                  Register
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
