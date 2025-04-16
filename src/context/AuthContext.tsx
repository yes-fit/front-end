import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        try {
          // In a real app, verify the token with the backend
          const decoded = jwtDecode<User & { exp: number }>(storedToken);

          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            throw new Error("Token expired");
          }

          setUser({
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
          });
          setToken(storedToken);
        } catch (error) {
          console.error("Auth error:", error);
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function - simulated for frontend demo
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll simulate a successful login with mock data
      if (!email.includes("@") || password.length < 6) {
        throw new Error("Invalid credentials");
      }

      // Mock token response
      const isAdmin = email.includes("admin");
      const mockUser: User = {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: email.split("@")[0],
        role: isAdmin ? "admin" : "user",
      };

      // Create a mock JWT token (in a real app, this comes from the server)
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify({
          ...mockUser,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
        })
      )}.mockSignature`;

      localStorage.setItem("token", mockToken);
      setUser(mockUser);
      setToken(mockToken);

      // Return success, let the login component handle navigation
      toast.success(isAdmin ? "Welcome, Admin!" : "Login successful!");
      return;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    toast.success("Logged out successfully");
    // Navigation will be handled by the component that calls logout
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
