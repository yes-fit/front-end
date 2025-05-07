import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { BookingSlot } from "@/lib/api/mockData"; // Ensure this path is correct

// Define User type including token
type User = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  token?: string; // Optional token property
};

type RegisterData = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  dob: string;
  gender: "male" | "female" | "other";
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  getUserBookings: () => Promise<void>; // Ensure this matches the implementation
  isLoading: boolean;
  authError: string | null;
  bookings: BookingSlot[]; // State for bookings
};

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren<{}>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingSlot[]>([]); // State for bookings

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const decoded = jwtDecode<User & { exp: number }>(storedToken);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) throw new Error("Token expired");

          setUser({ ...decoded, token: storedToken }); // Store token in user object
        } catch (error) {
          console.error("Auth error:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch("https://gym-application2.onrender.com/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      const receivedToken = data.token;
      const decoded: User = jwtDecode(receivedToken);

      localStorage.setItem("token", receivedToken);
      setUser({ ...decoded, token: receivedToken }); // Store token in user object
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "An unexpected error occurred during login.");
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch("https://gym-application2.onrender.com/api/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (!response.ok || responseData.responseCode !== "00") {
        throw new Error(responseData.responseMessage || "Registration failed");
      }

      toast.success(responseData.responseMessage || "Registration successful!");
    } catch (error: any) {
      console.error("Registration error:", error);
      setAuthError(error.message || "An unexpected error occurred during registration.");
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getUserBookings = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`https://gym-application2.onrender.com/api/v1/bookings?userId=${user?.id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch bookings");

      setBookings(data.bookings); // Assuming the response format contains bookings
    } catch (error: any) {
      console.error("Fetching bookings error:", error);
      setAuthError(error.message || "An unexpected error occurred while fetching bookings.");
      toast.error(error.message || "Failed to fetch bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setAuthError(null);
    setBookings([]); // Clear bookings on logout
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, getUserBookings, isLoading, authError, bookings }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}