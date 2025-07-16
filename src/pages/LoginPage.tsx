import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth"; 
import { Navigate } from "react-router-dom"; 
import { Loader2 } from "lucide-react";

// Login and Register form schemas
const loginSchema = z.object({
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
});

// Type definitions
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function LoginPage() {
  const { user, login, register: registerUser, isLoading, authError } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const formMethods = useForm<LoginValues | RegisterValues>({
    resolver: zodResolver(isRegistering ? registerSchema : loginSchema),
  });

  const onSubmit = async (values: LoginValues | RegisterValues) => {
    if (isRegistering) {
      const registrationValues = values as RegisterValues; 
      try {
        await registerUser({
          username: registrationValues.username,
          fullName: registrationValues.fullName,
          email: registrationValues.email,
          password: registrationValues.password,
          dob: registrationValues.dob,
          gender: registrationValues.gender,
        });
      } catch (error) {
        console.error("Registration error:", error);
      }
    } else {
      const loginValues = values as LoginValues; 
      try {
        await login(loginValues.email, loginValues.password);
      } catch (error) {
        console.error("Login error:", error);
      }
    }
  };

  // Redirect if user is logged in
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-blue-800 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">{isRegistering ? "Register" : "Login"}</h2>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} className="w-full max-w-md flex flex-col space-y-4 bg-white p-6 rounded-lg shadow-md">
        {isRegistering && (
          <>
            <Input {...formMethods.register("username")} placeholder="Username" />
            <Input {...formMethods.register("fullName")} placeholder="Full Name" />
            <Input {...formMethods.register("dob")} type="date" placeholder="Date of Birth" />
            <select {...formMethods.register("gender")} className="p-2 border border-gray-300 rounded">
              <option value="" disabled>Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </>
        )}
        <Input {...formMethods.register("email")} placeholder="Email" />
        <Input {...formMethods.register("password")} type="password" placeholder="Password" />
        {authError && <p className="text-red-500">{authError}</p>}
        <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700 transition">
          {isLoading ? <Loader2 className="animate-spin" /> : isRegistering ? "Register" : "Sign In"}
        </Button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)} className="mt-4 text-white hover:underline">
        {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
      </button>
    </div>
  );
}